document.addEventListener("DOMContentLoaded", function () {
    const viewItemOverlay = document.getElementById('bids-view-overlay');
    const closeButton = document.getElementById('bids-close-view-btn');
    const rateButton = document.querySelector(".rate-btn");
    const cancelRateButton = document.querySelector("#bids-rate-overlay .cancel-rate-btn");
    const messageButton = document.querySelector(".message-btn");

    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.bids-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        // Reset display to hide any previously loaded data
        const overlayBody = document.querySelector("#bids-view-overlay .bids-body-sec");
        if (overlayBody) {
            overlayBody.querySelector(".left-side").innerHTML = '<div style="text-align: center; padding: 20px;">Loading images...</div>';
            overlayBody.querySelector(".right-side").innerHTML = '<div style="text-align: center; padding: 20px;">Loading details...</div>';
        }

        const bidId = viewItemBtn.getAttribute("data-id");
        if (!bidId) {
            console.error("Bid ID not found on view button.");
            return;
        }

        const hiddenInput = document.getElementById('winBid-view-bid-id');
        if (hiddenInput) hiddenInput.value = bidId;

        fetchBidItem(bidId);
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

// Removed loadImages() as it used hardcoded data and is no longer needed.

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

async function fetchBidItem(bidId) {
    if (!bidId) {
        console.error("Bid ID is required to fetch bid details.");
        return;
    }
    try {
        const response = await fetch('/bidops/server/item/get_transactions.php', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) return console.error("Network response not ok:", response.statusText);

        const data = await response.json();
        if (!data.success) return console.error("Failed to fetch transactions: ", data.message);

        const bid = data.bids.find(b => String(b.bid_id) === String(bidId));
        if (!bid) {
            console.error("Winning Bid item not found for ID:", bidId);
            document.querySelector("#bids-view-overlay .bids-body-sec").innerHTML = `
                <div style="text-align: center; padding: 40px; color: red;">
                    Error: Item details not found for this bid.
                </div>
            `;
            return;
        }

        const source = bid.bidItem || bid;

        const bidItem = {
            item_id: source.item_id,
            item_name: source.item_name,
            category: source.category,
            description: source.description,
            winning_bid: parseFloat(source.winning_bid).toLocaleString('en-PH', { minimumFractionDigits: 2 }),
            date_won: new Date(source.date_won).toLocaleDateString(),
            vendor: source.vendor,
            main_image: source.main_image,
            images: source.images || []
        };

        populateBidsOverlay(bidItem);
    } catch (error) {
        console.error("Error fetching bid item: ", error);
        document.querySelector("#bids-view-overlay .bids-body-sec").innerHTML = `
            <div style="text-align: center; padding: 40px; color: red;">
                A network or parsing error occurred.
            </div>
        `;
    }
}

// ** IMPORTANT: The path is corrected here to use the image_paths from the database **
const IMAGE_BASE_URL = '../server/item/';

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

    // const mainImg = document.createElement("img");
    // const defaultImgPath = 'uploads/default.jpg';
    // const mainImgSrc = bidItem.main_image ? `${IMAGE_BASE_URL}${bidItem.main_image}` : `${IMAGE_BASE_URL}${defaultImgPath}`;

    // mainImg.src = mainImgSrc;
    // mainImg.alt = bidItem.item_name || "Item Image";
    // mainImageDiv.appendChild(mainImg);

    const mainImg = document.createElement("img");
    mainImg.src = `../server/item/uploads/${bidItem.main_image || 'default.jpg'}`;
    mainImg.alt = bidItem.item_name || "Item Image";
    mainImageDiv.appendChild(mainImg);

    const previewDiv = document.createElement("div");
    previewDiv.classList.add("images-preview");

    // Use the images array from the fetched data
    const previewImages = bidItem.images && bidItem.images.length > 0
        ? bidItem.images
        : [bidItem.main_image || "default.jpg"];

    // Check if the main image is in the list of images, if not, add it for consistency
    // const uniquePreviewImages = Array.from(new Set(previewImages));

    // uniquePreviewImages.forEach(src => {
    //     const img = document.createElement("img");
    //     // 2. Corrected path for thumbnails
    //     img.src = `${IMAGE_BASE_URL}${src}`; 
    //     img.alt = "Preview";

    //     // Add active class if it's the main image
    //     if (img.src === mainImgSrc) {
    //         img.classList.add('active');
    //     }

    //     img.addEventListener("click", () => {
    //         mainImg.src = img.src;
    //         // Highlight active thumbnail
    //         previewDiv.querySelectorAll('img').forEach(t => t.classList.remove('active'));
    //         img.classList.add('active');
    //     });
    //     previewDiv.appendChild(img);
    // });

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

    // Ensure winning_bid is formatted (P150.00)
    const formattedWinningBid = `P${bidItem.winning_bid}`;
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
            <p class="winning-price-amount">${formattedWinningBid}</p>
        </div>
        <div class="date-con">
            <div class="start-date">
                <h6>Vendor</h6>
                <p>${bidItem.vendor || ''}</p>
            </div>
            <div class="date-won">
                <h6>Date Won</h6>
                <p>${bidItem.date_won || ''}</p>
            </div>
        </div>
    `;
    document.getElementById("bids-view-overlay").classList.add("active");
}