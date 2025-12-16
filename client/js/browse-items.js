// js/browse-items.js

// 1. DOM Elements
const bidContainer = document.getElementById("viewAll-bid-cards-list");
const swapContainer = document.getElementById("viewAll-swap-cards-list");
const bidBtn = document.getElementById("filter-bid-btn");
const swapBtn = document.getElementById("filter-swap-btn");
const categoryTitle = document.getElementById("viewAll-category-title");
const categoryDesc = document.getElementById("viewAll-category-description");
const categoryBtnText = document.getElementById("viewAll-category-btn"); // To update the button text

// GLOBAL STATE
let currentCategory = "All Categories";
let currentSearchTerm = "";

// 2. Load Header/Footer & Init Page
document.addEventListener("DOMContentLoaded", function() {
    
    // Check URL Parameters immediately
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type'); 
    const categoryParam = urlParams.get('category');
    const searchParam = urlParams.get('search'); 

    // Set Global State from URL
    if (categoryParam) currentCategory = categoryParam;
    if (searchParam) currentSearchTerm = searchParam;

    // Fetch Header
    fetch("header.html").then(r => r.text()).then(h => {
        document.getElementById("header").innerHTML = h;
        
        // Load header logic script
        const script = document.createElement("script");
        script.src = "js/header.js"; 
        script.defer = true;
        document.body.appendChild(script);
        
        // Setup Profile Click
        const pIcon = document.getElementById("user-header-profile-icon");
        if(pIcon) pIcon.addEventListener("click", () => window.location.href = "profilepage.html");
        
        // Pre-fill header search input if exists
        if (currentSearchTerm) {
            const headerInput = document.querySelector(".header-search input");
            if (headerInput) headerInput.value = currentSearchTerm;
        }

        // Init Live Search Listener (for typing in the header)
        setTimeout(initSearchListener, 500);
    });

    fetch("footer.html").then(r => r.text()).then(f => {
        document.getElementById("footer").innerHTML = f;
    });

    // Set Active Tab (Bid vs Swap)
    if (type === 'swap') {
        toggleView('swap');
    } else {
        toggleView('bid');
    }

    // Initial Fetch with the loaded state
    fetchItems(currentCategory, currentSearchTerm);
});

// 3. Toggle View Function
function toggleView(viewType) {
    if (viewType === 'bid') {
        bidBtn.classList.add("active");
        swapBtn.classList.remove("active");
        bidContainer.style.display = "grid";
        swapContainer.style.display = "none";
    } else {
        swapBtn.classList.add("active");
        bidBtn.classList.remove("active");
        bidContainer.style.display = "none";
        swapContainer.style.display = "grid";
    }
}

bidBtn.addEventListener("click", () => toggleView('bid'));
swapBtn.addEventListener("click", () => toggleView('swap'));

// 4. Fetch Items (The Core Logic)
function fetchItems(category, search) {
    // Update Global State
    currentCategory = category;
    currentSearchTerm = search;

    // 1. URL Construction (Server filters by Category)
    let url = '../server/item/get_items.php';
    if (category !== "All Categories") {
        url += `?category=${encodeURIComponent(category)}`;
    }

    // 2. Fetch Data
    fetch(url)
    .then(response => response.json())
    .then(data => {
        let items = data.items || [];

        // 3. Client-side Search Filtering
        // We filter the results returned by the category to see if they match the search term
        if (currentSearchTerm && currentSearchTerm.trim() !== "") {
            const lowerQuery = currentSearchTerm.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(lowerQuery) || 
                (item.description && item.description.toLowerCase().includes(lowerQuery))
            );
        }

        // 4. Update UI Text
        updatePageText();

        // 5. Render Items
        renderItems(items);
    })
    .catch(err => console.error(err));
}

function updatePageText() {
    // Update the Category Dropdown Button text to show what is selected
    // Note: We access childNodes[0] usually to avoid overwriting the icon, 
    // but here we can just rebuild the inner HTML to be safe.
    categoryBtnText.innerHTML = `${currentCategory} <iconify-icon icon="eva:arrow-down-outline" width="24" height="24"></iconify-icon>`;

    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
        // CASE: Search is Active
        // The user specifically requested this format:
        categoryTitle.textContent = `Search Results: "${currentSearchTerm}"`;
        
        // We can keep "All Categories" in the description or change it. 
        // Based on request: "Discover... items matching 'ps5'"
        const descText = document.getElementById("viewAll-category-description");
        // We replace the span content
        descText.textContent = ` items matching "${currentSearchTerm}"`; 
        
        // If a specific category is selected, we might want to mention it, 
        // but the prompt asked for the specific "matching" text. 
    } else {
        // CASE: No Search, just Category navigation
        categoryTitle.textContent = currentCategory;
        const descText = document.getElementById("viewAll-category-description");
        descText.textContent = ` ${currentCategory}`;
    }
}

function renderItems(items) {
    // Clear containers
    bidContainer.innerHTML = "";
    swapContainer.innerHTML = "";

    const bids = items.filter(i => i.item_type === 'bid');
    const swaps = items.filter(i => i.item_type === 'swap');

    bids.forEach(bid => bidContainer.appendChild(createBidCard(bid)));
    swaps.forEach(swap => swapContainer.appendChild(createSwapCard(swap)));

    // Empty States
    if (bids.length === 0) {
        bidContainer.innerHTML = `<p style='grid-column: 1/-1; text-align:center;'>No bids found.</p>`;
    }
    if (swaps.length === 0) {
        swapContainer.innerHTML = `<p style='grid-column: 1/-1; text-align:center;'>No swaps found.</p>`;
    }
}

// 5. Category Logic
const categoryDropDown = document.getElementById("viewAll-category-dropDown");

if (categoryBtnText) {
    categoryBtnText.addEventListener("click", (e) => {
        e.stopPropagation();
        categoryDropDown.classList.toggle("active");
    });
}

document.querySelectorAll(".dropDown-item").forEach(item => {
    item.addEventListener("click", () => {
        const selectedCategory = item.textContent.trim();
        // IMPORTANT: We pass 'currentSearchTerm' so we don't lose the search
        fetchItems(selectedCategory, currentSearchTerm);
        categoryDropDown.classList.remove("active");
    });
});

document.addEventListener("click", (e) => {
    if (categoryBtnText && !categoryBtnText.contains(e.target)) categoryDropDown.classList.remove("active");
});


// 6. Search Listener (When typing in the header on this page)
function initSearchListener() {
    const input = document.querySelector(".header-search input");
    if(!input) return;

    // When user types, update state and re-fetch (or re-filter)
    input.addEventListener("input", () => {
        const val = input.value;
        // Update global state
        currentSearchTerm = val;
        // Re-run fetch logic (which handles filtering)
        // We do a full fetchItems to ensure category logic is applied correctly
        fetchItems(currentCategory, currentSearchTerm);
    });

    // Optional: Handle "Enter" to update URL (so refresh works)
    input.addEventListener("keypress", (e) => {
        if(e.key === "Enter") {
             e.preventDefault();
             // Update URL params without reloading page completely if desired, or just reload
             const newUrl = new URL(window.location);
             newUrl.searchParams.set('search', currentSearchTerm);
             newUrl.searchParams.set('category', currentCategory);
             window.history.pushState({}, '', newUrl);
             input.blur();
        }
    });
}

// 7. Sort Logic (Standard)
const sortBtn = document.querySelector(".sort-btn");
const sortDropdown = document.getElementById("sort-dropdown");

if (sortBtn) {
    sortBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sortDropdown.style.display = sortDropdown.style.display === "block" ? "none" : "block";
    });
}
document.addEventListener("click", () => {
    if(sortDropdown) sortDropdown.style.display = "none";
});

if (sortDropdown) {
    sortDropdown.addEventListener("click", (e) => {
        const option = e.target.closest(".sort-option");
        if (!option) return;

        const sortType = option.dataset.sort;
        const isBid = bidContainer.style.display !== "none";
        const container = isBid ? bidContainer : swapContainer;
        
        // Get only the item cards
        const cards = Array.from(container.children).filter(c => c.classList.contains("bid-card") || c.classList.contains("swap-card"));

        if (cards.length === 0) return;

        if (sortType === "asc" || sortType === "desc") {
            cards.sort((a, b) => {
                const pA = parseFloat(a.dataset.price) || 0;
                const pB = parseFloat(b.dataset.price) || 0;
                return sortType === "asc" ? pA - pB : pB - pA;
            });
        } else {
            cards.sort((a, b) => {
                const tA = a.querySelector("h6").textContent.toLowerCase();
                const tB = b.querySelector("h6").textContent.toLowerCase();
                return sortType === "az" ? tA.localeCompare(tB) : tB.localeCompare(tA);
            });
        }

        container.innerHTML = "";
        cards.forEach(card => container.appendChild(card));
    });
}

// 8. Helper Functions
function createBidCard(bid) {
    const card = document.createElement("div");
    card.classList.add("bid-card");
    const price = parseFloat(bid.starting_price || 0);
    card.dataset.price = price;
    
    const img = bid.images && bid.images.length > 0 ? `../server/item/${bid.images[0]}` : null;
    const imgHTML = img ? `<img src="${img}" alt="${bid.title}">` : `<div style="background:#073066;height:100%;display:flex;align-items:center;justify-content:center;color:white;"><iconify-icon icon="mdi:package-variant" width="50"></iconify-icon></div>`;

    card.innerHTML = `
        <div class="top">${imgHTML}<button class="heart-button-bid"><iconify-icon icon="tabler:heart" width="25"></iconify-icon></button></div>
        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category_type}</p>
            <p class="start-bid">Starting bid <span class="bid-price">₱${price.toFixed(2)}</span></p>
            <div class="bid-time-and-count"><div class="time"><p>${formatEndDate(bid.end_date)}</p></div><p class="count"><span>${bid.bid_count||0}</span> bids</p></div>
            <button class="join-bid-btn"><a href="join-bid.html?item_id=${bid.item_id}">Join Bid</a></button>
        </div>`;
    return card;
}

function createSwapCard(swap) {
    const card = document.createElement("div");
    card.classList.add("swap-card");
    const img = swap.images && swap.images.length > 0 ? `../server/item/${swap.images[0]}` : null;
    const imgHTML = img ? `<img src="${img}" alt="${swap.title}">` : `<div style="background:#073066;height:100%;display:flex;align-items:center;justify-content:center;color:white;"><iconify-icon icon="mdi:swap-horizontal" width="50"></iconify-icon></div>`;

    card.innerHTML = `
        <div class="top"><div class="offer-wrap"><p>Swap Offer</p></div><p class="posted-items">Recently posted</p></div>
        <div class="img-container">${imgHTML}</div>
        <div class="bottom"><h6>${swap.title}</h6><p>${swap.category_type}</p></div>
        <div class="button-container"><button class="make-offer-btn"><a href="view-swap.html?item_id=${swap.item_id}">Make Offer</a></button>`;
    return card;
}

function formatEndDate(date) {
    if (!date) return 'No date';
    const end = new Date(date);
    return end <= new Date() ? 'Ended' : `Ends ${end.toLocaleDateString()}`;
}