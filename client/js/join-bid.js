const urlParams = new URLSearchParams(window.location.search);
const backToPreviousBtn = document.getElementById('backToPrevious');
const placeBidBtn = document.getElementById('placeBidBtn');
const itemId = urlParams.get('item_id');

let itemData = null;
let currentHighestBid = 0;
let bidIncrementPercent = 0.00;
let currentUserId = '0'; 

function disableAndUnbind(selector, title, defaultText, elementId = null) {
    const originalElement = elementId ? document.getElementById(elementId) : document.querySelector(selector);
    
    if (originalElement) {
        // Clone and replace to remove all previous event listeners
        const newElement = originalElement.cloneNode(true); 
        
        newElement.disabled = true;
        newElement.style.opacity = '0.6';
        newElement.style.cursor = 'not-allowed';
        newElement.title = title;
        
        // Ensure the inner HTML is preserved for icons/text, but the button is disabled
        if (defaultText) {
             // Retain the current inner HTML if it already contains icons, otherwise use defaultText
             newElement.innerHTML = newElement.innerHTML.includes('iconify-icon') ? newElement.innerHTML : defaultText;
        }
        
        originalElement.replaceWith(newElement);
        return newElement;
    }
    return null;
}

function disableAllButtons(reason) {
    disableAndUnbind('#placeBidBtn', reason, '<iconify-icon icon="mdi:gavel"></iconify-icon> Place Bid', 'placeBidBtn');
    disableAndUnbind('.favorites-btn', reason, '<iconify-icon icon="mdi:heart"></iconify-icon> Add to Favorites');
    disableAndUnbind('.chat-btn', reason, '<iconify-icon icon="mdi:message"></iconify-icon> Chat with Seller');
    setupReportButton();
}

function enableFeatures() {
    const isLoggedIn = currentUserId !== '0';
    // Ensure itemData is loaded before checking seller_id
    const isSeller = itemData && itemData.seller_id === currentUserId && isLoggedIn; 
    const isEnded = isAuctionEnded();

    if (isEnded) {
        disableAllButtons('Auction has ended.');
    } else if (isSeller) {
        disableAllButtons('You are the seller of this item. Cannot bid or chat.');
    } else if (!isLoggedIn) {
        disableAllButtons('Please log in to bid or chat.');
    } else {
        // User is logged in, is not the seller, and auction is active. ENABLE features.
        setupPlaceBidButton();
        setupFavoritesButton(); 
        setupChatButton();
    }
}

// FIX: Simplified button enabling to avoid complex title checks.
function setupChatButton() {
    let chatBtn = document.querySelector('.chat-btn');
    
    if (chatBtn) {
        // 1. Remove disabled state and styling applied by disableAllButtons
        chatBtn.disabled = false;
        chatBtn.style.opacity = '1';
        chatBtn.style.cursor = 'pointer';
        chatBtn.title = 'Start a conversation with the seller';
        
        // 2. Clone and replace to remove all previous event listeners
        const newChatBtn = chatBtn.cloneNode(true);
        chatBtn.replaceWith(newChatBtn);
        chatBtn = newChatBtn;
        
        // 3. Attach the new listener
        chatBtn.addEventListener('click', () => {
            if (!itemData || !itemData.seller_id) {
                alert("Cannot start chat: Seller details missing.");
                return;
            }

            fetch('../server/message/start_chat.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    item_id: itemId,
                    seller_id: itemData.seller_id
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => { throw new Error(data.message || `HTTP error! status: ${response.status}`); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.chat_id) {
                    window.location.href = `messages.html?chat_id=${data.chat_id}`;
                } else {
                    alert(data.message || 'Failed to start chat.');
                }
            })
            .catch(error => {
                console.error('Error starting chat:', error);
                alert('Error starting chat: ' + error.message);
            });
        });
    }
}

// FIX: Simplified button enabling
function setupFavoritesButton() {
    let favoritesBtn = document.querySelector('.favorites-btn');

    if (favoritesBtn) {
        // 1. Remove disabled state and styling applied by disableAllButtons
        favoritesBtn.disabled = false;
        favoritesBtn.style.opacity = '1';
        favoritesBtn.style.cursor = 'pointer';
        favoritesBtn.title = 'Add this item to your favorites';
        
        // 2. Clone and replace to remove all previous event listeners
        const newFavoritesBtn = favoritesBtn.cloneNode(true);
        favoritesBtn.replaceWith(newFavoritesBtn);
        favoritesBtn = newFavoritesBtn;
        
        // 3. Attach the new listener
        favoritesBtn.addEventListener('click', () => {
            alert('Favorites function is now enabled and ready to be implemented!');
        });
    }
}

// FIX: Simplified button enabling
function setupPlaceBidButton() {
    let placeBidBtn = document.getElementById('placeBidBtn');
    const bidAmountInput = document.getElementById('bidAmount');
    
    if (!placeBidBtn || !bidAmountInput) {
        console.error('Bid button or input not found.');
        return;
    }
    
    // 1. Remove disabled state and styling applied by disableAllButtons
    placeBidBtn.disabled = false;
    placeBidBtn.style.opacity = '1';
    placeBidBtn.style.cursor = 'pointer';
    placeBidBtn.title = 'Place your bid now';

    // 2. Clone and replace to remove all previous event listeners
    const newPlaceBidBtn = placeBidBtn.cloneNode(true);
    placeBidBtn.replaceWith(newPlaceBidBtn);
    placeBidBtn = newPlaceBidBtn;
    
    // 3. Attach the new listener
    placeBidBtn.addEventListener('click', function(event) {
        event.preventDefault();
        
        const bidAmount = parseFloat(bidAmountInput.value);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            alert('Please enter a valid bid amount.');
            return;
        }

        const minimumBid = parseFloat(bidAmountInput.min);
        if (bidAmount < minimumBid) {
            alert(`Bid must be at least ₱${minimumBid.toFixed(2)}`);
            return;
        }

        fetch('../server/item/place_bid.php', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemId,
                bid_amount: bidAmount
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Bid placed successfully!');
                loadItemDetails(); 
                bidAmountInput.value = '';
            } else {
                alert(data.message || 'Failed to place bid');
            }
        })
        .catch(error => {
            console.error('Error placing bid:', error);
            alert('Error placing bid. Please try again.');
        });
    });
}

function loadHeader() {
    // Original logic for dynamic header loading
    fetch("header.html")
        .then(response => response.text())
        .then(header => {
            document.getElementById("header").innerHTML = header;
            const script = document.createElement("script");
            
            script.src = "js/header.js";
            script.defer = true;
            document.body.appendChild(script);
            setupBackButton();
        })
        .catch(error => console.error("Error loading header:", error));
}

function loadItemDetails() {
    console.log('Loading item details for ID:', itemId);
    
    fetch(`../server/item/get_item_details.php?item_id=${itemId}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            
            if (!data.success) {
                console.error('Server error:', data.message);
                alert('Error: ' + data.message);
                window.location.href = 'homepage.html';
                return;
            }
            
            if (!data.item) {
                console.error('No item data received');
                alert('No item data found');
                return;
            }

            currentUserId = data.current_user_id || '0'; 
            console.log('User ID from API (String):', currentUserId);
            
            console.log('Successfully loaded item:', data.item.title);
            itemData = data.item;
            bidIncrementPercent = parseFloat(itemData.bid_increment_percent || 0);
            
            enableFeatures(); 

            populateItemDetails(data);
            updateMinimumBid();
            startCountdown(itemData.end_date);
            setupImageGallery(data.images);
            displayBiddingHistory(data.bidding_history);
            currentHighestBid = parseFloat(data.item.current_highest_bid || data.item.starting_price);
        })
        .catch(error => {
            console.error('Error loading item:', error);
            alert('Failed to load item details: ' + error.message);
        });
}

function setupBackButton() {
    if (backToPreviousBtn) {
        backToPreviousBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
}

function populateItemDetails(data) {
    const item = data.item;
    
    const itemTitle = document.querySelector('.item-title');
    const itemDescription = document.querySelector('.item-description');
    const sellerName = document.querySelector('.seller-details h4');
    const sellerEmail = document.querySelector('.seller-details p');
    const viewProfileBtn = document.querySelector('.view-profile-btn');
    
    if (itemTitle) itemTitle.textContent = item.title;
    if (itemDescription) itemDescription.textContent = item.description;
    if (sellerName) sellerName.textContent = item.seller_name;
    if (sellerEmail) sellerEmail.textContent = item.seller_email;
    if (viewProfileBtn && item.seller_id) {
        viewProfileBtn.href = `profile.html?user_id=${item.seller_id}`;
    }

    const startingPrice = parseFloat(item.starting_price || 0);
    const currentHighest = parseFloat(item.current_highest_bid || startingPrice);
    
    const incrementAmount = currentHighest * (bidIncrementPercent / 100);
    const minimumBid = currentHighest + incrementAmount;
    
    const startingPriceElem = document.querySelector('.bid-pricing .price-item:first-child .price-value');
    const currentBidElem = document.querySelector('.bid-pricing .price-item.current-bid .price-value');
    
    if (startingPriceElem) startingPriceElem.textContent = `₱${startingPrice.toFixed(2)}`;
    if (currentBidElem) currentBidElem.textContent = `₱${currentHighest.toFixed(2)}`;
    
    const minBidTextElem = document.querySelector('.minimum-bid-text');
    if (minBidTextElem) {
        minBidTextElem.textContent = 
            `Minimum bid increment: ₱${incrementAmount.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
    }
    
    const bidAmountInput = document.getElementById('bidAmount');
    if (bidAmountInput) {
        bidAmountInput.min = minimumBid;
        bidAmountInput.placeholder = minimumBid.toFixed(2);
        bidAmountInput.step = "1";
    }
    
    const totalBids = data.bidding_history.length;
    const countElement = document.querySelector('.bid-time-and-count .count span');
    if (countElement) {
        countElement.textContent = totalBids;
    }
}

function updateMinimumBid() {
    const incrementAmount = currentHighestBid * (bidIncrementPercent / 100);
    const minimumBid = currentHighestBid + incrementAmount;

    const minBidTextElem = document.querySelector('.minimum-bid-text');
    if (minBidTextElem) {
        minBidTextElem.textContent = 
            `Minimum bid increment: ₱${incrementAmount.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
    }
    
    const bidAmountInput = document.getElementById('bidAmount');
    if (bidAmountInput) {
        bidAmountInput.min = minimumBid;
        bidAmountInput.placeholder = minimumBid.toFixed(2);
        bidAmountInput.step = "1";
    }
}

function setupReportButton() {
    const reportBtn = document.getElementById('reportBtn');

    if (reportBtn) {
        const newReportBtn = reportBtn.cloneNode(true);
        reportBtn.replaceWith(newReportBtn);
        
        newReportBtn.addEventListener('click', () => {
            const reportReason = prompt('Please enter the reason for reporting this item:');
            
            if (reportReason && reportReason.trim() !== '') {
                fetch('../server/item/report_item.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        item_id: itemId,
                        reason: reportReason
                    })
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
    }
}

function setupImageGallery(images) {
    if (!images || images.length === 0) {
        console.log('No images available, using default');
        setupDefaultImage();
        return;
    }
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    if (!mainImage) {
        console.error('Main image element not found');
        return;
    }
    
    const firstImage = images[0];
    const imagePath = `../server/item/${firstImage.image_path}`;
    console.log('Setting main image:', imagePath);
    mainImage.src = imagePath;
    
    mainImage.onerror = function() {
        console.error('Failed to load main image:', imagePath);
        mainImage.src = '../assets/images/default-item.jpg';
    };
    
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            const thumbPath = `../server/item/${img.image_path}`;
            thumbnail.src = thumbPath;
            thumbnail.alt = `Thumbnail ${index + 1}`;
            thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
            thumbnail.dataset.image = thumbPath;
            
            thumbnail.onerror = function() {
                console.error('Failed to load thumbnail:', thumbPath);
                thumbnail.src = '../assets/images/default-item.jpg';
            };
            
            thumbnail.addEventListener('click', () => {
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
                mainImage.src = thumbnail.dataset.image;
            });
            
            thumbnailContainer.appendChild(thumbnail);
        });
    }
}

function setupDefaultImage() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    if (mainImage) {
        mainImage.src = '../assets/images/default-item.jpg';
    }
    
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
    }
    
    console.log('Using default image');
}

function displayBiddingHistory(history) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) {
        console.error('Bidding history container not found');
        return;
    }
    
    historyList.innerHTML = '';
    
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; padding: 20px;">No bids yet. Be the first to bid!</p>';
        return;
    }
    
    const auctionEnded = isAuctionEnded();
    
    history.forEach((bid, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        if (index === 0) {
            historyItem.classList.add('current-high');
        }
        
        let badgeText = '';
        if (index === 0) {
            badgeText = auctionEnded ? 'Highest Bidder' : 'Current Highest Bid';
        }
        
        historyItem.innerHTML = `
            <img src="../assets/images/profile-placeholder.png" alt="Bidder" class="bidder-avatar">
            <div class="bidder-info">
                <h4>${bid.bidder_name || 'Anonymous Bidder'}</h4>
                <span class="bid-time">${bid.time_ago || 'Recently'}</span>
            </div>
            <div class="bid-amount-container">
                <span class="bid-amount">₱${parseFloat(bid.bid_amount).toFixed(2)}</span>
                ${index === 0 ? `<span class="current-high-badge">${badgeText}</span>` : ''}
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function isAuctionEnded() {
    if (!itemData || !itemData.end_date) {
        return false;
    }
    
    const endDateTime = new Date(itemData.end_date).getTime();
    const now = new Date().getTime();
    
    return endDateTime < now;
}

function startCountdown(endDate) {
    if (!endDate) {
        const countdownTimer = document.querySelector('.countdown-timer');
        if (countdownTimer) {
            countdownTimer.innerHTML = '<p>No end date specified</p>';
        }
        return;
    }
    
    const endDateTime = new Date(endDate).getTime();
    
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDateTime - now;

        if (distance < 0) {
            clearInterval(timer);
            updateTimerDisplay('00', '00', '00', '00');
            updateTimerLabel('Auction Ended');
            
            // Re-call loadItemDetails to disable buttons after auction ends
            loadItemDetails(); 
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        updateTimerDisplay(
            String(days).padStart(2, '0'),
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
        );
    }, 1000);
}

function updateTimerDisplay(days, hours, minutes, seconds) {
    const daysElem = document.getElementById('days');
    const hoursElem = document.getElementById('hours');
    const minutesElem = document.getElementById('minutes');
    const secondsElem = document.getElementById('seconds');
    
    if (daysElem) daysElem.textContent = days;
    if (hoursElem) hoursElem.textContent = hours;
    if (minutesElem) minutesElem.textContent = minutes;
    if (secondsElem) secondsElem.textContent = seconds;
}

function updateTimerLabel(text) {
    const timerLabel = document.querySelector('.timer-label');
    if (timerLabel) {
        timerLabel.textContent = text;
    }
}

window.addEventListener('load', () => {
    if (!itemId) {
        alert('No item specified');
        window.location.href = 'homepage.html';
        return;
    }
    
    // Disable buttons initially while loading
    disableAllButtons('Loading item details...'); 

    loadHeader();
    loadItemDetails();
});