
//import { getStatusClass } from '../profilepage.js';
// View Item Overlay

let currentItemId = null;
let countdownInterval = null;
document.addEventListener('DOMContentLoaded', function () {
    const viewItemOverlay = document.getElementById('list-view-overlay');
    const closeButton = document.getElementById('close-view-btn')



    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.lists-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        const itemId = viewItemBtn.getAttribute("data-id");
        const type = (viewItemBtn.getAttribute("data-type") || "").toLowerCase();
        const status = (viewItemBtn.getAttribute("data-status") || "").toLowerCase();

        if (!itemId) {
            console.error("Item ID not found on view button.");
            return;
        }

        if (type === "bid" && status === "active") {
            currentItemId = itemId;
            console.log("Opening Bid Modal", itemId);
            openBidModal(itemId);
            return;
        }

        if (type === "swap" && status === "active") {
            currentItemId = itemId;
            console.log("Opening Swap Modal", itemId);
            openSwapModal(itemId);
            return;
        }

        const hiddenInput = document.getElementById('view-item-id');
        if (hiddenInput) hiddenInput.value = itemId;
        viewItemOverlay.classList.add('active');

        fetchItem(itemId);
    });

    if (closeButton && viewItemOverlay) {
        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewItemOverlay.classList.remove('active');
        });
    }
});

function getStatusClass(status) {
  status = status.toLowerCase();
  if (status.includes("active")) return "active-items";
  if (status.includes("pending")) return "pending-items";
  if (status.includes("rejected")) return "rejected-items";
  if (status.includes("sold")) return "sold-items";
  return "";
}

function fetchItem(itemId) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `../server/item/get_item_single.php?id=${itemId}`, true);

        xhr.onload = function () {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                displayItem(data);
                resolve(data);
            } else {
                console.error("AJAX error: status", xhr.status);
                reject(xhr.status);
            }
        };

        xhr.onerror = function () {
            console.error("AJAX request failed");
            reject("AJAX request failed");
        };

        xhr.send();
    });
}

function displayItem(data) {
    const { item, bid, images } = data;
    if (!item) return;

    const type = (item.item_type || "").trim().toLowerCase();
    const isBid = type === "bid";
    const isSwap = type === "swap";

    document.querySelector('.view-mode-field h3').textContent = isBid ? "Bid" : "Swap";
    document.querySelector('.view-mode-field p span').textContent = item.item_id;

    const statusText = bid?.status || item.status || "No Status";
    const statusEl = document.querySelector('.view-status-field');
    statusEl.className = "view-status-field";
    statusEl.classList.add(getStatusClass(statusText));
    statusEl.querySelector('p').textContent = statusText;

    if (isBid && statusText === "active") {
        closeNormalOverlay();
        currentItemId = item.item_id;
        openBidModal(item.item_id);
        return;
    }

    if (isSwap && statusText === "active") {
        closeNormalOverlay();
        currentItemId = item.item_id;
        openSwapModal(item.item_id);
        return;
    }

    document.querySelector('.name-cat-field h3').textContent = item.title;
    document.querySelector('.name-cat-field p').textContent = item.category_type;
    document.querySelector('.description-field p').textContent = item.description || "";

    const priceField = document.querySelector('.body-sec .price-field');
    const dateField = document.querySelector('.date-field');
    const swapField = document.querySelector('.swap-field');
    const leftSide = document.querySelector('.left-side');
    leftSide.style.display = "flex";

    loadImages(images);

    if (isBid && bid) {
        priceField.style.display = "flex";
        dateField.style.display = "flex";
        swapField.style.display = "none";

        document.querySelector('.start-price p').textContent = `P ${bid?.starting_price || 0}`;
        document.querySelector('.win-price p').textContent = bid?.winning_price ? `P ${bid.winning_price}` : 'N/A';
        document.querySelector('.start-date p').textContent = bid?.start_date || item.start_date || '';
        document.querySelector('.end-date p').textContent = bid?.end_date || item.end_date || '';
    } else if (isSwap) {
        priceField.style.display = "none";
        dateField.style.display = "none";
        swapField.style.display = "flex";

        document.querySelector('.swapped-item p').textContent = item.swapped_item_name || "N/A";
        document.querySelector('.swap-partner p').textContent = item.swap_partner_id || "N/A";
    } else {
        priceField.style.display = "none";
        dateField.style.display = "none";
        swapField.style.display = "none";
    }
}

function closeNormalOverlay() {
    const overlay = document.getElementById('list-view-overlay');
    if (overlay) overlay.classList.remove('active');
}

function loadImages(imagePaths) {
    const mainImage = document.querySelector('.left-side .main-image img');
    const previewContainer = document.querySelector('.left-side .images-preview');

    if (!mainImage || !previewContainer) return;

    previewContainer.innerHTML = '';

    if (!imagePaths || imagePaths.length === 0) {
        mainImage.src = '';
        return;
    }

    // Set main image
    mainImage.src = `../server/item/${imagePaths[0]}`;

    imagePaths.forEach((imgPath, index) => {
        const img = document.createElement('img');
        img.src = `../server/item/${imgPath}`;
        if (index === 0) img.classList.add('active');

        img.addEventListener('click', () => {
            mainImage.src = img.src;
            previewContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
            img.classList.add('active');
        });

        previewContainer.appendChild(img);
    });
}


// ==========================================
//  BIDDING HISTORY MODAL
// ==========================================

// let currentItemId = null;
// let countdownInterval = null;

// // Open modal when "View" button is clicked
// document.addEventListener('click', function(event) {
//     if (event.target.classList.contains('view-btn')) {
//         const row = event.target.closest('tr');
//         const itemId = row.getAttribute('id')?.replace('listing-row-', '');

//         if (itemId) {
//             currentItemId = itemId;
//             openBidModal(itemId);
//         }
//     }
// });

// Close modal
document.getElementById('bid-modal-close').addEventListener('click', closeBidModal);
document.getElementById('bid-modal-overlay').addEventListener('click', function (event) {
    if (event.target === this) {
        closeBidModal();
    }
});

// function openSwapModal(itemId) {
//     console.log("Open Swap Modal for item:", itemId);
//     // TODO: implement your swap modal UI
// }

function openBidModal(itemId) {
    const modal = document.getElementById('bid-modal-overlay');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    fetchBidHistory(itemId);
}

function closeBidModal() {
    const modal = document.getElementById('bid-modal-overlay');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
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

    // Set item details
    document.getElementById('bid-item-title').textContent = item.title;
    document.getElementById('bid-item-category').textContent = item.category_type;
    document.getElementById('bid-item-description').textContent = item.description || 'No description available.';
    document.getElementById('bid-starting-price').textContent = '₱' + parseFloat(item.starting_price || 0).toFixed(2);
    document.getElementById('bid-current-highest').textContent = '₱' + parseFloat(item.current_highest_bid || item.starting_price || 0).toFixed(2);

    // Set images
    if (images.length > 0) {
        const mainImage = document.getElementById('bid-main-image');
        mainImage.src = `../server/item/${images[0].file_path}`;

        const thumbnailContainer = document.getElementById('bid-thumbnails');
        thumbnailContainer.innerHTML = '';

        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = `../server/item/${img.file_path}`;
            thumb.classList.add(index === 0 ? 'active' : '');
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnailContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailContainer.appendChild(thumb);
        });
    }

    // Set countdown timer
    if (timeRemaining && timeRemaining.is_active) {
        startCountdown(timeRemaining.total_seconds);
    } else {
        document.getElementById('bid-timer').innerHTML = '<p style="text-align: center; padding: 20px;">Auction Ended</p>';
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
                    <p>${bid.time_ago}</p>
                </div>
            </div>
            <div class="bid-amount">₱${parseFloat(bid.bid_amount).toFixed(2)}</div>
        </div>
        ${actionsHTML}
    `;

    return bidItem;
}

function startCountdown(totalSeconds) {
    let remaining = totalSeconds;

    updateTimerDisplay(remaining);

    countdownInterval = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('bid-timer').innerHTML = '<p style="text-align: center; padding: 20px;">Auction Ended</p>';
            return;
        }

        updateTimerDisplay(remaining);
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    document.getElementById('timer-days').textContent = String(days).padStart(2, '0');
    document.getElementById('timer-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('timer-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('timer-seconds').textContent = String(secs).padStart(2, '0');
}

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
                fetchListings();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to process bid action');
        });
};
