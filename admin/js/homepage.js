console.log("Script loaded");

// DOM Elements
const home = document.getElementById("homepage-section");
const viewAll = document.getElementById("viewAll-section");
const backHomeBtn = document.getElementById("back-home");
const header = document.getElementById("header");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const viewAllBidContainer = document.getElementById("viewAll-bid-cards-list");
const homeSwapContainer = document.getElementById("home-swap-cards-list");
const viewAllSwapContainer = document.getElementById("viewAll-swap-cards-list");

const categoryTitle = document.getElementById("viewAll-category-title");
const categoryDescription = document.getElementById("viewAll-category-description");
const sortBtn = document.querySelector(".sort-btn");
const sortDropdown = document.getElementById("sort-dropdown");
const bidViewAllBtn = document.getElementById("bid-view-all");
const swapViewAllBtn = document.getElementById("swap-view-all");
const bidBtn = document.querySelector(".bid-btn");
const swapBtn = document.querySelector(".swap-btn");
const categoryBtn = document.getElementById("viewAll-category-btn");
const categoryDropDown = document.getElementById("viewAll-category-dropDown");

// Data cache
let cachedItems = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", function() {
    // Load header
    fetch("header.html")
        .then(response => response.text())
        .then(headerHTML => {
            header.innerHTML = headerHTML;
            const script = document.createElement("script");
            script.src = "js/nav-bar.js";
            script.defer = true;
            document.body.appendChild(script);
        })
        .catch(error => console.error("Error loading header:", error));

    // Initialize everything
    fetchItems();
    initCategoryCounts();
    setupEventListeners();
    initHomepageSearch();
});

function setupEventListeners() {
    // Sort functionality
    sortBtn.addEventListener("click", toggleSortDropdown);
    document.addEventListener("click", () => {
        sortDropdown.style.display = "none";
    });
    sortDropdown.addEventListener("click", handleSort);

    // View All buttons
    bidViewAllBtn.addEventListener("click", () => navigateToCategory("All Categories", 'bid'));
    swapViewAllBtn.addEventListener("click", () => navigateToCategory("All Categories", 'swap'));

    // Navigation buttons
    backHomeBtn.addEventListener("click", () => {
        viewAll.style.display = "none";
        home.style.display = "block";
        header.style.display = "block";
    });

    bidBtn.addEventListener("click", () => {
        setActiveView('bid');
        applyCurrentCategoryFilter();
    });

    swapBtn.addEventListener("click", () => {
        setActiveView('swap');
        applyCurrentCategoryFilter();
    });

    // Category dropdown
    categoryBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        categoryDropDown.classList.toggle("active");
        categoryBtn.classList.toggle("active");
    });

    document.addEventListener("click", (event) => {
        if (!categoryBtn.contains(event.target) && !categoryDropDown.contains(event.target)) {
            categoryDropDown.classList.remove("active");
            categoryBtn.classList.remove("active");
        }
    });

    // Category dropdown items
    const dropDownItems = categoryDropDown.querySelectorAll(".dropDown-item");
    dropDownItems.forEach(item => {
        item.addEventListener("click", () => {
            const selectedCategory = item.textContent.trim();
            categoryTitle.textContent = selectedCategory;
            categoryDescription.textContent = selectedCategory;
            categoryDropDown.classList.remove("active");
            categoryBtn.classList.remove("active");
            applyCurrentCategoryFilter();
        });
    });

    // Category cards
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach(card => {
        card.addEventListener("click", () => {
            const categoryName = card.getAttribute("browse-category");
            navigateToCategory(categoryName, 'bid');
        });
    });
}

// Fetch and cache items
function fetchItems() {
    if (cachedItems) {
        renderItems(cachedItems);
        return Promise.resolve();
    }
    
    return fetch('../server/item/get_items.php')
        .then(response => response.json())
        .then(data => {
            cachedItems = data;
            renderItems(data);
        })
        .catch(error => console.error('Error loading items:', error));
}

// Render items to containers
function renderItems(data) {
    const items = data.items || [];
    const bids = items.filter(item => item.item_type === 'bid');
    const swaps = items.filter(item => item.item_type === 'swap');
    
    // Clear all containers
    [homeBidContainer, viewAllBidContainer, homeSwapContainer, viewAllSwapContainer].forEach(container => {
        container.innerHTML = '';
    });
    
    // Homepage items
    bids.slice(0, 4).forEach(bid => {
        homeBidContainer.appendChild(createBidCard(processBidData(bid)));
    });
    
    swaps.slice(0, 4).forEach(swap => {
        homeSwapContainer.appendChild(createSwapCard(processSwapData(swap)));
    });
    
    // View All items
    bids.forEach(bid => {
        viewAllBidContainer.appendChild(createBidCard(processBidData(bid)));
    });
    
    swaps.forEach(swap => {
        viewAllSwapContainer.appendChild(createSwapCard(processSwapData(swap)));
    });
}

// Process bid data
function processBidData(bid) {
    const price = parseFloat(bid.starting_price || 0);
    return {
        id: bid.item_id,
        title: bid.title,
        category: bid.category_type,
        price: price,
        formattedPrice: `₱${price.toFixed(2)}`,
        dateListed: bid.created_date,
        timeLeft: formatEndDate(bid.end_date),
        bidsCount: bid.bid_count || 0,
        image: bid.images && bid.images.length > 0 ? `../server/item/${bid.images[0]}` : null,
        sellerName: bid.seller_name
    };
}

// Process swap data
function processSwapData(swap) {
    return {
        id: swap.item_id,
        title: swap.title,
        category: swap.category_type,
        dateListed: swap.created_date,
        image: swap.images && swap.images.length > 0 ? `../server/item/${swap.images[0]}` : null,
        sellerName: swap.seller_name
    };
}

// Initialize category counts
function initCategoryCounts() {
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach(card => updateCategoryCount(card));
}

// Update count for a single category card
function updateCategoryCount(card) {
    const categoryName = card.getAttribute("browse-category");
    const countElem = card.querySelector("p");
    
    fetch(`../server/item/get_items.php?category=${categoryName}`)
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            const activeItems = items.filter(item => item.status === 'active');
            countElem.textContent = `${activeItems.length} ${activeItems.length === 1 ? 'item' : 'items'}`;
        })
        .catch(error => {
            console.error('Error loading category count:', error);
            countElem.textContent = '0 items';
        });
}

// Sort functionality
function toggleSortDropdown(event) {
    event.stopPropagation();
    const isVisible = sortDropdown.style.display === "block";
    sortDropdown.style.display = isVisible ? "none" : "block";
    
    if (!isVisible) {
        const isBidVisible = window.getComputedStyle(viewAllBidContainer).display !== "none";
        const options = sortDropdown.querySelectorAll(".sort-option");
        
        options.forEach(opt => {
            const sortKey = opt.dataset.sort;
            const isBidOption = sortKey === "asc" || sortKey === "desc";
            const isSwapOption = sortKey === "az" || sortKey === "za";
            
            opt.style.display = (isBidVisible && isBidOption) || (!isBidVisible && isSwapOption) 
                ? "block" 
                : "none";
        });
    }
}

function handleSort(event) {
    const option = event.target.closest(".sort-option");
    if (!option) return;

    const sortType = option.dataset.sort;
    const isBidVisible = window.getComputedStyle(viewAllBidContainer).display !== "none";
    const container = isBidVisible ? viewAllBidContainer : viewAllSwapContainer;
    const cards = Array.from(container.querySelectorAll(isBidVisible ? ".bid-card" : ".swap-card"));

    if (isBidVisible && (sortType === "asc" || sortType === "desc")) {
        cards.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price) || 0;
            const priceB = parseFloat(b.dataset.price) || 0;
            return sortType === "asc" ? priceA - priceB : priceB - priceA;
        });
    } else if (!isBidVisible && (sortType === "az" || sortType === "za")) {
        cards.sort((a, b) => {
            const titleA = a.querySelector("h6").textContent.toLowerCase();
            const titleB = b.querySelector("h6").textContent.toLowerCase();
            return sortType === "az" ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
        });
    }

    container.innerHTML = "";
    cards.forEach(card => container.appendChild(card));
    sortDropdown.style.display = "none";
}

// Navigation functions
function navigateToCategory(categoryName, itemType = 'bid') {
    header.style.display = "none";
    home.style.display = "none";
    viewAll.style.display = "block";
    
    categoryTitle.textContent = categoryName;
    categoryDescription.textContent = categoryName;
    
    setActiveView(itemType);
    
    if (categoryName === "All Categories") {
        fetchItems();
    } else {
        fetchCategoryItems(categoryName, itemType);
    }
}

function setActiveView(itemType) {
    const isBid = itemType === 'bid';
    bidBtn.classList.toggle("active", isBid);
    swapBtn.classList.toggle("active", !isBid);
    viewAllBidContainer.style.display = isBid ? "grid" : "none";
    viewAllSwapContainer.style.display = isBid ? "none" : "grid";
}

function fetchCategoryItems(categoryName, itemType) {
    const url = categoryName === "All Categories" 
        ? '../server/item/get_items.php'
        : `../server/item/get_items.php?category=${categoryName}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const items = data.items || [];
            const filteredItems = items.filter(item => 
                categoryName === "All Categories" || item.category_type === categoryName
            );
            
            const bids = filteredItems.filter(item => item.item_type === 'bid');
            const swaps = filteredItems.filter(item => item.item_type === 'swap');
            
            viewAllBidContainer.innerHTML = '';
            viewAllSwapContainer.innerHTML = '';
            
            if (bids.length > 0 || swaps.length > 0) {
                bids.forEach(bid => viewAllBidContainer.appendChild(createBidCard(processBidData(bid))));
                swaps.forEach(swap => viewAllSwapContainer.appendChild(createSwapCard(processSwapData(swap))));
            } else {
                categoryDescription.textContent = "No items found for this category.";
            }
        });
}

function applyCurrentCategoryFilter() {
    const selectedCategory = categoryTitle.textContent.trim();
    const isBidActive = bidBtn.classList.contains("active");
    
    fetchCategoryItems(selectedCategory, isBidActive ? 'bid' : 'swap');
}

// Card creation functions
function createBidCard(bid) {
    const bidCard = document.createElement("div");
    bidCard.classList.add("bid-card");
    bidCard.id = `bid-card-${bid.id}`;
    
    const priceValue = typeof bid.price === 'string' ? 
        parseFloat(bid.price.replace('₱', '')) || 0 : 
        parseFloat(bid.price) || 0;
    
    bidCard.dataset.price = bid.price;
    bidCard.dataset.date = bid.dateListed;
    
    const imageContent = bid.image 
        ? `<img src="${bid.image}" alt="${bid.title}">`
        : `<div style="background: #073066; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
              <iconify-icon icon="mdi:package-variant" width="50" height="50"></iconify-icon>
           </div>`;
    
    bidCard.innerHTML = `
        <div class="top">
            ${imageContent}
            <button class="heart-button-bid" id="heart-button-${bid.id}" style="display: none;">
                <iconify-icon icon="tabler:heart" width="25" height="25" id="favorite-logo-${bid.id}"></iconify-icon>
            </button>
        </div>
        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category}</p>
            <p class="seller">Seller: ${bid.sellerName || 'Unknown'}</p>
            <p class="start-bid">Starting bid <span class="bid-price">₱${priceValue.toFixed(2)}</span></p>
            <div class="bid-time-and-count">
                <div class="time"><p>${bid.timeLeft}</p></div>
                <p class="count"><span>${bid.bidsCount}</span> bids</p>
            </div>
            <button class="view-bid-btn"><a href="view-biditem.html?item_id=${bid.id}">View Bid</a></button>
        </div>
    `;
    return bidCard;
}

function createSwapCard(swap) {
    const swapCard = document.createElement("div");
    swapCard.classList.add("swap-card");
    swapCard.id = `swap-card-${swap.id}`;
    swapCard.dataset.title = swap.title.toLowerCase();
    
    const imageContent = swap.image 
        ? `<img src="${swap.image}" alt="${swap.title}">`
        : `<div style="background: #073066; height: 100%; display: flex; align-items: center; justify-content: center; color: white;">
              <iconify-icon icon="mdi:swap-horizontal" width="50" height="50"></iconify-icon>
           </div>`;
    
    swapCard.innerHTML = `
        <div class="top">
            <div class="offer-wrap"><p>Swap Offer</p></div>
            <p class="posted-items">Recently posted</p>
        </div>
        <div class="img-container">
            ${imageContent}
        </div>
        <div class="bottom">
            <h6>${swap.title}</h6>
            <p>${swap.category}</p>
            <p>Seller: ${swap.sellerName || 'Unknown'}</p>
        </div>
        <div class="button-container">
            <button class="view-swap-btn"><a href="view-swapitem.html?item_id=${swap.id}">View Swap</a></button>
            <button class="heart-button-swap" id="heart-button-swap-${swap.id}" style="display: none;">
                <iconify-icon icon="tabler:heart" width="25" height="25" id="favorite-logo-swap-${swap.id}"></iconify-icon>
            </button>
        </div>
    `;
    return swapCard;
}

// Utility functions
function formatEndDate(endDate) {
    if (!endDate) return 'Ends at: Not specified';
    
    const end = new Date(endDate);
    const now = new Date();
    
    if (end <= now) return 'Ended';
    
    const options = { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    };
    
    const formattedDate = end.toLocaleDateString('en-US', options);
    return `Ends at ${formattedDate}`;
}

// Search functionality
function initHomepageSearch() {
    const input = document.querySelector(".header-search input");
    const button = document.querySelector(".header-search button");
    
    if (!input || !button) {
        setTimeout(initHomepageSearch, 100);
        return;
    }
    
    const getAllCards = () => Array.from(document.querySelectorAll(".bid-card, .swap-card"));
    
    function filterVisibleCards(query) {
        const q = (query || "").trim().toLowerCase();
        const cards = getAllCards();
        
        cards.forEach(card => {
            const title = card.querySelector("h6")?.textContent.toLowerCase() || "";
            const category = card.querySelector(".category")?.textContent.toLowerCase() || "";
            const matches = q === "" || title.includes(q) || category.includes(q);
            card.style.display = matches ? "" : "none";
        });
    }
    
    input.addEventListener("input", () => filterVisibleCards(input.value));
    button.addEventListener("click", (e) => {
        e.preventDefault();
        filterVisibleCards(input.value);
    });
    input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") filterVisibleCards(input.value);
    });
}