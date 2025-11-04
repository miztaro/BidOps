const urlParams = new URLSearchParams(window.location.search);
const backToPreviousBtn = document.getElementById('backToPrevious');
const itemId = urlParams.get('item_id');

let itemData = null;
let currentHighestBid = 0;
let minimumIncrement = 5.00;

window.addEventListener('load', () => {
    if (!itemId) {
        alert('No item specified');
        window.location.href = 'homepage.html';
        return;
    }
    
    loadHeader();
    loadItemDetails();
});

function setupBackButton() {
    if (backToPreviousBtn) {
        backToPreviousBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
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
            
            console.log('Successfully loaded item:', data.item.title);
            itemData = data.item;
            populateItemDetails(data);
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

function populateItemDetails(data) {
    const item = data.item;
    
    document.querySelector('.item-title').textContent = item.title;
    document.querySelector('.item-description').textContent = item.description;
    
    document.querySelector('.seller-details h4').textContent = item.seller_name;
    document.querySelector('.seller-details p').textContent = item.seller_email;
    document.querySelector('.view-profile-btn').href = `profile.html?user_id=${item.seller_id}`;
    
    const startingPrice = parseFloat(item.starting_price || 0);
    const currentHighest = parseFloat(item.current_highest_bid || startingPrice);
    
    document.querySelector('.bid-pricing .price-item:first-child .price-value').textContent = 
        `₱${startingPrice.toFixed(2)}`;
    document.querySelector('.bid-pricing .price-item.current-bid .price-value').textContent = 
        `₱${currentHighest.toFixed(2)}`;
    
    const minimumBid = currentHighest + minimumIncrement;
    document.querySelector('.minimum-bid-text').textContent = 
        `Minimum bid increment: ₱${minimumIncrement.toFixed(2)} (Next minimum: ₱${minimumBid.toFixed(2)})`;
    
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

function setupImageGallery(images) {
    if (!images || images.length === 0) {
        console.log('No images available, using default');
        setupDefaultImage();
        return;
    }
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    const firstImage = images[0];
    const imagePath = `../server/item/${firstImage.image_path}`;
    console.log('Setting main image:', imagePath);
    mainImage.src = imagePath;
    
    mainImage.onerror = function() {
        console.error('Failed to load main image:', imagePath);
        mainImage.src = '../assets/images/default-item.jpg';
    };
    
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

function setupDefaultImage() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    mainImage.src = '../assets/images/default-item.jpg';
    thumbnailContainer.innerHTML = '';
    
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
                <h4>${bid.bidder_name}</h4>
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
            
            loadItemDetails();
            
            const placeBidBtn = document.getElementById('placeBidBtn');
            if (placeBidBtn) {
                placeBidBtn.disabled = true;
                placeBidBtn.innerHTML = 'Auction Ended';
                placeBidBtn.style.backgroundColor = '#8C8A8A';
                placeBidBtn.style.cursor = 'not-allowed';
            }
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

const placeBidBtn = document.getElementById('placeBidBtn');
const bidAmountInput = document.getElementById('bidAmount');

if (placeBidBtn && bidAmountInput) {
    placeBidBtn.addEventListener('click', () => {
        const bidAmount = parseFloat(bidAmountInput.value);
        const minimumBid = currentHighestBid + minimumIncrement;

        if (!bidAmount || isNaN(bidAmount)) {
            alert('Please enter a valid bid amount.');
            return;
        }

        if (bidAmount < minimumBid) {
            alert(`Your bid must be at least ₱${minimumBid.toFixed(2)} (Current highest bid + ₱${minimumIncrement.toFixed(2)} increment)`);
            return;
        }

        const confirmBid = confirm(`Are you sure you want to place a bid of ₱${bidAmount.toFixed(2)}?`);
        
        if (confirmBid) {
            submitBid(bidAmount);
        }
    });
}

function submitBid(bidAmount) {
    const placeBidBtn = document.getElementById('placeBidBtn');
    if (!placeBidBtn) return;
    
    placeBidBtn.disabled = true;
    placeBidBtn.textContent = 'Placing bid...';
    
    fetch('../server/item/place_bid.php', {
        method: 'POST',
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
        placeBidBtn.disabled = false;
        placeBidBtn.innerHTML = '<iconify-icon icon="mdi:gavel"></iconify-icon> Place Bid';
        
        if (data.success) {
            alert('Bid placed successfully!');
            
            currentHighestBid = bidAmount;
            const currentBidElement = document.querySelector('.current-bid .price-value');
            if (currentBidElement) {
                currentBidElement.textContent = `₱${bidAmount.toFixed(2)}`;
            }
            
            const newMinimum = bidAmount + minimumIncrement;
            const minBidText = document.querySelector('.minimum-bid-text');
            if (minBidText) {
                minBidText.textContent = 
                    `Minimum bid increment: ₱${minimumIncrement.toFixed(2)} (Next minimum: ₱${newMinimum.toFixed(2)})`;
            }
            
            const bidAmountInput = document.getElementById('bidAmount');
            if (bidAmountInput) {
                bidAmountInput.value = '';
                bidAmountInput.min = newMinimum;
                bidAmountInput.placeholder = newMinimum.toFixed(2);
                bidAmountInput.step = "1";
            }
            
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

const favoritesBtn = document.querySelector('.favorites-btn');
let isFavorite = false;

if (favoritesBtn) {
    favoritesBtn.addEventListener('click', () => {
        isFavorite = !isFavorite;
        
        if (isFavorite) {
            favoritesBtn.style.backgroundColor = '#B41B1B';
            favoritesBtn.style.color = '#fff';
            favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Added to Favorites';
        } else {
            favoritesBtn.style.backgroundColor = '#FFE100';
            favoritesBtn.style.color = '#073066';
            favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Add to Favorites';
        }
    });
}

const chatBtn = document.querySelector('.chat-btn');

if (chatBtn) {
    chatBtn.addEventListener('click', () => {
        if (!itemData) return;
        
        window.location.href = `chat.html?seller_id=${itemData.seller_id}&item_id=${itemId}`;
    });
}

const reportBtn = document.getElementById('reportBtn');

if (reportBtn) {
    reportBtn.addEventListener('click', () => {
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

if (bidAmountInput) {
    bidAmountInput.addEventListener('blur', () => {
        if (bidAmountInput.value) {
            const value = parseFloat(bidAmountInput.value);
            if (!isNaN(value)) {
                bidAmountInput.value = value.toFixed(2);
            }
        }
    });

    bidAmountInput.addEventListener('input', () => {
        if (bidAmountInput.value < 0) {
            bidAmountInput.value = 0;
        }
    });
}