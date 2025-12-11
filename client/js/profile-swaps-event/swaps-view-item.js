
document.addEventListener("DOMContentLoaded", function () {
    const viewItemOverlay = document.getElementById('swaps-view-overlay');
    const closeButton = document.getElementById('swaps-close-view-btn');
    const rateButton = document.querySelector(".swaps-head-sec .rate-btn");
    const cancelRateButton = document.querySelector("#swaps-rate-overlay .cancel-rate-btn");
    const messageButton = document.querySelector(".swaps-head-sec .message-btn");

    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.swaps-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        const swapId = viewItemBtn.getAttribute("data-id");
        if (!swapId) {
            console.error("Swap ID not found on view button.");
            return;
        }

        const hiddenInput = document.getElementById('swaps-view-swap-id');
        if (hiddenInput) hiddenInput.value = swapId;

        // loadImages();
        fetchSwappedItem(swapId);
        viewItemOverlay.classList.add('active');
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

    if (messageButton) {
        messageButton.addEventListener("click", function () {
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

    if (!swapsViewOverlay || !swapsRateOverlay) return;

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


async function fetchSwappedItem(swapId) {
    if (!swapId) {
        console.error("Item ID is required to fetch bid details.")
        return;
    }
    try {
        const response = await fetch('../../../server/item/get_transactions.php');
        const data = await response.json();

        if (!data.success) return console.error("Failed to fetch transactions: ", data.message);

        const swap = data.swaps.find(s => String(s.swap_id) === String(swapId));
        console.log("Clicked itemId:", swapId);
        if (!swap) return console.error("Swapped item not found for ID:", swapId);

        const source = swap.swappedItem || swap;

        const swappedItem = {
            item_id: source.item_id,
            item_name: source.item_name,
            category: source.category,
            description: source.description,
            date_swapped: source.completion_date,
            vendor: source.vendor,

            main_image: source.main_image,
            images: source.images || []
        };

        populateSwapsOverlay(swappedItem);
    } catch (error) {
        console.error("Error fetching swapped item: ", error);
    }
}

function populateSwapsOverlay(swappedItem) {
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
    mainImg.src = `../server/item/uploads/${swappedItem.main_image || 'default.jpg'}`;
    mainImg.alt = swappedItem.item_name || "Item Image";
    mainImageDiv.appendChild(mainImg);

    const previewDiv = document.createElement("div");
    previewDiv.classList.add("images-preview");

    const previewImages = swappedItem.images && swappedItem.images.length > 0
        ? swappedItem.images
        : [swappedItem.main_image || 'default.jpg'];

    previewImages.forEach(src => {
        const img = document.createElement("img");
        img.src = `../server/item/uploads/${src}`;
        img.alt = "Preview";
        img.addEventListener("click", () => {
            mainImg.src = `../server/item/uploads/${src}`;
        });
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
            <div class="swap-vendor">
                <h6>Vendor</h6>
                <p>${swappedItem.vendor || ''}</p>
            </div>
            <div class="date-swapped">
                <h6>Date Swapped</h6>
                <p>${swappedItem.date_swapped || ''}</p>
            </div>
        </div>
    `;

    document.getElementById("swaps-view-overlay").classList.add("active");
}
