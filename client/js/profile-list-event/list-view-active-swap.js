let currentSwappingItemId = null;

// Close swap modal
const swappingModalClose = document.getElementById('swapping-modal-close');
const swappingModalOverlay = document.getElementById('swapping-modal-overlay');

if (swappingModalClose) {
    swappingModalClose.addEventListener('click', closeSwappingModal);
}

if (swappingModalOverlay) {
    swappingModalOverlay.addEventListener('click', function (event) {
        if (event.target === this) {
            closeSwappingModal();
        }
    });
}

export function openSwappingModal(id) {
    const modal = document.getElementById("swapping-modal-overlay");

    if (!modal) {
        console.error("Swapping modal not found!");
        return;
    }

    // Store current swap item ID
    currentSwappingItemId = id;

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show loading state
    const modalBody = document.getElementById("swapping-history-list");
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p>Loading swapping details...</p>
            </div>
        `;
    }

    // Fetch the swap offers
    fetchSwapOffers(id);
}

function closeSwappingModal() {
    const modal = document.getElementById('swapping-modal-overlay');
    if (!modal) {
        console.error("Swap modal not found!");
        return;
    }

    modal.classList.remove('active');
    document.body.style.overflow = '';

}

function fetchSwapOffers(itemId) {
    console.log('Fetching swap offers for item:', itemId);

    fetch(`../server/item/get_seller_swap_offers.php?item_id=${itemId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Swap offers data:', data);

            if (data.success) {
                populateSwapModal(data);
            } else {
                alert('Error loading swap offers: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching swap offers:', error);
            alert('Failed to load swap offers');
        });
}

function populateSwapModal(data) {
    const item = data.item;
    const images = data.images;
    const offers = data.swap_offers;

    console.log('Populating swap modal with:', { item, images, offers });

    // Set your item details
    document.getElementById('swapping-item-title').textContent = item.title;
    document.getElementById('swapping-item-category').textContent = item.category_type;
    document.getElementById('swapping-item-description').textContent = item.description || 'No description available.';

    // Set your item images
    if (images.length > 0) {
        const mainImage = document.getElementById('swapping-main-image');
        mainImage.src = `../server/item/${images[0].image_path}`;

        const thumbnailContainer = document.getElementById('swapping-thumbnails');
        thumbnailContainer.innerHTML = '';

        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = `../server/item/${img.image_path}`;
            thumb.classList.add(index === 0 ? 'active' : '');
            thumb.addEventListener('click', () => {
                mainImage.src = thumb.src;
                thumbnailContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbnailContainer.appendChild(thumb);
        });
    }

    // Set swap offers
    const offersList = document.getElementById('swapping-history-list');
    const totalOffersEl = document.getElementById('total-swappings');

    totalOffersEl.textContent = offers.length === 0 
        ? 'No Swapping Offers'
        : `${offers.length} Offer${offers.length !== 1 ? 's' : ''}`;

    if (offers.length === 0) {
        offersList.innerHTML = `
            <div class="swapping-empty-state"> <!-- fixed class name -->
                <iconify-icon icon="ph:swap-bold"></iconify-icon>
                <p>No swap offers yet</p>
                <p>When users offer items to swap, they'll appear here</p>
            </div>
        `;
    } else {
        offersList.innerHTML = '';
        offers.forEach(offer => {
            const offerCard = createSwapOfferCard(offer); 
            offersList.appendChild(offerCard);
        });
    }
}

function createSwapOfferCard(offer) {
    const swapItem = document.createElement('div');
    swapItem.classList.add('swapping-item');

    // Add a special class if the offer is still pending
    if (offer.swapping_status === 'pending') swapItem.classList.add('pending-swap');

    const initials = offer.offerer_name.charAt(0).toUpperCase();

    // Determine actions or badges
    let actionsHTML = '';
    if (offer.swap_status === 'pending') {
        actionsHTML = `
            <div class="swapping-actions">
                <button class="btn-accept" onclick="handleSwapAction(${offer.swap_id}, 'accept')">
                    <iconify-icon icon="material-symbols:check-circle" width="20" height="20"></iconify-icon>
                    Accept
                </button>
                <button class="btn-decline" onclick="handleSwapAction(${offer.swap_id}, 'decline')">
                    <iconify-icon icon="material-symbols:cancel" width="20" height="20"></iconify-icon>
                    Decline
                </button>
            </div>
        `;
    } else if (offer.swap_status === 'completed') {
        actionsHTML = '<span class="swapping-status-badge accepted">✓ Accepted</span>';
    } else if (offer.swap_status === 'cancelled') {
        actionsHTML = '<span class="swapping-status-badge declined">✗ Declined</span>';
    }

    // Construct the card
    swapItem.innerHTML = `
        <div class="swapping-item-header">
            <div class="swapper-info">
                <div class="swapper-avatar">${initials}</div>
                <div class="swapper-details">
                    <h4>${offer.offerer_name}</h4>
                    <p class="swapper-email">${offer.offerer_email}</p>
                    <p>${offer.time_ago}</p>
                </div>
            </div>
        </div>

        <div class="swapping-item-body">
            <div class="offered-item-title">${offer.offered_item_title || "User's Item"}</div>
            <p class="offered-item-category">
                ${offer.offered_item_category || 'N/A'}
            </p>
            <p class="offered-item-description">
                ${offer.offered_item_description || 'No description available'}
            </p>
        </div>

        ${actionsHTML}
    `;

    return swapItem;
}

// Handle Accept/Decline Swap Actions
window.handleSwapAction = function (swapId, action) {
    const confirmMessage = action === 'accept'
        ? 'Are you sure you want to accept this swap? Your item will be marked as swapped.'
        : 'Are you sure you want to decline this swap offer?';

    if (!confirm(confirmMessage)) return;

    fetch('../server/item/manage_swap.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            swap_id: swapId,
            action: action
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                // Refresh the modal and listings
                fetchSwapOffers(currentSwapItemId);
                if (typeof fetchListings === 'function') {
                    fetchListings();
                }
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to process swap action');
        });
};

// Make openSwapModal available globally
window.openSwapModal = openSwappingModal;