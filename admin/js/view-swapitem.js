document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('item_id');
    const backToPreviousBtn = document.getElementById('backToPrevious');
    
    if (!itemId) {
        alert('No item ID specified');
        window.location.href = 'homepage.html';
        return;
    }

    // Setup back button
    if (backToPreviousBtn) {
        backToPreviousBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // Load item details
    loadSwapItemDetails(itemId);
    
    // Setup delete button
    setupDeleteButton(itemId);
});

function loadSwapItemDetails(itemId) {
    console.log('Loading swap item details for ID:', itemId);
    
    // Fetch item details
    fetch(`../server/item/get_swap_details.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Received item data:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load item');
            }
            
            const item = data.item;
            const images = data.images || [];
            
            // Update main details
            document.getElementById('itemTitle').textContent = item.title || 'No Title';
            document.getElementById('itemDescription').textContent = item.description || 'No description available.';
            document.getElementById('itemCategory').textContent = item.category_type || 'Unknown';
            document.getElementById('itemId').textContent = item.item_id || 'N/A';
            document.getElementById('itemStatus').textContent = item.status || 'Unknown';
            document.getElementById('itemCreated').textContent = formatDate(item.created_date) || 'N/A';
            
            // Setup image gallery
            setupImageGallery(images);
            
            // Fetch seller info
            if (item.seller_name) {
                document.getElementById('sellerName').textContent = item.seller_name;
            }
            if (item.seller_email) {
                document.getElementById('sellerEmail').textContent = item.seller_email;
            }
        })
        .catch(error => {
            console.error('Error loading item details:', error);
            document.getElementById('itemTitle').textContent = 'Error Loading Item';
            document.getElementById('itemDescription').textContent = 'Failed to load item details. Please try again later.';
        });
}

function setupImageGallery(images) {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    
    if (!images || images.length === 0) {
        mainImage.src = '../assets/images/slu-logo.png';
        thumbnailContainer.innerHTML = '';
        return;
    }
    
    // Set main image 
    const firstImage = images[0];
    mainImage.src = `../server/item/${firstImage.image_path}`;
    
    thumbnailContainer.innerHTML = '';
    images.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `../server/item/${image.image_path}`;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
        
        thumbnail.addEventListener('click', () => {
            mainImage.src = thumbnail.src;
            
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });
        
        thumbnailContainer.appendChild(thumbnail);
    });
}

function setupDeleteButton(itemId) {
    const deleteBtn = document.getElementById('deleteItemBtn');
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const modalClose = document.getElementById('modalClose');
    
    if (!deleteBtn) return;
    
    deleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'block';
    });
    
    // Close modal functions
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }
    
    if (cancelDelete) {
        cancelDelete.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }
    
    // Confirm delete
    if (confirmDelete) {
        confirmDelete.addEventListener('click', () => {
            deleteItem(itemId);
        });
    }
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}

function deleteItem(itemId) {
    const confirmDelete = document.getElementById('confirmDelete');
    const deleteModal = document.getElementById('deleteModal');
    
    // Disable button and show loading
    confirmDelete.disabled = true;
    confirmDelete.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> Deleting...';
    
    // Send delete request WITH CREDENTIALS
    fetch('../server/item/delete_item.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            item_id: itemId,
            delete_type: 'bid'
        })
    })
    .then(response => {
        if (response.status === 401) {
            return response.json().then(data => {
                throw new Error('Session expired or not authorized. Please log in again as admin.');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Item deleted successfully!');
            window.location.href = 'homepage.html';
        } else {
            alert('Error: ' + (data.message || 'Failed to delete item'));
            confirmDelete.disabled = false;
            confirmDelete.textContent = 'Delete Permanently';
            deleteModal.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error deleting item:', error);
        alert('Failed to delete item: ' + error.message);
        confirmDelete.disabled = false;
        confirmDelete.textContent = 'Delete Permanently';
        deleteModal.style.display = 'none';
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}