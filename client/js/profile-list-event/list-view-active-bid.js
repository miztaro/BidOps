// ==========================================
//  BIDDING HISTORY MODAL
// ==========================================
let currentItemId = null;
let countdownInterval = null;
let auctionEndTime = null;
const IMAGE_BASE_URL = '/BidOps/server/item/';

// Close modal
document.getElementById('bid-modal-close').addEventListener('click', closeBidModal);
document.getElementById('bid-modal-overlay').addEventListener('click', function (event) {
    if (event.target === this) {
        closeBidModal();
    }
});

// --- UPDATED openBidModal ---
export function openBidModal(itemId) {
    const modal = document.getElementById('bid-modal-overlay');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset timer display before fetch (CRITICAL)
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    // Ensure we clear the container to show "Loading Timer..."
    const timerEl = document.getElementById('bid-timer');
    if (timerEl) {
        // Set initial state text to be white for visibility on dark background
        timerEl.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Loading Timer...</p>';
    }

    fetchBidHistory(itemId);
}
// ----------------------------

function closeBidModal() {
    const modal = document.getElementById('bid-modal-overlay');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    // Clear the auction end time when closing
    auctionEndTime = null; 
}

function fetchBidHistory(itemId) {
    fetch(`../server/item/get_seller_bid_history.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateBidModal(data);
            } else {
                alert('Error loading bid history: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching bid history:', error);
            alert('Failed to load bid history');
        });
}

function populateBidModal(data) {
    const item = data.item;
    const images = data.images;
    const history = data.bidding_history;
    const timeRemaining = data.time_remaining;
    
    // Ensure countdown is cleared before populating new data
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    // Set item details
    document.getElementById('bid-item-title').textContent = item.title;
    document.getElementById('bid-item-category').textContent = item.category_type;
    document.getElementById('bid-item-description').textContent = item.description || 'No description available.';
    document.getElementById('bid-starting-price').textContent = '₱' + parseFloat(item.starting_price || 0).toFixed(2);
    document.getElementById('bid-current-highest').textContent = '₱' + parseFloat(item.current_highest_bid || item.starting_price || 0).toFixed(2);

    // --- FIX 1: Set images using the global IMAGE_BASE_URL ---
    const mainImage = document.getElementById('bid-main-image');
    const thumbnailContainer = document.getElementById('bid-thumbnails');
    
    thumbnailContainer.innerHTML = '';
    
    // Determine the image path property (itemimage table uses image_path, not file_path)
    const imageProperty = images.length > 0 && images[0].image_path ? 'image_path' : 'file_path';
    
    if (images.length > 0) {
        mainImage.src = `${IMAGE_BASE_URL}${images[0][imageProperty]}`;

        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = `${IMAGE_BASE_URL}${img[imageProperty]}`;
            // thumb.classList.add(index === 0 ? 'active' : '');
            if (index === 0) thumb.classList.add('active');
            
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnailContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailContainer.appendChild(thumb);
        });
    } else {
        mainImage.src = `${IMAGE_BASE_URL}uploads/default.jpg`;
    }

    // --- FIX 2: Anchor time and Start Countdown Timer ---
    const timerContainer = document.getElementById('bid-timer');
    if (timeRemaining && timeRemaining.is_active && timeRemaining.total_seconds > 0) {
        
        // Calculate the absolute end time in seconds since the epoch.
        // This is crucial for consistent timer display upon re-opening the modal.
        auctionEndTime = (Date.now() / 1000) + timeRemaining.total_seconds;

        // Start countdown based on the calculated remaining time
        startCountdown();

        // --- TIMER DRIFT CHECK (If the server time is stale/inaccurate) ---
        const currentRemaining = Math.max(0, Math.floor(auctionEndTime - (Date.now() / 1000)));
        // Check if the server-provided time and the client-calculated time already differ significantly
        if (Math.abs(currentRemaining - timeRemaining.total_seconds) > 5) { 
            console.warn("Timer drift or stale server time detected. Re-fetching data in 0.5s to correct.");
            // Force a re-fetch of history to get a fresher time.
            setTimeout(() => {
                fetchBidHistory(item.item_id);
            }, 500); 
        }

    } else {
        // If auction ended or time is zero, use white text on the dark background
        timerContainer.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Auction Ended</p>';
    }

    // Set bidding history
    const historyList = document.getElementById('bid-history-list');
    const totalBidsEl = document.getElementById('total-bids');

    totalBidsEl.textContent = `${history.length} Bid${history.length !== 1 ? 's' : ''}`;

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="bid-empty-state">
                <iconify-icon icon="mdi:gavel-off"></iconify-icon>
                <p>No bids yet</p>
            </div>
        `;
    } else {
        historyList.innerHTML = '';
        history.forEach((bid, index) => {
            const bidItem = createBidItem(bid, index === 0);
            historyList.appendChild(bidItem);
        });
    }
}

function createBidItem(bid, isHighest) {
    const bidItem = document.createElement('div');
    bidItem.classList.add('bid-item');
    if (isHighest) bidItem.classList.add('highest-bid');

    const initials = bid.username.charAt(0).toUpperCase();

    let actionsHTML = '';
    if (isHighest && bid.bid_status === 'active') {
        actionsHTML = `
            <div class="bid-actions">
                <button class="btn-accept" onclick="handleBidAction(${bid.bid_id}, 'accept')">
                    <iconify-icon icon="material-symbols:check-circle" width="20" height="20"></iconify-icon>
                    Accept
                </button>
                <button class="btn-decline" onclick="handleBidAction(${bid.bid_id}, 'decline')">
                    <iconify-icon icon="material-symbols:cancel" width="20" height="20"></iconify-icon>
                    Decline
                </button>
            </div>
        `;
    } else if (bid.bid_status === 'accepted') {
        actionsHTML = '<span class="bid-status-badge accepted">✓ Accepted</span>';
    } else if (bid.bid_status === 'declined') {
        actionsHTML = '<span class="bid-status-badge declined">✗ Declined</span>';
    }

    bidItem.innerHTML = `
        <div class="bid-item-header">
            <div class="bidder-info">
                <div class="bidder-avatar">${initials}</div>
                <div class="bidder-details">
                    <h4>${bid.username}</h4>
                    <p class="bidder-email">${bid.email}</p> <p>${bid.time_ago}</p>
                </div>
            </div>
            <div class="bid-amount">₱${parseFloat(bid.bid_amount).toFixed(2)}</div>
        </div>
        ${actionsHTML}
    `;

    return bidItem;
}

function startCountdown() {
    // We calculate remaining time from the fixed auctionEndTime

    // Reset interval if running
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Update display immediately (calculate remaining time)
    let remainingSeconds = Math.max(0, Math.floor(auctionEndTime - (Date.now() / 1000)));
    updateTimerDisplay(remainingSeconds);

    countdownInterval = setInterval(() => {
        // Recalculate remaining seconds based on the fixed auctionEndTime
        const remaining = Math.max(0, Math.floor(auctionEndTime - (Date.now() / 1000)));

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            // Use white text to ensure "Auction Ended" is visible on the dark background
            document.getElementById('bid-timer').innerHTML = '<p style="color: white; text-align: center; padding: 20px;">Auction Ended</p>';
            return;
        }

        updateTimerDisplay(remaining);
    }, 1000);
}

// --- FINAL FIX: updateTimerDisplay to use CSS classes only ---
function updateTimerDisplay(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Helper to pad single digits (e.g., 5 -> 05)
    const pad = (num) => String(num).padStart(2, '0');
    
    const timerContainer = document.getElementById('bid-timer');

    // ** Generating clean HTML using the classes that your CSS is targeting **
    timerContainer.innerHTML = `
        <div class="auction-ending-soon"> 
            <p class="timer-label">Auction Ending Soon</p>
            <div class="timer-display-group timer-display">
                <div class="timer-box time-unit">
                    <h2 class="time-value">${pad(days)}</h2>
                    <span class="time-label">Days</span>
                </div>
                <div class="timer-box time-unit">
                    <h2 class="time-value">${pad(hours)}</h2>
                    <span class="time-label">Hours</span>
                </div>
                <div class="timer-box time-unit">
                    <h2 class="time-value">${pad(minutes)}</h2>
                    <span class="time-label">Minutes</span>
                </div>
                <div class="timer-box time-unit">
                    <h2 class="time-value">${pad(secs)}</h2>
                    <span class="time-label">Seconds</span>
                </div>
            </div>
        </div>
    `;
    // NOTE: The classes 'auction-ending-soon', 'timer-display-group', 'time-unit', 
    // 'time-value', and 'time-label' are now used to match the CSS you provided.
}
// --------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------


// Handle Accept/Decline Actions
window.handleBidAction = function (bidId, action) {
    const confirmMessage = action === 'accept'
        ? 'Are you sure you want to accept this bid? This will end the auction and mark the item as sold.'
        : 'Are you sure you want to decline this bid?';

    if (!confirm(confirmMessage)) return;

    fetch('../server/item/manage_bid.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bid_id: bidId,
            action: action
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                // Refresh the modal and listings
                fetchBidHistory(currentItemId);
                // fetchListings(); // Assuming this is defined elsewhere
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to process bid action');
        });
};