
import {openBidModal} from './list-view-active-bid.js';
import {openSwappingModal} from './list-view-active-swap.js';
let currentItemId = null;
document.addEventListener('DOMContentLoaded', function () {
    const viewItemOverlay = document.getElementById('list-view-overlay');
    const closeButton = document.getElementById('close-view-btn')

    document.addEventListener("click", (event) => {
        const viewItemBtn = event.target.closest('.lists-view-btn');
        if (!viewItemBtn || !viewItemOverlay) return;

        const itemId = viewItemBtn.getAttribute("data-id");
        const type = (viewItemBtn.getAttribute("data-type") || "").toLowerCase();
        const status = (viewItemBtn.getAttribute("data-status") || "").toLowerCase();

        if (!itemId) {
            console.error("Item ID not found on view button.");
            return;
        }

        if (type === "bid" && status === "active") {
            currentItemId = itemId;
            console.log("Opening Bid Modal", itemId);
            openBidModal(itemId);
            return;
        }

        if (type === "swap" && status === "active") {
            currentItemId = itemId;
            console.log("Opening Swap Modal", itemId);
            openSwappingModal(itemId);
            return;
        }

        const hiddenInput = document.getElementById('view-item-id');
        if (hiddenInput) hiddenInput.value = itemId;
        viewItemOverlay.classList.add('active');

        fetchItem(itemId);
    });

    if (closeButton && viewItemOverlay) {
        closeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            viewItemOverlay.classList.remove('active');
        });
    }
});

function getStatusClass(status) {
    status = status.toLowerCase();
    if (status.includes("active")) return "active-items";
    if (status.includes("pending")) return "pending-items";
    if (status.includes("rejected")) return "rejected-items";
    if (status.includes("sold")) return "sold-items";
    return "";
}

function fetchItem(itemId) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `../server/item/get_item_single.php?id=${itemId}`, true);

        xhr.onload = function () {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                displayItem(data);
                resolve(data);
            } else {
                console.error("AJAX error: status", xhr.status);
                reject(xhr.status);
            }
        };

        xhr.onerror = function () {
            console.error("AJAX request failed");
            reject("AJAX request failed");
        };

        xhr.send();
    });
}

function displayItem(data) {
    const { item, bid, images } = data;
    if (!item) return;

    const type = (item.item_type || "").trim().toLowerCase();
    const isBid = type === "bid";
    const isSwap = type === "swap";

    document.querySelector('.view-mode-field h3').textContent = isBid ? "Bid" : "Swap";
    document.querySelector('.view-mode-field p span').textContent = item.item_id;

    const statusText = bid?.status || item.status || "No Status";
    const statusEl = document.querySelector('.view-status-field');
    statusEl.className = "view-status-field";
    statusEl.classList.add(getStatusClass(statusText));
    statusEl.querySelector('p').textContent = statusText;

    if (isBid && statusText === "active") {
        closeNormalOverlay();
        currentItemId = item.item_id;
        openBidModal(item.item_id);
        return;
    }

    if (isSwap && statusText === "active") {
        closeNormalOverlay();
        currentItemId = item.item_id;
        openSwappingModal(item.item_id);
        return;
    }

    document.querySelector('.name-cat-field h3').textContent = item.title;
    document.querySelector('.name-cat-field p').textContent = item.category_type;
    document.querySelector('.description-field p').textContent = item.description || "";

    const priceField = document.querySelector('.body-sec .price-field');
    const dateField = document.querySelector('.date-field');
    const swapField = document.querySelector('.swap-field');
    const leftSide = document.querySelector('.left-side');
    leftSide.style.display = "flex";

    loadImages(images);

    if (isBid && bid) {
        priceField.style.display = "flex";
        dateField.style.display = "flex";
        swapField.style.display = "none";

        document.querySelector('.start-price p').textContent = `P ${parseFloat(bid?.starting_price || 0).toFixed(2)}`;
        document.querySelector('.win-price p').textContent = bid?.winning_price ? `P ${parseFloat(bid.winning_price).toFixed(2)}` : 'N/A';
        document.querySelector('.start-date p').textContent = bid?.start_date || item.start_date || '';
        document.querySelector('.end-date p').textContent = bid?.end_date || item.end_date || '';
    } else if (isSwap) {
        priceField.style.display = "none";
        dateField.style.display = "none";
        swapField.style.display = "flex";

        document.querySelector('.swapped-item p').textContent = item.swapped_item_name || "N/A";
        document.querySelector('.swap-partner p').textContent = item.swap_partner_id || "N/A";
    } else {
        priceField.style.display = "none";
        dateField.style.display = "none";
        swapField.style.display = "none";
    }
}

function closeNormalOverlay() {
    const overlay = document.getElementById('list-view-overlay');
    if (overlay) overlay.classList.remove('active');
}

function loadImages(imagePaths) {
    const mainImage = document.querySelector('.left-side .main-image img');
    const previewContainer = document.querySelector('.left-side .images-preview');

    if (!mainImage || !previewContainer) return;

    previewContainer.innerHTML = '';

    if (!imagePaths || imagePaths.length === 0) {
        mainImage.src = '';
        return;
    }

    // Set main image
    mainImage.src = `../server/item/${imagePaths[0]}`;

    imagePaths.forEach((imgPath, index) => {
        const img = document.createElement('img');
        img.src = `../server/item/${imgPath}`;
        if (index === 0) img.classList.add('active');

        img.addEventListener('click', () => {
            mainImage.src = img.src;
            previewContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
            img.classList.add('active');
        });

        previewContainer.appendChild(img);
    });
}