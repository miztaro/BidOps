document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Security Check
    if (localStorage.getItem('role') !== 'admin') {
        window.location.href = '/BidOps/client/login.html';
        return;
    }

    // 2. Load Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            const logoutBtn = document.getElementById('logoutBtn');
            if(logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.clear();
                    window.location.href = '/BidOps/client/login.html';
                });
            }
        });

    const tableBody = document.getElementById('reports-table-body');
    const emptyState = document.getElementById('empty-state');
    const modal = document.getElementById('report-modal');
    
    let allReports = [];
    let currentReport = null;

    // --- Global Functions ---
    window.openModal = function(id) {
        currentReport = allReports.find(r => r.report_id == id);
        if(!currentReport) return;

        document.getElementById('modal-report-id').textContent = id;
        document.getElementById('modal-report-type').textContent = currentReport.report_type;
        
        let targetName = "Unknown";
        if(currentReport.report_type === 'item') targetName = `Item: ${currentReport.item_title}`;
        else if(currentReport.report_type === 'user') targetName = `User: ${currentReport.reported_username}`;
        
        document.getElementById('modal-reported-target').textContent = targetName;
        document.getElementById('modal-reporter').textContent = currentReport.reporter_email || 'Unknown';
        document.getElementById('modal-description').textContent = currentReport.description;
        document.getElementById('modal-date').textContent = new Date(currentReport.created_at).toLocaleString();

        modal.classList.remove('hidden');
    };

    window.banTarget = function(id) {
        const reportId = id || (currentReport ? currentReport.report_id : null);
        if(!reportId) return;

        const report = allReports.find(r => r.report_id == reportId);
        if(!confirm('Ban this target?')) return;

        const targetId = report.reported_item_id || report.reported_user_id;
        const targetType = report.reported_item_id ? 'item' : 'user';

        fetch('/api/ban', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ report_id: reportId, target_id: targetId, target_type: targetType })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if(data.success) {
                modal.classList.add('hidden');
                loadReports();
            }
        });
    };

    function loadReports() {
        fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.reports.length > 0) {
                allReports = data.reports;
                if(emptyState) emptyState.classList.add('hidden');
                if(tableBody) {
                    tableBody.innerHTML = '';
                    allReports.forEach(r => {
                        const tr = document.createElement('tr');
                        let target = r.report_type === 'item' ? r.item_title : r.reported_username;
                        
                        tr.innerHTML = `
                            <td>#${r.report_id}</td>
                            <td>${target}<br><small>${r.report_type}</small></td>
                            <td>${r.reporter_email}</td>
                            <td>${(r.description || '').slice(0,50)}...</td>
                            <td>${new Date(r.created_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn-view" onclick="openModal('${r.report_id}')">View</button>
                                <button class="btn-ban-small" onclick="banTarget('${r.report_id}')">Ban</button>
                            </td>
                        `;
                        tableBody.appendChild(tr);
                    });
                }
            } else {
                if(emptyState) emptyState.classList.remove('hidden');
            }
        })
        .catch(err => console.error(err));
    }

    // Modal Actions
    const closeBtn = document.getElementById('modal-close');
    if(closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    const banBtn = document.getElementById('modal-ban');
    if(banBtn) banBtn.onclick = () => window.banTarget();

    const dismissBtn = document.getElementById('modal-dismiss');
    if(dismissBtn) {
        dismissBtn.onclick = () => {
            if(!currentReport) return;
            fetch('/api/dismiss-report', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ report_id: currentReport.report_id })
            }).then(res => res.json()).then(data => {
                alert(data.message);
                modal.classList.add('hidden');
                loadReports();
            });
        };
    }

    const viewItemBtn = document.getElementById('modal-view-item');
    if(viewItemBtn) {
        viewItemBtn.onclick = () => {
            if(currentReport && currentReport.reported_item_id) {
                window.location.href = `view-biditem.html?item_id=${currentReport.reported_item_id}`;
            } else {
                alert("User view not implemented");
            }
        };
    }

    loadReports();
});