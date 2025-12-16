// js/browse-items.js

// 1. DOM Elements
const bidContainer = document.getElementById("viewAll-bid-cards-list");
const swapContainer = document.getElementById("viewAll-swap-cards-list");
const bidBtn = document.getElementById("filter-bid-btn");
const swapBtn = document.getElementById("filter-swap-btn");
const categoryTitle = document.getElementById("viewAll-category-title");
const categoryDesc = document.getElementById("viewAll-category-description");

// 2. Load Header/Footer
document.addEventListener("DOMContentLoaded", function() {
    fetch("header.html").then(r => r.text()).then(h => {
        document.getElementById("header").innerHTML = h;
        const script = document.createElement("script");
        script.src = "js/header.js"; 
        script.defer = true;
        document.body.appendChild(script);
        
        // Setup Profile Click
        const pIcon = document.getElementById("user-header-profile-icon");
        if(pIcon) pIcon.addEventListener("click", () => window.location.href = "profilepage.html");
        
        // Init Search
        setTimeout(initSearch, 500);
    });

    fetch("footer.html").then(r => r.text()).then(f => {
        document.getElementById("footer").innerHTML = f;
    });

    // 3. CHECK URL PARAMETERS (The Magic Part)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type'); // 'bid' or 'swap'
    const category = urlParams.get('category'); // e.g. 'Electronics'

    // Set Active Tab based on URL
    if (type === 'swap') {
        toggleView('swap');
    } else {
        toggleView('bid');
    }

    // Set Category based on URL
    if (category) {
        setCategory(category);
    } else {
        fetchItems("All Categories");
    }
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

// Event Listeners for Buttons
bidBtn.addEventListener("click", () => toggleView('bid'));
swapBtn.addEventListener("click", () => toggleView('swap'));

// 4. Fetch Items
function fetchItems(category = "All Categories") {
    let url = '../server/item/get_items.php';
    if (category !== "All Categories") {
        url += `?category=${category}`;
    }

    fetch(url)
    .then(response => response.json())
    .then(data => {
        const items = data.items || [];
        
        // Clear containers
        bidContainer.innerHTML = "";
        swapContainer.innerHTML = "";

        const bids = items.filter(i => i.item_type === 'bid');
        const swaps = items.filter(i => i.item_type === 'swap');

        // Populate Bids
        bids.forEach(bid => {
            bidContainer.appendChild(createBidCard(bid));
        });

        // Populate Swaps
        swaps.forEach(swap => {
            swapContainer.appendChild(createSwapCard(swap));
        });

        // Handle empty states
        if (bids.length === 0 && bidBtn.classList.contains('active')) {
            bidContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No bids found in this category.</p>";
        }
        if (swaps.length === 0 && swapBtn.classList.contains('active')) {
            swapContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No swaps found in this category.</p>";
        }
    })
    .catch(err => console.error(err));
}

// 5. Category Logic
const categoryBtn = document.getElementById("viewAll-category-btn");
const categoryDropDown = document.getElementById("viewAll-category-dropDown");

categoryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    categoryDropDown.classList.toggle("active");
});

document.querySelectorAll(".dropDown-item").forEach(item => {
    item.addEventListener("click", () => {
        setCategory(item.textContent.trim());
        categoryDropDown.classList.remove("active");
    });
});

document.addEventListener("click", (e) => {
    if (!categoryBtn.contains(e.target)) categoryDropDown.classList.remove("active");
});

function setCategory(name) {
    categoryTitle.textContent = name;
    categoryDesc.textContent = name;
    fetchItems(name);
}

// 6. Sort Logic (Same as before)
const sortBtn = document.querySelector(".sort-btn");
const sortDropdown = document.getElementById("sort-dropdown");

sortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sortDropdown.style.display = sortDropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", () => sortDropdown.style.display = "none");

sortDropdown.addEventListener("click", (e) => {
    const option = e.target.closest(".sort-option");
    if (!option) return;

    const sortType = option.dataset.sort;
    const isBid = bidContainer.style.display !== "none";
    const container = isBid ? bidContainer : swapContainer;
    const cards = Array.from(container.children);

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

// 7. Helper Functions (Duplicated from Homepage for independence)
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

// Search Functionality
function initSearch() {
    const input = document.querySelector(".header-search input");
    if(!input) return;
    input.addEventListener("input", () => {
        const q = input.value.toLowerCase();
        document.querySelectorAll(".bid-card, .swap-card").forEach(c => {
            const txt = c.textContent.toLowerCase();
            c.style.display = txt.includes(q) ? "" : "none";
        });
    });
}