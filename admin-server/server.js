const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Uses the database.js we created

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. SERVE STATIC FILES ---
// This serves the Admin HTML files
app.use(express.static(path.join(__dirname, '../admin')));

// Serve Assets (Fonts/Images)
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Serve Uploads (User Images)
app.use('/server/item/uploads', express.static(path.join(__dirname, '../server/item/uploads')));


// --- 2. ADMIN API ROUTES ---

// A. DASHBOARD / LISTINGS API
app.get('/api/listings', async (req, res) => {
    try {
        const { category, date, sort } = req.query;
        
        // FIX #1: Status in your DB is 'pending_approval', NOT 'pending'
        let query = `
            SELECT i.*, u.username as seller_name 
            FROM item i 
            JOIN user u ON i.seller_id = u.user_id 
            WHERE i.status = 'pending_approval'
        `;
        
        const params = [];

        // Filters
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
        // FIX #2: Status in DB is 'approval_rejected'
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

        // Get details for what was reported (User or Item)
        const detailedReports = await Promise.all(reports.map(async (report) => {
            if (report.reported_id) {
                // Check Item
                const [items] = await db.query("SELECT item_id, title, category_type, seller_id FROM item WHERE item_id = ?", [report.reported_id]);
                if (items.length > 0) {
                    return { ...report, 
                        reported_item_id: items[0].item_id, 
                        item_title: items[0].title, 
                        report_type: 'item' 
                    };
                }
                // Check User
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
            // FIX #3: 'banned' is not in your Enum. Using 'approval_rejected' instead.
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

        // FIX #4: Table name is 'itemimage'
        const [images] = await db.query("SELECT * FROM itemimage WHERE item_id = ?", [req.params.id]);
        
        // FIX #5: Table name is 'bidoffer'
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


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Admin Server running at http://0.0.0.0:${PORT}`);
});