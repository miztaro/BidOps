console.log("Homepage script loaded ");

const home = document.getElementById("homepage-section");
const viewAll = document.getElementById("viewAll-section");

const bidViewAllBtn = document.getElementById("bid-view-all");
const swapViewAllBtn = document.getElementById("swap-view-all");

const categoryCards = document.querySelectorAll(".category-card");
const backHomeBtn = document.getElementById("back-home");

const bidBtn = document.querySelector(".bid-btn");
const swapBtn = document.querySelector(".swap-btn");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const viewAllBidContainer = document.getElementById("viewAll-bid-cards-list");
const homeSwapContainer = document.getElementById("home-swap-cards-list");
const viewAllSwapContainer = document.getElementById("viewAll-swap-cards-list");

const categoryBtn = document.getElementById("viewAll-category-btn");
const categoryDropDown = document.getElementById("viewAll-category-dropDown");
const dropDownItems = categoryDropDown.querySelectorAll(".dropDown-item");
const categoryTitle = document.getElementById("viewAll-category-title");
const categoryDescription = document.getElementById("viewAll-category-description");

// -------------------------
// Fetch Items from Server
// -------------------------
function fetchItems(category = "") {
    const url = category
        ? `../server_try/item/get_items.php?category=${encodeURIComponent(category)}`
        : `../server_try/item/get_items.php`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const items = data.items || [];
            const bids = items.filter(i => i.item_type === "bid");
            const swaps = items.filter(i => i.item_type === "swap");

            // Clear containers
            homeBidContainer.innerHTML = "";
            viewAllBidContainer.innerHTML = "";
            homeSwapContainer.innerHTML = "";
            viewAllSwapContainer.innerHTML = "";

            // Show limited items on homepage
            bids.slice(0, 4).forEach(item => homeBidContainer.appendChild(createBidCard(formatBidItem(item))));
            swaps.slice(0, 4).forEach(item => homeSwapContainer.appendChild(createSwapCard(formatSwapItem(item))));

            // Populate "View All" section
            bids.forEach(item => viewAllBidContainer.appendChild(createBidCard(formatBidItem(item))));
            swaps.forEach(item => viewAllSwapContainer.appendChild(createSwapCard(formatSwapItem(item))));
        })
        .catch(err => console.error("❌ Error fetching items:", err));
}

// -------------------------
// Format Items
// -------------------------
function formatBidItem(bid) {
    return {
        id: bid.item_id,
        title: bid.title,
        category: bid.category_type,
        starting_bid: parseFloat(bid.starting_price || 0).toFixed(2),
        timeLeft: formatEndDate(bid.end_date),
        bidsCount: bid.bid_count || 0,
        image: bid.image_path ? `../server_try/item/uploads/${bid.image_path.split('/').pop()}` : '../assets/images/placeholder.png'
    };
}

function formatSwapItem(swap) {
    return {
        id: swap.item_id,
        title: swap.title,
        category: swap.category_type,
        image: swap.image_path ? `../server_try/item/uploads/${swap.image_path.split('/').pop()}` : '../assets/images/placeholder.png'
    };
}

// -------------------------
// Card Templates
// -------------------------
function createBidCard(bid) {
    const div = document.createElement("div");
    div.classList.add("bid-card");
    div.innerHTML = `
        <div class="top">
            <img src="${bid.image}" alt="${bid.title}">
            <button class="heart-button-bid">
                <iconify-icon icon="tabler:heart" width="25"></iconify-icon>
            </button>
        </div>
        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category}</p>
            <p class="start-bid">Starting bid <span class="bid-price">₱${bid.starting_bid}</span></p>
            <div class="bid-time-and-count">
                <div class="time"><p>${bid.timeLeft}</p></div>
                <p class="count"><span>${bid.bidsCount}</span> bids</p>
            </div>
            <button class="join-bid-btn">
                <a href="join-bid.html?item_id=${bid.id}">Join Bid</a>
            </button>
        </div>
    `;
    return div;
}

function createSwapCard(swap) {
    const div = document.createElement("div");
    div.classList.add("swap-card");
    div.innerHTML = `
        <div class="top"><p>Swap Offer</p></div>
        <div class="img-container">
            <img src="${swap.image}" alt="${swap.title}">
        </div>
        <div class="bottom">
            <h6>${swap.title}</h6>
            <p>${swap.category}</p>
        </div>
        <div class="button-container">
            <button class="make-offer-btn"><a href="view-swap.html?item_id=${swap.id}">Make Offer</a></button>
        </div>
    `;
    return div;
}

// -------------------------
// Utilities
// -------------------------
function formatEndDate(endDate) {
    if (!endDate) return "Ends: N/A";
    const end = new Date(endDate);
    return end <= new Date()
        ? "Ended"
        : `Ends ${end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        })}`;
}

// -------------------------
// Navigation & Filters
// -------------------------
bidViewAllBtn.addEventListener("click", () => {
    home.style.display = "none";
    viewAll.style.display = "block";
    viewAllBidContainer.style.display = "grid";
    viewAllSwapContainer.style.display = "none";
    bidBtn.classList.add("active");
    swapBtn.classList.remove("active");
    fetchItems();
});

swapViewAllBtn.addEventListener("click", () => {
    home.style.display = "none";
    viewAll.style.display = "block";
    viewAllBidContainer.style.display = "none";
    viewAllSwapContainer.style.display = "grid";
    bidBtn.classList.remove("active");
    swapBtn.classList.add("active");
    fetchItems();
});

backHomeBtn.addEventListener("click", () => {
    viewAll.style.display = "none";
    home.style.display = "block";
});

bidBtn.addEventListener("click", () => {
    bidBtn.classList.add("active");
    swapBtn.classList.remove("active");
    viewAllBidContainer.style.display = "grid";
    viewAllSwapContainer.style.display = "none";
});

swapBtn.addEventListener("click", () => {
    swapBtn.classList.add("active");
    bidBtn.classList.remove("active");
    viewAllSwapContainer.style.display = "grid";
    viewAllBidContainer.style.display = "none";
});

// -------------------------
// Search Integration
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
    fetchItems();

    const searchInput = document.querySelector('input[placeholder*="Search"]');
    const searchButton = document.querySelector('.search-button') || searchInput?.nextElementSibling;

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch(searchInput.value);
    });

    searchButton?.addEventListener('click', () => performSearch(searchInput.value));
});

async function performSearch(query) {
    if (!query.trim()) return;

    console.log("Searching for:", query);

    try {
        const response = await fetch(`../server_try/search.php?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        displaySearchResults(data, query);
    } catch (error) {
        console.error("Search error:", error);
    }
}

function displaySearchResults(results, query) {
    home.style.display = "none";
    viewAll.style.display = "block";

    viewAllBidContainer.innerHTML = "";
    viewAllSwapContainer.innerHTML = "";

    document.getElementById('viewAll-category-title').textContent = `Search Results for "${query}"`;
    categoryDescription.textContent = "";

    let hasResults = false;

    if (results.bids?.length > 0) {
        hasResults = true;
        results.bids.forEach(item => {
            viewAllBidContainer.appendChild(createBidCard({
                id: item.id,
                title: item.title,
                category: item.category,
                starting_bid: item.starting_bid,
                timeLeft: formatEndDate(item.end_date),
                bidsCount: item.bid_count,
                image: item.image
            }));
        });
    }

    if (results.swaps?.length > 0) {
        hasResults = true;
        results.swaps.forEach(item => {
            viewAllSwapContainer.appendChild(createSwapCard({
                id: item.id,
                title: item.title,
                category: item.category,
                image: item.image
            }));
        });
    }

    if (!hasResults) {
        viewAllBidContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:30px;font-size:18px;">No results found for "<b>${query}</b>"</p>`;
        viewAllSwapContainer.innerHTML = "";
    }
}
