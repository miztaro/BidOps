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
    loadBidItemDetails(itemId);
    
    // Setup delete button
    setupDeleteButton(itemId);
});

function loadBidItemDetails(itemId) {
    console.log('Loading bid item details for ID:', itemId);
    
    // Fetch item details
    fetch(`../server/item/get_item_details.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Received item data:', data);
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load item');
            }
            
            const item = data.item;
            const images = data.images || [];
            const biddingHistory = data.bidding_history || [];
            
            // Update main details
            document.getElementById('itemTitle').textContent = item.title || 'No Title';
            document.getElementById('itemDescription').textContent = item.description || 'No description available.';
            document.getElementById('itemCategory').textContent = item.category_type || 'Unknown';
            document.getElementById('itemId').textContent = item.item_id || 'N/A';
            document.getElementById('itemStatus').textContent = item.status || 'Unknown';
            document.getElementById('itemCreated').textContent = formatDate(item.created_date) || 'N/A';
            
            // Update bid pricing
            document.getElementById('startingPrice').textContent = `₱${parseFloat(item.starting_price || 0).toFixed(2)}`;
            document.getElementById('currentBid').textContent = `₱${parseFloat(item.current_highest_bid || item.starting_price || 0).toFixed(2)}`;
            
            // Setup countdown timer
            if (item.end_date) {
                setupCountdownTimer(item.end_date);
            }
            
            // Setup image gallery
            setupImageGallery(images);
            
            // Load bidding history
            displayBiddingHistory(biddingHistory);
            
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

function displayBiddingHistory(biddingHistory) {
    const biddingHistoryContainer = document.getElementById('biddingHistory');
    
    if (!biddingHistory || biddingHistory.length === 0) {
        biddingHistoryContainer.innerHTML = '<p>No bidding history yet.</p>';
        return;
    }
    
    let historyHTML = '';
    biddingHistory.forEach(bid => {
        historyHTML += `
            <div class="history-item">
                <div class="bidder-info">
                    <span class="bidder-name">${bid.bidder_name || 'Anonymous'}</span>
                    <span class="bid-time">${formatDate(bid.bid_time)}</span>
                </div>
                <div class="bid-amount">
                    <span class="amount">₱${parseFloat(bid.bid_amount || 0).toFixed(2)}</span>
                    <span class="bid-status ${bid.bid_status}">${bid.bid_status}</span>
                </div>
            </div>
        `;
    });
    
    biddingHistoryContainer.innerHTML = historyHTML;
}

function setupCountdownTimer(endDate) {
    const end = new Date(endDate);
    let timerInterval = null;
    
    function updateTimer() {
        const now = new Date();
        const timeLeft = end - now;
        
        if (timeLeft <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            return;
        }
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 500);
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
    
    // Close modal
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
            // Unauthorized 
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