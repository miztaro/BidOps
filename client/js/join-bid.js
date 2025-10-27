// Countdown Timer
function startCountdown() {
    // Set target end date (example: 2 days, 16 hours from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 2);
    endDate.setHours(endDate.getHours() + 16);
    endDate.setMinutes(endDate.getMinutes() + 32);
    endDate.setSeconds(endDate.getSeconds() + 18);

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;

        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update display
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

        // Stop countdown when time expires
        if (distance < 0) {
            clearInterval(timer);
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            
            // Disable bid button
            const placeBidBtn = document.getElementById('placeBidBtn');
            placeBidBtn.disabled = true;
            placeBidBtn.textContent = 'Auction Ended';
            placeBidBtn.style.backgroundColor = '#8C8A8A';
            placeBidBtn.style.cursor = 'not-allowed';
        }
    }, 1000);
}

// Image Gallery - Thumbnail Click
const thumbnails = document.querySelectorAll('.thumbnail');
const mainImage = document.getElementById('mainImage');

thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', () => {
        // Remove active class from all thumbnails
        thumbnails.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked thumbnail
        thumbnail.classList.add('active');
        
        // Change main image
        const newImageSrc = thumbnail.getAttribute('data-image');
        mainImage.src = newImageSrc;
    });
});

// Place Bid Button - Validation
const placeBidBtn = document.getElementById('placeBidBtn');
const bidAmountInput = document.getElementById('bidAmount');

placeBidBtn.addEventListener('click', () => {
    const bidAmount = parseFloat(bidAmountInput.value);
    const currentHighestBid = 69.50; // This should be dynamic from your database
    const minimumIncrement = 5.00;
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

    // If validation passes, show confirmation
    const confirmBid = confirm(`Are you sure you want to place a bid of ₱${bidAmount.toFixed(2)}?`);
    
    if (confirmBid) {
        // Here you would send the bid to your server
        // For now, we'll just show a success message
        alert('Bid placed successfully!');
        
        // Add new bid to history (for demo purposes)
        addBidToHistory('You', bidAmount, 'Just now', true);
        
        // Update current highest bid display
        document.querySelector('.current-bid .price-value').textContent = `₱${bidAmount.toFixed(2)}`;
        
        // Clear input
        bidAmountInput.value = '';
        
        // Update minimum bid text
        const newMinimum = bidAmount + minimumIncrement;
        document.querySelector('.minimum-bid-text').textContent = `Minimum bid increment: ₱${minimumIncrement.toFixed(2)} (Next minimum: ₱${newMinimum.toFixed(2)})`;
    }
});

// Add Bid to History Function
function addBidToHistory(bidderName, amount, time, isCurrentHigh = false) {
    const historyList = document.querySelector('.history-list');
    
    // Remove current-high class from all items
    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('current-high');
        const badge = item.querySelector('.current-high-badge');
        if (badge) badge.remove();
    });
    
    // Create new history item
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');
    if (isCurrentHigh) {
        historyItem.classList.add('current-high');
    }
    
    historyItem.innerHTML = `
        <img src="../assets/images/profile-placeholder.png" alt="Bidder" class="bidder-avatar">
        <div class="bidder-info">
            <h4>${bidderName}</h4>
            <span class="bid-time">${time}</span>
        </div>
        <div class="bid-amount-container">
            <span class="bid-amount">₱${amount.toFixed(2)}</span>
            ${isCurrentHigh ? '<span class="current-high-badge">Current High</span>' : ''}
        </div>
    `;
    
    // Insert at the beginning of the list
    historyList.insertBefore(historyItem, historyList.firstChild);
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
        alert('Item added to favorites!');
    } else {
        favoritesBtn.style.backgroundColor = '#FFE100';
        favoritesBtn.style.color = '#073066';
        favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Add to Favorites';
        alert('Item removed from favorites!');
    }
});

// Chat with Seller Button
const chatBtn = document.querySelector('.chat-btn');

chatBtn.addEventListener('click', () => {
    alert('Opening chat with seller...');
    // Here you would redirect to chat page or open chat modal
    // window.location.href = 'chat.html?seller_id=123';
});

// Report Button
const reportBtn = document.getElementById('reportBtn');

reportBtn.addEventListener('click', () => {
    const reportReason = prompt('Please enter the reason for reporting this item:');
    
    if (reportReason && reportReason.trim() !== '') {
        // Here you would send the report to your server
        alert('Thank you for your report. We will review this item shortly.');
        console.log('Report submitted:', reportReason);
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

// Initialize countdown on page load
window.addEventListener('load', () => {
    startCountdown();
});

// Prevent negative numbers in bid input
bidAmountInput.addEventListener('input', () => {
    if (bidAmountInput.value < 0) {
        bidAmountInput.value = 0;
    }
});