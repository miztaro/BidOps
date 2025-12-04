
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
        loadImages();
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
