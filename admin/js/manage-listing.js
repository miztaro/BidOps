document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Security Check (Node.js Logic)
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
        window.location.href = 'login.html';
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
                    window.location.href = 'login.html';
                });
            }
        });

    const listingContainer = document.getElementById('listing-container');
    const emptyState = document.getElementById('empty-state');

    // 3. Global Function for Buttons
    window.processItem = function(id, action) {
        if(!confirm(`Are you sure you want to ${action} this item?`)) return;
        
        fetch(`/api/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: id })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert(`Item ${action}ed successfully!`);
                loadItems(); // Refresh
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(err => console.error(err));
    };

    function createItemCard(item) {
        const article = document.createElement('article');
        article.classList.add('item-card');
        
        const viewLink = (item.category_type === 'swap') ? 'view-swapitem.html' : 'view-biditem.html';

        article.innerHTML = `
            <div class="item-content">
                <h3 class="item-title">${item.title || 'No Title'}</h3>
                <p class="item-desc">${(item.description || '').substring(0, 100)}...</p>
                <div class="item-meta">
                    <span class="category">${item.category_type || 'Uncategorized'}</span>
                    <span class="user">Submitted by: ${item.seller_name || item.seller_id}</span>
                    <span class="date">${item.created_date ? new Date(item.created_date).toLocaleDateString() : ''}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="approve" onclick="processItem('${item.item_id}', 'approve')">Approve</button>
                <button class="reject" onclick="processItem('${item.item_id}', 'reject')">Reject</button>
                <a href="${viewLink}?item_id=${item.item_id}" class="view-btn" style="margin-left:5px; text-decoration:none; color:#0d2e5bf6; font-weight:bold;">View</a>
            </div>
        `;
        return article;
    }

    function loadItems() {
        const cat = document.getElementById('filter-category').value;
        const date = document.getElementById('filter-date').value;
        const sort = document.getElementById('filter-sort').value;

        let url = `/api/listings?category=${cat}&sort=${sort}`;
        if(date) url += `&date=${date}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                listingContainer.innerHTML = '';
                if (data.success && data.data.length > 0) {
                    if(emptyState) emptyState.classList.add('hidden');
                    data.data.forEach(item => {
                        listingContainer.appendChild(createItemCard(item));
                    });
                } else {
                    if(emptyState) emptyState.classList.remove('hidden');
                }
            })
            .catch(err => console.error(err));
    }

    // Attach Event Listeners
    const applyBtn = document.getElementById('apply-filters');
    if(applyBtn) applyBtn.addEventListener('click', loadItems);

    loadItems();
});