const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Uses your existing database connection

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. STATIC FILE SERVING
// ==========================================

// A. Serve ASSETS (Images/Fonts)
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// B. Serve ADMIN STYLES
app.use('/styles', express.static(path.join(__dirname, '../admin/styles')));

// C. Serve ADMIN JS
app.use('/js', express.static(path.join(__dirname, '../admin/js')));

// D. Serve CLIENT Folder
app.use('/client', express.static(path.join(__dirname, '../client')));

// E. Legacy Redirects
app.use('/BidOps/client', express.static(path.join(__dirname, '../client')));

// F. Serve Uploads
app.use('/server/item/uploads', express.static(path.join(__dirname, '../server/item/uploads')));

// G. Serve ADMIN HTML as root
app.use(express.static(path.join(__dirname, '../admin')));


// ==========================================
// 2. ADMIN API ROUTES
// ==========================================

/**
 * GET /api/admin/stats
 * Fetches real counts for the dashboard cards.
 */
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [
            [pendingListings],
            [openReports],
            [activeUsers],
            [liveItems]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) as count FROM item WHERE status = 'pending_approval'"),
            db.query("SELECT COUNT(*) as count FROM report WHERE status = 'pending'"),
            db.query("SELECT COUNT(*) as count FROM user WHERE is_banned = 0"), 
            db.query("SELECT COUNT(*) as count FROM item WHERE status = 'active'")
        ]);

        res.json({
            success: true,
            stats: {
                pending_listings: pendingListings[0].count,
                open_reports: openReports[0].count,
                active_users: activeUsers[0].count,
                total_items: liveItems[0].count
            }
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * GET /api/admin/analytics
 */
app.get('/api/admin/analytics', async (req, res) => {
    try {
        // Query: Get item counts grouped by date
        // ORDER BY date DESC LIMIT 7 gets the most recent 7 days with data
        const itemQuery = `
            SELECT DATE(created_date) as date, COUNT(*) as count 
            FROM item 
            GROUP BY DATE(created_date)
            ORDER BY date DESC
            LIMIT 7
        `;

        const [itemStats] = await db.query(itemQuery);

        // Reverse array so the graph goes from Left (Oldest) to Right (Newest)
        itemStats.reverse();

        res.json({
            success: true,
            chartData: {
                items: itemStats,
                users: [] // Sending empty array because user table has no date column
            }
        });
    } catch (err) {
        console.error("Analytics Error:", err);
        // Return empty structure on error so frontend doesn't crash
        res.json({ success: false, chartData: { items: [], users: [] } }); 
    }
});

/**
 * GET /api/admin/recent-activity
 */
app.get('/api/admin/recent-activity', async (req, res) => {
    try {
        const query = `
            (SELECT 'new_listing' as type, title as description, created_date as date 
             FROM item ORDER BY created_date DESC LIMIT 5)
            UNION
            (SELECT 'new_report' as type, description, created_at as date 
             FROM report ORDER BY created_at DESC LIMIT 5)
            ORDER BY date DESC LIMIT 5
        `;

        const [rows] = await db.query(query);
        res.json({ success: true, activity: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// A. DASHBOARD / LISTINGS API
app.get('/api/listings', async (req, res) => {
    try {
        const { category, date, sort } = req.query;
        
        let query = `
            SELECT i.*, u.username as seller_name 
            FROM item i 
            JOIN user u ON i.seller_id = u.user_id 
            WHERE i.status = 'pending_approval'
        `;
        
        const params = [];

        if (category && category !== 'all') {
            query += ` AND i.category_type = ?`;
            params.push(category);
        }
        if (date) {
            query += ` AND DATE(i.created_date) = ?`;
            params.push(date);
        }
        if (sort === 'today') query += ` AND DATE(i.created_date) = CURDATE()`;
        else if (sort === 'week') query += ` AND i.created_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
        else if (sort === 'month') query += ` AND i.created_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;

        query += ` ORDER BY i.created_date DESC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// B. APPROVE / REJECT ACTIONS
app.post('/api/approve', async (req, res) => {
    try {
        await db.query("UPDATE item SET status = 'active' WHERE item_id = ?", [req.body.item_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/reject', async (req, res) => {
    try {
        await db.query("UPDATE item SET status = 'approval_rejected' WHERE item_id = ?", [req.body.item_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// C. REPORTS API
app.get('/api/reports', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.username as reporter_username, u.email as reporter_email
            FROM report r
            LEFT JOIN user u ON r.reporter_id = u.user_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
        `;
        const [reports] = await db.query(query);

        const detailedReports = await Promise.all(reports.map(async (report) => {
            if (report.reported_id) {
                const [items] = await db.query("SELECT item_id, title, category_type, seller_id FROM item WHERE item_id = ?", [report.reported_id]);
                if (items.length > 0) {
                    return { ...report, 
                        reported_item_id: items[0].item_id, 
                        item_title: items[0].title, 
                        report_type: 'item' 
                    };
                }
                const [users] = await db.query("SELECT user_id, username, email FROM user WHERE user_id = ?", [report.reported_id]);
                if (users.length > 0) {
                    return { ...report, 
                        reported_user_id: users[0].user_id, 
                        reported_username: users[0].username, 
                        report_type: 'user' 
                    };
                }
            }
            return { ...report, report_type: 'unknown' };
        }));

        res.json({ success: true, reports: detailedReports });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// D. BAN API
app.post('/api/ban', async (req, res) => {
    const { report_id, target_id, target_type } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        if (target_type === 'item') {
            await conn.query("UPDATE item SET status = 'approval_rejected' WHERE item_id = ?", [target_id]);
            const [rows] = await conn.query("SELECT seller_id FROM item WHERE item_id = ?", [target_id]);
            if(rows.length > 0) await conn.query("UPDATE user SET is_banned = 1 WHERE user_id = ?", [rows[0].seller_id]);
        } 
        else if (target_type === 'user') {
            await conn.query("UPDATE user SET is_banned = 1 WHERE user_id = ?", [target_id]);
        }

        if(report_id) await conn.query("UPDATE report SET status = 'resolved' WHERE report_id = ?", [report_id]);

        await conn.commit();
        res.json({ success: true, message: 'Banned successfully' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        conn.release();
    }
});

// E. DISMISS REPORT
app.post('/api/dismiss-report', async (req, res) => {
    try {
        await db.query("UPDATE report SET status = 'rejected' WHERE report_id = ?", [req.body.report_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// F. VIEW ITEM DETAILS
app.get('/api/item/:id', async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT i.*, u.username as seller_name, u.email as seller_email 
            FROM item i 
            LEFT JOIN user u ON i.seller_id = u.user_id 
            WHERE i.item_id = ?`, [req.params.id]);
        
        if (items.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });

        const [images] = await db.query("SELECT * FROM itemimage WHERE item_id = ?", [req.params.id]);
        
        const [bids] = await db.query(`
            SELECT b.*, u.username as bidder_name 
            FROM bidoffer b 
            LEFT JOIN user u ON b.bidder_id = u.user_id 
            WHERE b.item_id = ? ORDER BY b.bid_amount DESC`, [req.params.id]);

        res.json({ success: true, item: items[0], images, bidding_history: bids });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// G. DELETE ITEM
app.delete('/api/item/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM item WHERE item_id = ?", [req.params.id]);
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
// H. GET USER PROFILE (For Admin View Modal)
app.get('/api/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Query the user table
        const [users] = await db.query(
            "SELECT user_id, username, email, is_banned, warning_count FROM user WHERE user_id = ?", 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: users[0] });

    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Admin Server running at http://0.0.0.0:${PORT}`);
});