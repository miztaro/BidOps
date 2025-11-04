const urlParams = new URLSearchParams(window.location.search);
const backToPreviousBtn = document.getElementById('backToPrevious');
const placeSwapBtn = document.getElementById('placeSwapBtn');
const itemId = urlParams.get('item_id');
let swapItemData = null;

window.addEventListener('load', () => {
    if (!itemId) {
        alert('No swap item specified');
        window.location.href = 'homepage.html';
        return;
    }
    
    loadHeader();
    disableAllButtons();
    loadSwapItemDetails();
});

function disableAllButtons() {
    // Disable Place Swap Offer button
    if (placeSwapBtn) {
        placeSwapBtn.disabled = true;
        placeSwapBtn.style.opacity = '0.6';
        placeSwapBtn.style.cursor = 'not-allowed';
        placeSwapBtn.title = 'Swap feature is currently disabled';
        placeSwapBtn.innerHTML = '<iconify-icon icon="mdi:swap-horizontal"></iconify-icon> Place Swap Offer';
        
        // Remove the click event listener
        placeSwapBtn.replaceWith(placeSwapBtn.cloneNode(true));
    }
    
    // Disable Add to Favorites button
    const favoritesBtn = document.querySelector('.favorites-btn');
    if (favoritesBtn) {
        favoritesBtn.disabled = true;
        favoritesBtn.style.opacity = '0.6';
        favoritesBtn.style.cursor = 'not-allowed';
        favoritesBtn.title = 'Favorites feature is currently disabled';
        favoritesBtn.innerHTML = '<iconify-icon icon="mdi:heart"></iconify-icon> Add to Favorites';
        
        // Remove the click event listener
        favoritesBtn.replaceWith(favoritesBtn.cloneNode(true));
    }
    
    // Disable Chat with Seller button
    const chatBtn = document.querySelector('.chat-btn');
    if (chatBtn) {
        chatBtn.disabled = true;
        chatBtn.style.opacity = '0.6';
        chatBtn.style.cursor = 'not-allowed';
        chatBtn.title = 'Chat feature is currently disabled';
        chatBtn.innerHTML = '<iconify-icon icon="mdi:message"></iconify-icon> Chat Seller';
        
        // Remove the click event listener
        chatBtn.replaceWith(chatBtn.cloneNode(true));
    }
}

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

function loadSwapItemDetails() {
    console.log('Loading swap item details for ID:', itemId);
    
    fetch(`../server/item/get_swap_details.php?item_id=${itemId}`)
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
            swapItemData = data.item;
            populateSwapItemDetails(data);
            
            if (data.images && data.images.length > 0) {
                setupImageGallery(data.images);
            } else {
                console.log('No images found for this item');
                setupDefaultImage();
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert('Failed to load swap item details. Check console for details.');
        });
}

function setupDefaultImage() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    mainImage.src = '../assets/images/slu-logo.png';
    
    thumbnailContainer.innerHTML = '';
    
    console.log('Using default image');
}

function populateSwapItemDetails(data) {
    const item = data.item;
    
    console.log('Populating details for:', item.title);
    
    document.querySelector('.item-title').textContent = item.title || 'No Title';
    document.querySelector('.item-description').textContent = item.description || 'No description available.';
    
    const sellerName = document.querySelector('.seller-details h4');
    const sellerEmail = document.querySelector('.seller-details p');
    const viewProfileBtn = document.querySelector('.view-profile-btn');
    
    if (sellerName) sellerName.textContent = item.seller_name || 'Unknown Seller';
    if (sellerEmail) sellerEmail.textContent = item.seller_email || 'No email';
    if (viewProfileBtn && item.seller_id) {
        viewProfileBtn.href = `profile.html?user_id=${item.seller_id}`;
    }
    
    console.log('Details populated successfully');
}

function setupImageGallery(images) {
    if (!images || images.length === 0) return;
    
    const mainImage = document.getElementById('mainImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    const firstImage = images[0];
    mainImage.src = `../server/item/${firstImage.image_path}`;
    
    thumbnailContainer.innerHTML = '';
    images.forEach((img, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = `../server/item/${img.image_path}`;
        thumbnail.alt = `Thumbnail ${index + 1}`;
        thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
        thumbnail.dataset.image = `../server/item/${img.image_path}`;
        
        thumbnail.addEventListener('click', () => {
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
            mainImage.src = thumbnail.dataset.image;
        });
        
        thumbnailContainer.appendChild(thumbnail);
    });
}


// placeSwapBtn.addEventListener('click', () => {
//     openSwapOfferModal();
// });

function openSwapOfferModal() {
    fetch('swap-modal.html')
        .then(response => response.text())
        .then(modalHTML => {
            document.getElementById('swapModalContainer').innerHTML = modalHTML;
            initializeSwapModal();
        })
        .catch(error => {
            console.error('Error loading swap modal:', error);
            alert('Failed to load swap modal');
        });
}

function initializeSwapModal() {
    const modalOverlay = document.getElementById('swapModalOverlay');
    const closeModal = document.getElementById('closeModal');
    const newItemFormElement = document.getElementById('newItemFormElement');
    const cancelSwap = document.getElementById('cancelSwap');

    document.getElementById('targetItemImage').src = document.getElementById('mainImage').src;
    document.getElementById('targetItemTitle').textContent = swapItemData.title;
    document.getElementById('targetItemDescription').textContent = swapItemData.description;
    document.getElementById('targetItemCategory').textContent = swapItemData.category_type;

    closeModal.addEventListener('click', () => {
        modalOverlay.remove();
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });

    cancelSwap.addEventListener('click', () => {
        modalOverlay.remove();
    });

    newItemFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const itemName = document.getElementById('itemName').value;
        const itemDescription = document.getElementById('itemDescription').value;
        const itemCategory = document.getElementById('itemCategory').value;
        const itemImage = document.getElementById('itemImage').files[0];
        const message = document.getElementById('swapMessage').value;
        
        if (!itemImage) {
            alert('Please upload an image for your item');
            return;
        }
        
        submitSwapOffer(itemName, itemDescription, itemCategory, itemImage, message);
    });
}

function submitSwapOffer(itemName, itemDescription, itemCategory, itemImage, message) {
    const submitBtn = document.querySelector('.submit-swap-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Offer...';

    const formData = new FormData();
    formData.append('item_id', itemId);
    formData.append('offered_item_title', itemName);
    formData.append('offered_item_description', itemDescription);
    formData.append('offered_item_category', itemCategory);
    formData.append('message', message);
    formData.append('item_image', itemImage);

    fetch('../server/item/submit_swap_offer.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Swap offer submitted successfully!');
            document.getElementById('swapModalOverlay').remove();
        } else {
            alert('Error: ' + result.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Swap Offer';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit swap offer. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Swap Offer';
    });
}