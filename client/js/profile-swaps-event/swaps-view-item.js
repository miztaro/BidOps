
document.addEventListener("DOMContentLoaded", function () {
    const viewItemOverlay = document.getElementById('swaps-view-overlay');
    const closeButton = document.getElementById('swaps-close-view-btn');
    const rateButton = document.querySelector(".swaps-head-sec .rate-btn");
    const cancelRateButton = document.querySelector("#swaps-rate-overlay .cancel-rate-btn");
    const messageButton = document.querySelector(".swaps-head-sec .message-btn");

    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.swaps-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        const itemId = viewItemBtn.getAttribute("data-id");
        if (!itemId) {
            console.error("Item ID not found on view button.");
            return;
        }

        const hiddenInput = document.getElementById('swap-view-item-id');
        if (hiddenInput) hiddenInput.value = itemId;

        viewItemOverlay.classList.add('active');
        // loadImages();
    });

    if (closeButton && viewItemOverlay) {
        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewItemOverlay.classList.remove('active');
        });
    }

    if (rateButton) {
        rateButton.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            openRateOverlay();
        })
    }

    if (cancelRateButton) {
        cancelRateButton.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            backToViewOverlay();
        });
    }
    
    if(messageButton){
        messageButton.addEventListener("click", function (){
            window.location.href = "../client/messages.html"
        });
    }
});

function loadImages() {
    //Hardcoded data (not from db)
    const hardcodedImages = [
        "../server/item/uploads/boardgame.jpg",
        "../server/item/uploads/camera.jpg",
        "../server/item/uploads/desklamp.jpg"
    ];

    const mainImage = document.querySelector(".swaps-body-sec .main-image img");
    const previewContainer = document.querySelector(".swaps-body-sec .images-preview");

    if (!mainImage || !previewContainer) return;

    mainImage.src = hardcodedImages[0];
    previewContainer.innerHTML = "";

    hardcodedImages.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Preview";

        img.addEventListener("click", () => {
            mainImage.src = src;
        });
        previewContainer.appendChild(img);
    });
}

function openRateOverlay() {
    const swapsViewOverlay = document.getElementById("swaps-view-overlay");
    const swapsRateOverlay = document.getElementById("swaps-rate-overlay");

    if (!swapsViewOverlay|| !swapsRateOverlay) return;

    initStarRating();

    swapsViewOverlay.classList.remove("active");
    swapsRateOverlay.classList.add("active");
}

function backToViewOverlay() {
    const swapsViewOverlay = document.getElementById("swaps-view-overlay");
    const swapsRateOverlay = document.getElementById("swaps-rate-overlay");

    if (!swapsViewOverlay || !swapsRateOverlay) return;

    swapsRateOverlay.classList.remove("active");
    swapsViewOverlay.classList.add("active");
}

function initStarRating() {
    const starContainer = document.getElementById("swaps-star-rating");
    const ratingInput = document.getElementById("rating-value");

    if (!starContainer || !ratingInput) return;

    starContainer.innerHTML = ""; 

    let currentRating = 0;

    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("iconify-icon");
        star.setAttribute("icon", "ic:round-star");

        star.addEventListener("mouseover", () => highlightStars(i));
        star.addEventListener("mouseleave", () => highlightStars(currentRating));
        star.addEventListener("click", () => {
            currentRating = i;
            ratingInput.value = i;
            highlightStars(currentRating);
        });

        starContainer.appendChild(star);
    }

    function highlightStars(rating) {
        starContainer.querySelectorAll("iconify-icon").forEach((star, index) => {
            star.classList.toggle("active", index < rating);
        });
    }
}


async function fetchSwappedItem(itemId) {
    if (!itemId) {
        console.error("Item ID is required to fetch bid details.")
        return;
    }
    try {
        const response = await fetch('../../../server/item/get_transactions.php');
        const data = await response.json();

        if (!data.success) return console.error("Failed to fetch transactions: ", data.message);

        const swap = data.swaps.find(s => s.swappedItem && s.swappedItem.swap_id == itemId);
        if (!swap) return console.error("Swapped item not found for ID:", itemId);

        const swappedItem = swap.swappedItem;
        populateSwapsOverlay(swappedItem);
    } catch (error) {
        console.error("Error fetching bid item: ", error);
    }
}

function populateBidsOverlay(swappedItem) {
    const overlayBody = document.querySelector("#swaps-view-overlay .swaps-body-sec");
    if (!overlayBody) return;

    const leftSide = overlayBody.querySelector(".left-side");
    const rightSide = overlayBody.querySelector(".right-side");

    if (!leftSide || !rightSide) return;

    leftSide.innerHTML = "";
    rightSide.innerHTML = "";

    const mainImageDiv = document.createElement("div");
    mainImageDiv.classList.add("main-image");

    const mainImg = document.createElement("img");
    mainImg.src = bidItem.main_image || "/server/item/uploads/default.jpg";
    mainImg.alt = bidItem.item_name || "Item Image";
    mainImageDiv.appendChild(mainImg);

    const previewDiv = document.createElement("div");
    previewDiv.classList.add("images-preview");

    (bidItem.images || [bidItem.main_image || '../server/item/uploads/default.jpg']).forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Preview";
        img.addEventListener("click", () => mainImg.src = src);
        previewDiv.appendChild(img);
    });

    leftSide.appendChild(mainImageDiv);
    leftSide.appendChild(previewDiv);

    rightSide.innerHTML = `
        <div class="name-category-con">
            <h6>${swappedItem.item_name || ''}</h6>
            <p>${swappedItem.category || ''}</p>
        </div>
        <div class="description-con">
            <p>${swappedItem.description || ''}</p>
        </div>
        <div class="date-con">
            <div class="start-date">
                <h6>Vendor</h6>
                <p>${swappedItem.vendor|| ''}</p>
            </div>
            <div class="date-won">
                <h6>Date Won</h6>
                <p>${swappedItem.completion_date || ''}</p>
            </div>
        </div>
    `;
    document.getElementById("bids-view-overlay").classList.add("active");
}