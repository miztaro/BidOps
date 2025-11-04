// view-swap.js - View swap item details

// Get item_id from URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('item_id');

let itemData = null;

// Load item details on page load
window.addEventListener('load', () => {
    if (!itemId) {
        alert('No item specified');
        window.location.href = 'homepage.html';
        return;
    }
    
    loadItemDetails();
});

// Load item details from backend
function loadItemDetails() {
    fetch(`../server_try/item/get_item_details.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(data.message);
                window.location.href = 'homepage.html';
                return;
            }
            
            itemData = data.item;
            populateItemDetails(data);
            setupImageGallery(data.images);
        })
        .catch(error => {
            console.error('Error loading item:', error);
            alert('Failed to load item details');
        });
}

// Populate item details on the page
function populateItemDetails(data) {
    const item = data.item;
    
    // Update title and description
    document.querySelector('.item-title').textContent = item.title;
    document.querySelector('.item-description').textContent = item.description;
    
    // Update seller info
    document.querySelector('.seller-details h4').textContent = item.seller_name;
    document.querySelector('.seller-details p').textContent = item.seller_email;
    document.querySelector('.view-profile-btn').href = `profile.html?user_id=${item.seller_id}`;
}

// Setup image gallery
function setupImageGallery(images) {
    if (!images || images.length === 0) return;
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    // Set main image
    mainImage.src = `../server_try/item/${images[0].image_path}`;
    
    // Clear and populate thumbnails
    thumbnailContainer.innerHTML = '';
    images.forEach((img, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `../server_try/item/${img.image_path}`;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.dataset.image = `../server_try/item/${img.image_path}`;
        
        thumbnail.addEventListener('click', () => {
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            mainImage.src = thumbnail.dataset.image;
        });
        
        thumbnailContainer.appendChild(thumbnail);
    });
}

// Place Swap Offer Button
const placeSwapBtn = document.getElementById('placeSwapBtn');

placeSwapBtn.addEventListener('click', () => {
    if (!itemData) {
        alert('Item data not loaded yet');
        return;
    }
    
    // Redirect to swap offer page (you'll create this later)
    alert('Swap offer feature coming soon! This will let you propose items to swap.');
    // window.location.href = `create-swap-offer.html?item_id=${itemId}`;
});

// Add to Favorites Button
const favoritesBtn = document.querySelector('.favorites-btn');
let isFavorite = false;

favoritesBtn.addEventListener('click', () => {
    isFavorite = !isFavorite;
    
    if (isFavorite) {
        favoritesBtn.style.backgroundColor = '#B41B1B';
        favoritesBtn.style.color = '#fff';
        favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Added to Favorites';
        
        // TODO: Send to backend to save favorite
    } else {
        favoritesBtn.style.backgroundColor = '#FFE100';
        favoritesBtn.style.color = '#073066';
        favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Add to Favorites';
        
        // TODO: Send to backend to remove favorite
    }
});

// Chat with Seller Button
const chatBtn = document.querySelector('.chat-btn');

chatBtn.addEventListener('click', () => {
    if (!itemData) return;
    
    // Redirect to chat page with seller ID
    alert('Chat feature coming soon!');
    // window.location.href = `chat.html?seller_id=${itemData.seller_id}&item_id=${itemId}`;
});

// Report Button
const reportBtn = document.getElementById('reportBtn');

reportBtn.addEventListener('click', () => {
    const reportReason = prompt('Please enter the reason for reporting this item:');
    
    if (reportReason && reportReason.trim() !== '') {
        fetch('../server_try/item/report_item.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemId,
                reason: reportReason
            }),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thank you for your report. We will review this item shortly.');
            } else {
                alert(data.message || 'Failed to submit report');
            }
        })
        .catch(error => {
            console.error('Error submitting report:', error);
            alert('Failed to submit report. Please try again.');
        });
    }
});