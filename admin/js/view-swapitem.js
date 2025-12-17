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

            if(data.images.length > 0) {
                // 1. POINT TO PHP SERVER (Port 80/Apache), NOT Node (Port 3000)
                // Make sure 'BidOps' matches your actual folder name in htdocs
                const phpServer = 'http://localhost/BidOps/server'; 

                // 2. CLEAN THE PATH
                // Your DB likely has "uploads/item_...png"
                // We strip "uploads/" so we don't get the "uploads/uploads/" error
                const rawPath = data.images[0].image_path;
                const cleanFilename = rawPath.replace('uploads/', '');

                // 3. SET THE SOURCE
                document.getElementById('mainImage').src = `${phpServer}/item/uploads/${cleanFilename}`;
                
                // Optional: Handle broken images
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