// join-bid.js - Complete working version with backend integration

// Get item_id from URL
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('item_id');

let itemData = null;
let currentHighestBid = 0;
let minimumIncrement = 5.00;

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
    fetch(`http://localhost:8000/server_try/item/get_item_details.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(data.message);
                window.location.href = 'homepage.html';
                return;
            }
            
            itemData = data.item;
            populateItemDetails(data);
            startCountdown(itemData.end_date);
            setupImageGallery(data.images);
            displayBiddingHistory(data.bidding_history);
            
            // Store current highest bid
            currentHighestBid = parseFloat(data.item.current_highest_bid || data.item.starting_price);
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
    
    // Update pricing
    const startingPrice = parseFloat(item.starting_price || 0);
    const currentHighest = parseFloat(item.current_highest_bid || startingPrice);
    
    document.querySelector('.bid-pricing .price-item:first-child .price-value').textContent = 
        `₱${startingPrice.toFixed(2)}`;
    document.querySelector('.bid-pricing .price-item.current-bid .price-value').textContent = 
        `₱${currentHighest.toFixed(2)}`;
    
    // Update minimum bid text
    const minimumBid = currentHighest + minimumIncrement;
    document.querySelector('.minimum-bid-text').textContent = 
        `Minimum bid increment: ₱${minimumIncrement.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
    
    // Set minimum value for bid input
    document.getElementById('bidAmount').min = minimumBid;
    document.getElementById('bidAmount').placeholder = minimumBid.toFixed(2);
    
    // Update total bids count
    const totalBids = data.bidding_history.length;
    document.querySelector('.bid-time-and-count .count span').textContent = totalBids;
}

// Setup image gallery
function setupImageGallery(images) {
    if (!images || images.length === 0) return;
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    // Set main image
    mainImage.src = `http://localhost:8000/server_try/item/${images[0].image_path}`;
    
    // Clear and populate thumbnails
    thumbnailContainer.innerHTML = '';
    images.forEach((img, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `http://localhost:8000/server_try/item/${img.image_path}`;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.dataset.image = `http://localhost:8000/server_try/item/${img.image_path}`;
        
        thumbnail.addEventListener('click', () => {
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            mainImage.src = thumbnail.dataset.image;
        });
        
        thumbnailContainer.appendChild(thumbnail);
    });
}

// Display bidding history
function displayBiddingHistory(history) {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';
    
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; padding: 20px;">No bids yet. Be the first to bid!</p>';
        return;
    }
    
    history.forEach((bid, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        if (index === 0) {
            historyItem.classList.add('current-high');
        }
        
        historyItem.innerHTML = `
            <img src="../assets/images/profile-placeholder.png" alt="Bidder" class="bidder-avatar">
            <div class="bidder-info">
                <h4>${bid.bidder_name}</h4>
                <span class="bid-time">${bid.time_ago}</span>
            </div>
            <div class="bid-amount-container">
                <span class="bid-amount">₱${parseFloat(bid.bid_amount).toFixed(2)}</span>
                ${index === 0 ? '<span class="current-high-badge">Current High</span>' : ''}
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

// Countdown Timer
function startCountdown(endDate) {
    if (!endDate) {
        document.querySelector('.countdown-timer').innerHTML = '<p>No end date specified</p>';
        return;
    }
    
    const endDateTime = new Date(endDate).getTime();
    
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDateTime - now;

        if (distance < 0) {
            clearInterval(timer);
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            
            const placeBidBtn = document.getElementById('placeBidBtn');
            placeBidBtn.disabled = true;
            placeBidBtn.innerHTML = 'Auction Ended';
            placeBidBtn.style.backgroundColor = '#8C8A8A';
            placeBidBtn.style.cursor = 'not-allowed';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }, 1000);
}

// Place Bid Button - Validation and Submission
const placeBidBtn = document.getElementById('placeBidBtn');
const bidAmountInput = document.getElementById('bidAmount');

placeBidBtn.addEventListener('click', () => {
    const bidAmount = parseFloat(bidAmountInput.value);
    const minimumBid = currentHighestBid + minimumIncrement;

    // Validation
    if (!bidAmount || isNaN(bidAmount)) {
        alert('Please enter a valid bid amount.');
        return;
    }

    if (bidAmount < minimumBid) {
        alert(`Your bid must be at least ₱${minimumBid.toFixed(2)} (Current highest bid + ₱${minimumIncrement.toFixed(2)} increment)`);
        return;
    }

    // Confirm bid
    const confirmBid = confirm(`Are you sure you want to place a bid of ₱${bidAmount.toFixed(2)}?`);
    
    if (confirmBid) {
        submitBid(bidAmount);
    }
});

// Submit bid to backend
function submitBid(bidAmount) {
    placeBidBtn.disabled = true;
    placeBidBtn.textContent = 'Placing bid...';
    
    fetch('http://localhost:8000/server_try/item/place_bid.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            item_id: itemId,
            bid_amount: bidAmount
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        placeBidBtn.disabled = false;
        placeBidBtn.innerHTML = '<iconify-icon icon="mdi:gavel"></iconify-icon> Place Bid';
        
        if (data.success) {
            alert('Bid placed successfully!');
            
            // Update current highest bid
            currentHighestBid = bidAmount;
            document.querySelector('.current-bid .price-value').textContent = `₱${bidAmount.toFixed(2)}`;
            
            // Update minimum bid text
            const newMinimum = bidAmount + minimumIncrement;
            document.querySelector('.minimum-bid-text').textContent = 
                `Minimum bid increment: ₱${minimumIncrement.toFixed(2)} (Next minimum: ₱${newMinimum.toFixed(2)})`;
            
            // Clear input
            bidAmountInput.value = '';
            bidAmountInput.min = newMinimum;
            bidAmountInput.placeholder = newMinimum.toFixed(2);
            
            // Reload item details to update bidding history
            loadItemDetails();
        } else {
            alert(data.message || 'Failed to place bid');
        }
    })
    .catch(error => {
        console.error('Error placing bid:', error);
        alert('Failed to place bid. Please try again.');
        placeBidBtn.disabled = false;
        placeBidBtn.innerHTML = '<iconify-icon icon="mdi:gavel"></iconify-icon> Place Bid';
    });
}

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
        // fetch('http://localhost:8000/server_try/user/add_favorite.php', ...)
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
    window.location.href = `chat.html?seller_id=${itemData.seller_id}&item_id=${itemId}`;
});

// Report Button
const reportBtn = document.getElementById('reportBtn');

reportBtn.addEventListener('click', () => {
    const reportReason = prompt('Please enter the reason for reporting this item:');
    
    if (reportReason && reportReason.trim() !== '') {
        // TODO: Send report to backend
        fetch('http://localhost:8000/server_try/item/report_item.php', {
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

// Format bid input to 2 decimal places
bidAmountInput.addEventListener('blur', () => {
    if (bidAmountInput.value) {
        const value = parseFloat(bidAmountInput.value);
        if (!isNaN(value)) {
            bidAmountInput.value = value.toFixed(2);
        }
    }
});

// Prevent negative numbers in bid input
bidAmountInput.addEventListener('input', () => {
    if (bidAmountInput.value < 0) {
        bidAmountInput.value = 0;
    }
});