document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Load Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
        })
        .catch(err => console.error("Header load error:", err));

    // 2. DOM Elements
    const tableBody = document.getElementById('reports-table-body');
    const emptyState = document.getElementById('empty-state');
    const paginationInfo = document.getElementById('pagination-info');
    const modal = document.getElementById('report-modal');

    // 3. State Management
    let allReports = []; // Stores raw data from server
    let currentReport = null; // Stores currently selected report for modal

    // 4. Fetch Reports on Load
    loadReports();

    function loadReports() {
        fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allReports = data.reports;
                applyFilters(); // Initial render
            } else {
                console.error("Failed to fetch reports");
            }
        })
        .catch(err => console.error(err));
    }

    // 5. Filtering & Sorting Logic
    function applyFilters() {
        const typeFilter = document.getElementById('filter-type').value;
        const dateInput = document.getElementById('filter-date').value;
        const sortFilter = document.getElementById('filter-sort').value;

        let filtered = [...allReports];

        // A. Filter by Type (Item vs User)
        if (typeFilter !== 'all') {
            filtered = filtered.filter(r => r.report_type === typeFilter);
        }

        // B. Filter by Specific Date Input
        if (dateInput) {
            filtered = filtered.filter(r => {
                // Convert DB date (YYYY-MM-DD HH:MM:SS) to YYYY-MM-DD
                const reportDate = new Date(r.created_at).toISOString().split('T')[0];
                return reportDate === dateInput;
            });
        }

        // C. Filter/Sort by Time Range (Today, Week, Month)
        const now = new Date();
        if (sortFilter === 'today') {
            filtered = filtered.filter(r => new Date(r.created_at).toDateString() === now.toDateString());
        } else if (sortFilter === 'week') {
            const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            filtered = filtered.filter(r => new Date(r.created_at) >= lastWeek);
        } else if (sortFilter === 'month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
            filtered = filtered.filter(r => new Date(r.created_at) >= lastMonth);
        }

        // Default Sort: Newest First
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        renderTable(filtered);
    }

    // 6. Render Table
    function renderTable(reportsData) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (reportsData.length === 0) {
            emptyState.classList.remove('hidden');
            paginationInfo.textContent = 'Showing 0 reports';
            return;
        }

        emptyState.classList.add('hidden');
        paginationInfo.textContent = `Showing ${reportsData.length} reports`;

        reportsData.forEach(r => {
            const tr = document.createElement('tr');
            
            // Determine display name for target
            let targetName = 'Unknown';
            if(r.report_type === 'item') targetName = r.item_title || 'Item Deleted';
            else if(r.report_type === 'user') targetName = r.reported_username || 'User Deleted';

            // Determine Label Color
            const typeBadge = r.report_type === 'item' 
                ? '<span style="color:#00306e; font-weight:bold; font-size:12px;">ITEM</span>' 
                : '<span style="color:#d97706; font-weight:bold; font-size:12px;">USER</span>';

            tr.innerHTML = `
                <td>#${r.report_id}</td>
                <td>
                    <div style="font-weight:600;">${targetName}</div>
                    ${typeBadge}
                </td>
                <td>${r.reporter_email || 'Anonymous'}</td>
                <td class="desc-cell" title="${r.reason}">${(r.reason || '').substring(0, 50)}...</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-view" onclick="openReportModal(${r.report_id})">Review</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // 7. Modal Functions (Exposed to Window for HTML onclick attributes)
    window.openReportModal = function(id) {
        currentReport = allReports.find(r => r.report_id == id);
        if(!currentReport) return;

        document.getElementById('modal-report-id').textContent = '#' + currentReport.report_id;
        document.getElementById('modal-report-type').textContent = currentReport.report_type.toUpperCase();
        
        let targetName = "Unknown";
        if(currentReport.report_type === 'item') targetName = `${currentReport.item_title} (ID: ${currentReport.reported_item_id})`;
        else if(currentReport.report_type === 'user') targetName = `${currentReport.reported_username} (ID: ${currentReport.reported_user_id})`;
        
        document.getElementById('modal-reported-target').textContent = targetName;
        document.getElementById('modal-reporter').textContent = currentReport.reporter_email;
        document.getElementById('modal-description').textContent = currentReport.reason; // Note: SQL uses 'reason', not description
        document.getElementById('modal-date').textContent = new Date(currentReport.created_at).toLocaleString();

        modal.classList.remove('hidden');
    };

    // 8. Event Listeners for Filters
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    // Optional: Auto-filter on change
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-sort').addEventListener('change', applyFilters);

    // 9. Modal Action: Ban
    document.getElementById('modal-ban').addEventListener('click', function() {
        if(!currentReport) return;
        if(!confirm('Are you sure you want to BAN this target? This action resolves the report.')) return;

        const targetId = currentReport.report_type === 'item' ? currentReport.reported_item_id : currentReport.reported_user_id;
        
        fetch('/api/ban', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                report_id: currentReport.report_id,
                target_id: targetId,
                target_type: currentReport.report_type
            })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if(data.success) {
                modal.classList.add('hidden');
                loadReports(); // Refresh table
            }
        });
    });

    // 10. Modal Action: Dismiss
    document.getElementById('modal-dismiss').addEventListener('click', function() {
        if(!currentReport) return;
        if(!confirm('Dismiss this report? Status will be set to Rejected.')) return;

        fetch('/api/dismiss-report', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ report_id: currentReport.report_id })
        })
        .then(res => res.json())
        .then(data => {
            alert('Report dismissed.');
            modal.classList.add('hidden');
            loadReports(); // Refresh table
        });
    });

    // 11. Modal Action: View Target (Redirects to client page)
    document.getElementById('modal-view-item').addEventListener('click', function() {
        if(!currentReport) return;

        if(currentReport.report_type === 'item') {
            window.open(`../client/item-details.html?id=${currentReport.reported_item_id}`, '_blank');
        } else {
            window.viewUserProfile(currentReport.reported_user_id);
        }
    });

    // 12. Close Modal
    document.getElementById('modal-close').onclick = () => modal.classList.add('hidden');
    
    // Close on click outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.add('hidden');
        }
    }
});