document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('reports-table-body');
    const emptyState = document.getElementById('empty-state');
    const modal = document.getElementById('report-modal');
    const modalClose = document.getElementById('modal-close');
    
    let allReports = [];
    let currentReport = null;

    // Create table row for each report
    function createReportRow(report) {
        const tr = document.createElement('tr');
        tr.classList.add('report-row');
        tr.dataset.reportId = report.report_id;

        // Format date
        const date = new Date(report.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        // Determine report type and target
        let reportType = '';
        let reportTarget = '';
        
        if (report.reported_item_id) {
            reportType = 'Item Report';
            reportTarget = report.item_title || `Item ID: ${report.reported_item_id}`;
        } else if (report.reported_user_id) {
            reportType = 'User Report';
            reportTarget = report.reported_username || `@user_${report.reported_user_id}`;
        }

        // Truncate description
        const description = report.description && report.description.length > 50
            ? report.description.slice(0, 50) + '...'
            : report.description || 'No description';

        tr.innerHTML = `
            <td class="report-id">#RPT-${String(report.report_id).padStart(3, '0')}</td>
            <td class="report-target">
                <strong>${reportTarget}</strong>
                <br><small>${reportType}</small>
            </td>
            <td class="reporter">${report.reporter_email || 'Unknown'}</td>
            <td class="description">${description}</td>
            <td class="date">${formattedDate}</td>
            <td class="actions">
                <button class="btn-view" data-id="${report.report_id}">View</button>
                <button class="btn-ban-small" data-id="${report.report_id}">Ban</button>
            </td>
        `;

        return tr;
    }

    // Load all reports
    function loadReports() {
        fetch('/BidOps/server/report/get_reports.php')
            .then(res => res.json())
            .then(data => {
                console.log('Reports fetched:', data);
                
                if (!data.success) {
                    console.error('Error:', data.message);
                    showEmptyState();
                    return;
                }

                allReports = data.reports || [];
                
                if (allReports.length === 0) {
                    showEmptyState();
                } else {
                    hideEmptyState();
                    renderReports(allReports);
                    updatePaginationInfo(allReports.length);
                }
            })
            .catch(err => {
                console.error('Error loading reports:', err);
                showEmptyState();
            });
    }

    // Render reports to table
    function renderReports(reports) {
        tableBody.innerHTML = '';
        reports.forEach(report => {
            const row = createReportRow(report);
            tableBody.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', function() {
                const reportId = this.dataset.id;
                openReportModal(reportId);
            });
        });

        // Add event listeners to ban buttons
        document.querySelectorAll('.btn-ban-small').forEach(btn => {
            btn.addEventListener('click', function() {
                const reportId = this.dataset.id;
                handleBanAction(reportId);
            });
        });
    }

    // Show empty state
    function showEmptyState() {
        document.querySelector('.reports-table-container').classList.add('hidden');
        emptyState.classList.remove('hidden');
    }

    // Hide empty state
    function hideEmptyState() {
        document.querySelector('.reports-table-container').classList.remove('hidden');
        emptyState.classList.add('hidden');
    }

    // Update pagination info
    function updatePaginationInfo(total) {
        document.getElementById('pagination-info').textContent = `Showing 1-${total} of ${total} reports`;
    }

    // Open report details modal
    function openReportModal(reportId) {
        const report = allReports.find(r => r.report_id == reportId);
        if (!report) return;

        currentReport = report;

        // Populate modal
        document.getElementById('modal-report-id').textContent = `#RPT-${String(report.report_id).padStart(3, '0')}`;
        
        // Determine type and target
        let reportType = '';
        let reportTarget = '';
        if (report.reported_item_id) {
            reportType = 'Item Report';
            reportTarget = report.item_title || `Item ID: ${report.reported_item_id}`;
        } else if (report.reported_user_id) {
            reportType = 'User Report';
            reportTarget = report.reported_username || `@user_${report.reported_user_id}`;
        }

        document.getElementById('modal-report-type').textContent = reportType;
        document.getElementById('modal-reported-target').textContent = reportTarget;
        document.getElementById('modal-reporter').textContent = report.reporter_email || 'Unknown';
        
        const date = new Date(report.created_at);
        document.getElementById('modal-date').textContent = date.toLocaleString();
        
        document.getElementById('modal-description').textContent = report.description || 'No description provided';

        // Show modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        currentReport = null;
    }

    modalClose.addEventListener('click', closeModal);

    // Click outside modal to close
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Modal action buttons
    document.getElementById('modal-view-item').addEventListener('click', function() {
        if (!currentReport) return;
        
        if (currentReport.reported_item_id) {
            // Redirect to item page
            window.location.href = `view-item.html?id=${currentReport.reported_item_id}`;
        } else if (currentReport.reported_user_id) {
            // Redirect to user profile
            window.location.href = `view-user.html?id=${currentReport.reported_user_id}`;
        }
    });

    document.getElementById('modal-ban').addEventListener('click', function() {
        if (!currentReport) return;
        handleBanAction(currentReport.report_id);
    });

    document.getElementById('modal-dismiss').addEventListener('click', function() {
        if (!currentReport) return;
        handleDismissReport(currentReport.report_id);
    });

    // Handle ban action
    function handleBanAction(reportId) {
        const report = allReports.find(r => r.report_id == reportId);
        if (!report) return;

        const confirmMsg = report.reported_item_id
            ? 'Are you sure you want to ban this item and the user who posted it?'
            : 'Are you sure you want to ban this user?';

        if (!confirm(confirmMsg)) return;

        const targetId = report.reported_item_id || report.reported_user_id;
        const targetType = report.reported_item_id ? 'item' : 'user';

        fetch('/BidOps/server/report/ban_target.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report_id: reportId,
                target_id: targetId,
                target_type: targetType
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Action completed successfully');
                closeModal();
                loadReports();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Failed to complete action');
        });
    }

    // Handle dismiss report
    function handleDismissReport(reportId) {
        if (!confirm('Are you sure you want to dismiss this report?')) return;

        fetch('/BidOps/server/report/dismiss_report.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Report dismissed successfully');
                closeModal();
                loadReports();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Failed to dismiss report');
        });
    }

    // Filters
    document.getElementById('apply-filters').addEventListener('click', function() {
        const filterType = document.getElementById('filter-type').value;
        const filterDate = document.getElementById('filter-date').value;
        const filterSort = document.getElementById('filter-sort').value;

        let filtered = [...allReports];

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(r => {
                if (filterType === 'item') return r.reported_item_id;
                if (filterType === 'user') return r.reported_user_id;
                return true;
            });
        }

        // Filter by date
        if (filterDate) {
            const selectedDate = new Date(filterDate).toDateString();
            filtered = filtered.filter(r => {
                const reportDate = new Date(r.created_at).toDateString();
                return reportDate === selectedDate;
            });
        }

        // Filter by time range
        if (filterSort !== 'all') {
            const now = new Date();
            filtered = filtered.filter(r => {
                const reportDate = new Date(r.created_at);
                const diffTime = Math.abs(now - reportDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (filterSort === 'today') return diffDays <= 1;
                if (filterSort === 'week') return diffDays <= 7;
                if (filterSort === 'month') return diffDays <= 30;
                return true;
            });
        }

        renderReports(filtered);
        updatePaginationInfo(filtered.length);
    });

    // Initial load
    loadReports();
});