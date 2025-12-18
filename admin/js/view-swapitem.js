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
        if(item.seller_name) document.getElementById('sellerName').textContent = item.seller_name;

        if(data.images && data.images.length > 0) {
            // --- DYNAMIC IP FIX ---
            // This gets 'localhost' on your PC, but '10.120.77.220' on your phone
            const currentHost = window.location.hostname; 
            
            // We use Port 80 (standard) for the PHP/Apache server where images live
            const phpServer = `http://${currentHost}/BidOps/server`; 

            // Clean the path logic
            const rawPath = data.images[0].image_path;
            const cleanFilename = rawPath.replace('uploads/', '');

            // Set the Source
            const finalImageUrl = `${phpServer}/item/uploads/${cleanFilename}`;
            console.log("Loading Image from:", finalImageUrl); // Debug this in console
            
            document.getElementById('mainImage').src = finalImageUrl;
            
            document.getElementById('mainImage').onerror = function() {
                this.src = '../assets/images/placeholder.png'; 
            };
        }
    });
}

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