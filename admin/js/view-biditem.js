document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem('role') !== 'admin') window.location.href = '/BidOps/client/login.html';
    fetch('header.html').then(r => r.text()).then(h => document.getElementById('header').innerHTML = h);

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item_id');
    if (!itemId) { alert('No ID'); window.location.href = 'manage-listing.html'; return; }

    document.getElementById('backToPrevious').onclick = () => window.history.back();

    loadItem(itemId);

function loadItem(id) {
        fetch(`/api/item/${id}`)
        .then(res => res.json())
        .then(data => {
            if(!data.success) { alert(data.message); return; }
            const item = data.item;
            
            document.getElementById('itemTitle').textContent = item.title;
            document.getElementById('itemDescription').textContent = item.description;
            document.getElementById('itemCategory').textContent = item.category_type;
            document.getElementById('itemId').textContent = item.item_id;
            document.getElementById('itemStatus').textContent = item.status;
            document.getElementById('startingPrice').textContent = `₱${parseFloat(item.starting_price).toFixed(2)}`;
            
            if(item.seller_name) document.getElementById('sellerName').textContent = item.seller_name;
            if(item.seller_email) document.getElementById('sellerEmail').textContent = item.seller_email;

            // --- FIXED IMAGE SECTION ---
            if(data.images && data.images.length > 0) {
                // 1. DYNAMIC IP DETECTION
                // This will be 'localhost' on your PC, but '10.120.77.220' on your phone automatically
                const currentIP = window.location.hostname; 

                // 2. BUILD THE URL
                // We use Port 80 (Apache) for the PHP server
                const phpServer = `http://${currentIP}/BidOps/server`; 

                const rawPath = data.images[0].image_path;
                const cleanFilename = rawPath.replace('uploads/', '');

                // 3. SET THE SOURCE
                document.getElementById('mainImage').src = `${phpServer}/item/uploads/${cleanFilename}`;
                
                document.getElementById('mainImage').onerror = function() {
                    this.src = '../assets/images/placeholder.png'; 
                };
            }

            // Bids
            const container = document.getElementById('biddingHistory');
            container.innerHTML = '';
            if(data.bidding_history.length === 0) container.innerHTML = '<p>No bids yet.</p>';
            data.bidding_history.forEach(bid => {
                container.innerHTML += `<div class="history-item"><span>${bid.bidder_name}</span> - ₱${bid.bid_amount}</div>`;
            });
        });
    }
    // Delete
    const modal = document.getElementById('deleteModal');
    document.getElementById('deleteItemBtn').onclick = () => modal.style.display = 'block';
    document.getElementById('cancelDelete').onclick = () => modal.style.display = 'none';
    
    document.getElementById('confirmDelete').onclick = () => {
        fetch(`/api/item/${itemId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            window.location.href = 'manage-listings.html';
        });
    };
});