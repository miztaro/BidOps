// js/swaps-manage-offers.js

// DOM elements assumed to exist in the seller's dashboard/modal
const manageOffersModal = document.getElementById('manage-offers-modal');
const offersListContainer = document.getElementById('swap-offers-list');
const modalCloseBtn = document.getElementById('close-manage-offers-modal');
const itemTitleElement = document.getElementById('current-swap-item-title');

// Attach listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    // Listener to open the modal (e.g., a button on the seller's item card)
    document.addEventListener('click', (event) => {
        const manageBtn = event.target.closest('.manage-swap-offers-btn');
        if (!manageBtn) return;

        const itemId = manageBtn.getAttribute('data-item-id');
        if (!itemId) {
            console.error("Missing item ID for managing offers.");
            return;
        }
        
        // Store the item ID in the modal for context (optional)
        if (manageOffersModal) manageOffersModal.dataset.itemId = itemId;

        loadSellerSwapOffers(itemId);
        if (manageOffersModal) manageOffersModal.classList.add('active');
    });

    // Listener to close the modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (manageOffersModal) manageOffersModal.classList.remove('active');
        });
    }
});


/**
 * Fetches and displays all pending swap offers for the seller's item.
 * @param {string} itemId - The ID of the seller's item being requested.
 */
async function loadSellerSwapOffers(itemId) {
    if (!offersListContainer) return;
    offersListContainer.innerHTML = '<li>Loading offers...</li>';

    try {
        const response = await fetch(`../server/item/get_seller_swap_offers.php?item_id=${itemId}`);
        const data = await response.json();

        if (!data.success) {
            offersListContainer.innerHTML = `<li class="error-msg">Error: ${data.message}</li>`;
            return;
        }

        const item = data.item;
        const offers = data.swap_offers;
        
        if (itemTitleElement) {
            itemTitleElement.textContent = item.title;
        }

        if (offers.length === 0) {
            offersListContainer.innerHTML = '<li class="no-offers">No pending swap offers for this item.</li>';
            return;
        }

        renderSwapOffers(offers);

    } catch (error) {
        console.error('Error fetching swap offers:', error);
        offersListContainer.innerHTML = '<li class="error-msg">Failed to connect to the server.</li>';
    }
}

/**
 * Renders the list of offers dynamically.
 * @param {Array<Object>} offers 
 */
function renderSwapOffers(offers) {
    if (!offersListContainer) return;
    offersListContainer.innerHTML = '';

    offers.forEach(offer => {
        // Only display pending offers
        if (offer.swap_status !== 'pending') return;

        const listItem = document.createElement('li');
        listItem.className = 'swap-offer-card';
        listItem.dataset.swapId = offer.swap_id;

        const imagePath = offer.offered_item_image || '../assets/images/placeholder-swap.png';

        listItem.innerHTML = `
            <div class="offer-header">
                <span class="status-badge status-${offer.swap_status}">${offer.swap_status.toUpperCase()}</span>
                <span class="offered-time">${offer.time_ago}</span>
            </div>
            <div class="offer-details">
                <img src="../server/item/${imagePath}" alt="${offer.offered_item_title}" class="offer-item-img">
                <div class="item-info">
                    <h5 class="item-title">${offer.offered_item_title}</h5>
                    <p class="offerer-name">Offered by: <strong>${offer.offerer_name}</strong></p>
                    <p class="item-desc">${offer.offered_item_description.substring(0, 80)}...</p>
                </div>
            </div>
            <div class="offer-actions">
                <button class="action-btn accept-btn" data-swap-id="${offer.swap_id}">
                    <iconify-icon icon="mdi:check-circle"></iconify-icon> Accept
                </button>
                <button class="action-btn decline-btn" data-swap-id="${offer.swap_id}">
                    <iconify-icon icon="mdi:close-circle"></iconify-icon> Decline
                </button>
            </div>
        `;
        offersListContainer.appendChild(listItem);
    });
    
    // Attach event listeners to the new Accept/Decline buttons
    offersListContainer.querySelectorAll('.accept-btn').forEach(button => {
        button.addEventListener('click', handleSwapAction);
    });

    offersListContainer.querySelectorAll('.decline-btn').forEach(button => {
        button.addEventListener('click', handleSwapAction);
    });
}

/**
 * Handles the click event for accepting or declining a swap offer.
 * @param {Event} event 
 */
async function handleSwapAction(event) {
    const button = event.target.closest('.action-btn');
    const swapId = button.dataset.swapId;
    const action = button.classList.contains('accept-btn') ? 'accept' : 'decline';

    if (!confirm(`Are you sure you want to ${action} this swap offer?`)) {
        return;
    }

    // Disable button to prevent double-click
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        const response = await fetch('../server/item/manage_swap.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ swap_id: swapId, action: action })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            // Visually update the offer status on success
            const card = document.querySelector(`.swap-offer-card[data-swap-id="${swapId}"]`);
            if (card) {
                // If accepted, refresh the whole list (since acceptance declines others)
                if (action === 'accept') {
                    const currentItemId = manageOffersModal.dataset.itemId;
                    loadSellerSwapOffers(currentItemId);
                } else {
                    // If declined, just remove the card and update the offer count
                    card.remove();
                    // Optional: logic to update total offer count display
                }
            }
        } else {
            alert(`Action failed: ${result.message}`);
            button.disabled = false;
            button.textContent = action.charAt(0).toUpperCase() + action.slice(1);
        }

    } catch (error) {
        console.error('Error managing swap:', error);
        alert('An unexpected error occurred while processing the swap.');
        button.disabled = false;
        button.textContent = action.charAt(0).toUpperCase() + action.slice(1);
    }
}