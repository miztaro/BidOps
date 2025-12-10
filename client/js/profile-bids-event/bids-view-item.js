
document.addEventListener("DOMContentLoaded", function () {
    const viewItemOverlay = document.getElementById('bids-view-overlay');
    const closeButton = document.getElementById('bids-close-view-btn');
    const rateButton = document.querySelector(".rate-btn");
    const cancelRateButton = document.querySelector("#bids-rate-overlay .cancel-rate-btn");
    const messageButton = document.querySelector(".message-btn");

    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.bids-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        const itemId = viewItemBtn.getAttribute("data-id");
        if (!itemId) {
            console.error("Item ID not found on view button.");
            return;
        }

        const hiddenInput = document.getElementById('winBid-view-item-id');
        if (hiddenInput) hiddenInput.value = itemId;

        fetchBidItem(itemId);
        // loadImages();
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

    const mainImage = document.querySelector(".bids-body-sec .main-image img");
    const previewContainer = document.querySelector(".bids-body-sec .images-preview");

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
    const bidsViewOverlay = document.getElementById("bids-view-overlay");
    const bidsRateOverlay = document.getElementById("bids-rate-overlay");

    if (!bidsViewOverlay || !bidsRateOverlay) return;

    initStarRating();

    bidsViewOverlay.classList.remove("active");
    bidsRateOverlay.classList.add("active");
}

function backToViewOverlay() {
    const bidsViewOverlay = document.getElementById("bids-view-overlay");
    const bidsRateOverlay = document.getElementById("bids-rate-overlay");

    if (!bidsViewOverlay || !bidsRateOverlay) return;

    bidsRateOverlay.classList.remove("active");
    bidsViewOverlay.classList.add("active");
}

function initStarRating() {
    const starContainer = document.getElementById("bids-star-rating");
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

async function fetchBidItem(itemId) {
    if (!itemId) {
        console.error("Item ID is required to fetch bid details.")
        return;
    }
    try {
        const response = await fetch('../../../server/item/get_transactions.php');
        const data = await response.json();

        if (!data.success) return console.error("Failed to fetch transactions: ", data.message);

        const bid = data.bids.find(b => b.bidItem && b.bidItem.bid_id == itemId);
        if (!bid) return console.error("Bid item not found for ID:", itemId);

        const bidItem = bid.bidItem;
        populateBidsOverlay(bidItem);
    } catch (error) {
        console.error("Error fetching bid item: ", error);
    }
}

function populateBidsOverlay(bidItem) {
    const overlayBody = document.querySelector("#bids-view-overlay .bids-body-sec");
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
            <h6>${bidItem.item_name || ''}</h6>
            <p>${bidItem.category || ''}</p>
        </div>
        <div class="description-con">
            <p>${bidItem.description || ''}</p>
        </div>
        <div class="price-con">
            <h6>Winning Price</h6>
            <p>P${bidItem.winning_bid || 0}</p>
        </div>
        <div class="date-con">
            <div class="start-date">
                <h6>Vendor</h6>
                <p>${bidItem.vendor|| ''}</p>
            </div>
            <div class="date-won">
                <h6>Date Won</h6>
                <p>${bidItem.date_won || ''}</p>
            </div>
        </div>
    `;
    document.getElementById("bids-view-overlay").classList.add("active");
}
