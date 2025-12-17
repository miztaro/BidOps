const urlParams = new URLSearchParams(window.location.search);
const backToPreviousBtn = document.getElementById('backToPrevious');
const placeBidBtn = document.getElementById('placeBidBtn');
const itemId = urlParams.get('item_id');

let itemData = null;
let currentHighestBid = 0;
let bidIncrementPercent = 0.00;
let currentUserId = '0'; 

function calculateMinimumBid(currentHighest, incrementPercent, isHighestDeclined = false) {
    // If no current highest bid (N/A scenario), we should use starting price
    if (!currentHighest || currentHighest === 0) {
        if (itemData && itemData.starting_price) {
            const startingPrice = parseFloat(itemData.starting_price || 0);
            const safeIncrement = parseFloat(incrementPercent || 0) / 100;
            const incrementAmount = startingPrice * safeIncrement;
            
            return { 
                minimumBid: startingPrice, 
                incrementAmount: incrementAmount 
            };
        }
        return { minimumBid: 0, incrementAmount: 0 };
    }
    
    let safeHighest = parseFloat(currentHighest || 0);
    const safeIncrement = parseFloat(incrementPercent || 0) / 100;
    
    // If the highest bid is declined, use starting price instead
    if (isHighestDeclined && itemData) {
        safeHighest = parseFloat(itemData.starting_price || 0);
    }
    
    const incrementAmount = safeHighest * safeIncrement;
    const minimumBid = safeHighest + incrementAmount;

    return { 
        minimumBid: minimumBid, 
        incrementAmount: incrementAmount 
    };
}

function disableAndUnbind(selector, title, defaultText, elementId = null) {
    const originalElement = elementId ? document.getElementById(elementId) : document.querySelector(selector);
    
    if (originalElement) {
        const newElement = originalElement.cloneNode(true); 
        
        newElement.disabled = true;
        newElement.style.opacity = '0.6';
        newElement.style.cursor = 'not-allowed';
        newElement.title = title;
        
        if (defaultText) {
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
    const isSeller = itemData && itemData.seller_id === currentUserId && isLoggedIn; 
    const isEnded = isAuctionEnded();

    if (isEnded) {
        disableAllButtons('Auction has ended.');
    } else if (isSeller) {
        disableAllButtons('You are the seller of this item. Cannot bid or chat.');
    } else if (!isLoggedIn) {
        disableAllButtons('Please log in to bid or chat.');
    } else {
        setupPlaceBidButton();
        setupFavoritesButton(); 
        setupChatButton();
    }
}

function setupChatButton() {
    let chatBtn = document.querySelector('.chat-btn');
    
    if (chatBtn) {
        chatBtn.disabled = false;
        chatBtn.style.opacity = '1';
        chatBtn.style.cursor = 'pointer';
        chatBtn.title = 'Start a conversation with the seller';
        
        const newChatBtn = chatBtn.cloneNode(true);
        chatBtn.replaceWith(newChatBtn);
        chatBtn = newChatBtn;
        
        newChatBtn.addEventListener('click', () => {
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

function setupFavoritesButton() {
    let favoritesBtn = document.querySelector('.favorites-btn');

    if (favoritesBtn) {
        favoritesBtn.disabled = false;
        favoritesBtn.style.opacity = '1';
        favoritesBtn.style.cursor = 'pointer';
        favoritesBtn.title = 'Add this item to your favorites';
        
        const newFavoritesBtn = favoritesBtn.cloneNode(true);
        favoritesBtn.replaceWith(newFavoritesBtn);
        favoritesBtn = newFavoritesBtn;
        
        newFavoritesBtn.addEventListener('click', () => {
            alert('Favorites function is now enabled and ready to be implemented!');
        });
    }
}

function setupPlaceBidButton() {
    let placeBidBtn = document.getElementById('placeBidBtn');
    const bidAmountInput = document.getElementById('bidAmount');
    
    if (!placeBidBtn || !bidAmountInput) {
        console.error('Bid button or input not found.');
        return;
    }
    
    placeBidBtn.disabled = false;
    placeBidBtn.style.opacity = '1';
    placeBidBtn.style.cursor = 'pointer';
    placeBidBtn.title = 'Place your bid now';

    const newPlaceBidBtn = placeBidBtn.cloneNode(true);
    placeBidBtn.replaceWith(newPlaceBidBtn);
    placeBidBtn = newPlaceBidBtn;
    
    newPlaceBidBtn.addEventListener('click', function(event) {
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
                bidAmountInput.value = '';
                loadItemDetails(); 
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
    fetch(`../server/item/get_item_details.php?item_id=${itemId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                alert('Error: ' + data.message);
                window.location.href = 'homepage.html';
                return;
            }
            
            if (!data.item) {
                alert('No item data found');
                return;
            }

            currentUserId = data.current_user_id || '0'; 
            itemData = data.item;
            bidIncrementPercent = parseFloat(itemData.bid_increment_percent || 0);
            
            const hasActiveBids = data.bidding_history && 
                data.bidding_history.some(bid => 
                    bid.bid_status === 'active' || 
                    !bid.bid_status || 
                    bid.bid_status === ''
                );
            
            if (hasActiveBids && itemData.current_highest_bid) {
                currentHighestBid = parseFloat(itemData.current_highest_bid);
            } else {
                currentHighestBid = 0;
            }

            enableFeatures(); 

            // Fill title/description/prices/etc.
            populateItemDetails(data);

            // NEW: fill seller text + bind click to seller profile
            const sellerNameEl  = document.querySelector('.seller-details h4');
            const sellerEmailEl = document.querySelector('.seller-details p');
            const sellerProfileLink = document.getElementById('sellerProfileLink');

            if (sellerNameEl)  sellerNameEl.textContent  = data.item.seller_name  || 'Unknown Seller';
            if (sellerEmailEl) sellerEmailEl.textContent = data.item.seller_email || 'No email';

            if (sellerProfileLink && data.item.seller_id) {
                sellerProfileLink.style.cursor = 'pointer';
                sellerProfileLink.onclick = () => {
                    console.log('CLICK sellerProfileLink → seller-profile.html for', data.item.seller_id);
                    window.location.href =
                        `seller-profile.html?seller_id=${encodeURIComponent(data.item.seller_id)}`;
                };
            } else {
                console.warn('sellerProfileLink missing or no seller_id');
            }

            updateMinimumBid();
            startCountdown(itemData.end_date);
            setupImageGallery(data.images);
            displayBiddingHistory(data.bidding_history);
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

    // FIX: Check if current_highest_bid is NULL or 0
    const hasActiveBids = data.bidding_history && 
        data.bidding_history.some(bid => 
            bid.bid_status === 'active' || 
            !bid.bid_status || 
            bid.bid_status === ''
        );
    
    currentHighestBid = hasActiveBids && item.current_highest_bid ? 
        parseFloat(item.current_highest_bid) : 0;
    
    const startingPrice = parseFloat(item.starting_price || 0);
    const { minimumBid, incrementAmount } = calculateMinimumBid(
        currentHighestBid || startingPrice, 
        bidIncrementPercent
    );
    
    const startingPriceElem = document.querySelector('.bid-pricing .price-item:first-child .price-value');
    const currentBidElem = document.querySelector('.bid-pricing .price-item.current-bid .price-value');
    
    if (startingPriceElem) startingPriceElem.textContent = `₱${startingPrice.toFixed(2)}`;
    
    if (currentBidElem) {
        if (!hasActiveBids) {
            currentBidElem.textContent = 'N/A';
            currentBidElem.style.color = '#666';
            currentBidElem.style.fontStyle = 'italic';
            
            // Remove any existing note
            const existingNote = currentBidElem.querySelector('.declined-note');
            if (existingNote) {
                existingNote.remove();
            }
        } else {
            currentBidElem.textContent = `₱${currentHighestBid.toFixed(2)}`;
            currentBidElem.style.fontStyle = 'normal';
            
            // Check if the current highest bid is inactive
            const history = data.bidding_history || [];
            const highestBid = history.find(bid => 
                parseFloat(bid.bid_amount) === currentHighestBid && 
                (bid.bid_status === 'declined' || bid.bid_status === 'outbid')
            );
            
            if (highestBid) {
                // Remove any existing note
                const existingNote = currentBidElem.querySelector('.declined-note');
                if (existingNote) {
                    existingNote.remove();
                }
                
                // Add the note
                const noteElem = document.createElement('span');
                noteElem.className = 'declined-note';
                noteElem.textContent = ' (Declined)';
                currentBidElem.appendChild(noteElem);
                
                // Change color to red
                currentBidElem.style.color = '#e74c3c';
            } else {
                // Reset color to normal
                currentBidElem.style.color = '#B41B1B';
            }
        }
    }
    
    const minBidTextElem = document.querySelector('.minimum-bid-text');
    if (minBidTextElem) {
        if (!hasActiveBids) {
            minBidTextElem.textContent = 
                `Starting bid: ₱${startingPrice.toFixed(2)}`;
        } else {
            minBidTextElem.textContent = 
                `Minimum bid increment: ₱${incrementAmount.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
        }
    }
    
    const bidAmountInput = document.getElementById('bidAmount');
    if (bidAmountInput) {
        if (!hasActiveBids) {
            bidAmountInput.min = startingPrice;
            bidAmountInput.placeholder = startingPrice.toFixed(2);
        } else {
            bidAmountInput.min = minimumBid;
            bidAmountInput.placeholder = minimumBid.toFixed(2);
        }
        bidAmountInput.step = "1";
    }
    
    const totalBids = data.bidding_history.length;
    const countElement = document.querySelector('.bid-time-and-count .count span');
    if (countElement) {
        countElement.textContent = totalBids;
    }
}

function updateMinimumBid() {
    // Check if there are active bids
    const hasActiveBids = itemData && itemData.current_highest_bid && 
        parseFloat(itemData.current_highest_bid) > 0;
    
    const startingPrice = parseFloat(itemData?.starting_price || 0);
    
    if (!hasActiveBids) {
        // No active bids yet
        const minBidTextElem = document.querySelector('.minimum-bid-text');
        if (minBidTextElem) {
            minBidTextElem.textContent = `Starting bid: ₱${startingPrice.toFixed(2)}`;
        }
        
        const bidAmountInput = document.getElementById('bidAmount');
        if (bidAmountInput) {
            bidAmountInput.min = startingPrice;
            bidAmountInput.placeholder = startingPrice.toFixed(2);
        }
        
        // Update current bid display if needed
        const currentBidElem = document.querySelector('.bid-pricing .price-item.current-bid .price-value');
        if (currentBidElem && currentBidElem.textContent !== 'N/A') {
            currentBidElem.textContent = 'N/A';
            currentBidElem.style.color = '#666';
            currentBidElem.style.fontStyle = 'italic';
        }
        
        return;
    }
    
    // There are active bids, use normal calculation
    const { minimumBid, incrementAmount } = calculateMinimumBid(currentHighestBid, bidIncrementPercent);

    const minBidTextElem = document.querySelector('.minimum-bid-text');
    if (minBidTextElem) {
        minBidTextElem.textContent = 
            `Minimum bid increment: ₱${incrementAmount.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
    }
    
    const bidAmountInput = document.getElementById('bidAmount');
    if (bidAmountInput) {
        bidAmountInput.min = minimumBid;
        if (minimumBid > 0) {
            bidAmountInput.placeholder = minimumBid.toFixed(2);
        } else if (itemData) {
            bidAmountInput.placeholder = startingPrice.toFixed(2);
        }
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
    const imagePath = firstImage.image_path;
    mainImage.src = imagePath;
    
    mainImage.onerror = function() {
        mainImage.src = '../assets/images/default-item.jpg';
    };
    
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        images.forEach((img, index) => {
            const thumbnail = document.createElement('img');
            const thumbPath = img.image_path;
            thumbnail.src = thumbPath;
            thumbnail.alt = `Thumbnail ${index + 1}`;
            thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
            thumbnail.dataset.image = thumbPath;
            
            thumbnail.onerror = function() {
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
    
    // Sort bids by amount (highest first)
    const sortedHistory = [...history].sort((a, b) => {
        if (parseFloat(b.bid_amount) !== parseFloat(a.bid_amount)) {
            return parseFloat(b.bid_amount) - parseFloat(a.bid_amount);
        }
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // Find the absolute highest bid
    const absoluteHighestBid = sortedHistory.length > 0 ? 
        parseFloat(sortedHistory[0].bid_amount) : 0;
    
    sortedHistory.forEach((bid, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        // Check if bid is inactive
        const isDeclined = bid.bid_status === 'declined';
        const isOutbid = bid.bid_status === 'outbid';
        const isInactive = isDeclined || isOutbid || !bid.bid_status || bid.bid_status === '';
        
        if (isInactive) {
            historyItem.classList.add('declined-bid');
        }
        
        // Check if this is the absolute highest bid
        const isAbsoluteHighest = parseFloat(bid.bid_amount) === absoluteHighestBid;
        if (isAbsoluteHighest) {
            historyItem.classList.add('current-high');
        }
        
        let badgeText = '';
        if (isAbsoluteHighest) {
            if (isInactive) {
                badgeText = 'Current Highest: Declined';
            } else {
                badgeText = 'Current Highest';
            }
        }
        
        historyItem.innerHTML = `
            <img src="../assets/images/profile-placeholder.png" alt="Bidder" class="bidder-avatar">
            <div class="bidder-info">
                <h4>${bid.bidder_name || 'Anonymous Bidder'}</h4>
                <span class="bid-time">${bid.time_ago || 'Recently'}</span>
            </div>
            <div class="bid-amount-container">
                <span class="bid-amount ${isInactive ? 'declined-amount' : ''}">₱${parseFloat(bid.bid_amount).toFixed(2)}</span>
                ${badgeText ? `<span class="${isInactive ? 'declined-badge' : 'current-high-badge'}">${badgeText}</span>` : ''}
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
            
            enableFeatures(); 
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

function populateBidDetails(data) {
    const item = data.item;

    console.log('Populating bid details for:', item.title, 'seller_id:', item.seller_id);


    const titleEl = document.querySelector('.item-title');
    const descEl  = document.querySelector('.item-description');
    if (titleEl) titleEl.textContent = item.title || 'No Title';
    if (descEl)  descEl.textContent  = item.description || 'No description available.';


    const sellerName  = document.querySelector('.seller-details h4');
    const sellerEmail = document.querySelector('.seller-details p');
    if (sellerName)  sellerName.textContent  = item.seller_name  || 'Unknown Seller';
    if (sellerEmail) sellerEmail.textContent = item.seller_email || 'No email';

    const sellerProfileLink = document.getElementById('sellerProfileLink');
    if (sellerProfileLink && item.seller_id) {
        sellerProfileLink.onclick = null; // clear old
        sellerProfileLink.addEventListener('click', () => {
            console.log('CLICK sellerProfileLink → going to seller-profile.html for', item.seller_id);
            window.location.href =
                `seller-profile.html?seller_id=${encodeURIComponent(item.seller_id)}`;
        });
    } else {
        console.warn('sellerProfileLink missing or no seller_id');
    }

}


window.addEventListener('load', () => {
    if (!itemId) {
        alert('No item specified');
        window.location.href = 'homepage.html';
        return;
    }
    
    disableAllButtons('Loading item details...'); 
    loadHeader();
    loadItemDetails();
});