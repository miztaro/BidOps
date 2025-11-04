console.log("Homepage script loaded ✅");

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

// ✅ Correct backend path when inside /client
function fetchItems(category = "") {
    let url = category 
        ? `../server_try/item/get_items.php?category=${category}`
        : `../server_try/item/get_items.php`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const items = data.items || [];
            const bids = items.filter(i => i.item_type === "bid");
            const swaps = items.filter(i => i.item_type === "swap");

            homeBidContainer.innerHTML = "";
            viewAllBidContainer.innerHTML = "";
            homeSwapContainer.innerHTML = "";
            viewAllSwapContainer.innerHTML = "";

            bids.slice(0,4).forEach(item => {
                homeBidContainer.appendChild(createBidCard(formatBidItem(item)));
            });

            swaps.slice(0,4).forEach(item => {
                homeSwapContainer.appendChild(createSwapCard(formatSwapItem(item)));
            });

            bids.forEach(item => {
                viewAllBidContainer.appendChild(createBidCard(formatBidItem(item)));
            });

            swaps.forEach(item => {
                viewAllSwapContainer.appendChild(createSwapCard(formatSwapItem(item)));
            });
        })
        .catch(err => console.error("❌ Error:", err));
}

function formatBidItem(bid) {
    return {
        id: bid.item_id,
        title: bid.title,
        category: bid.category_type,
        price: `₱${parseFloat(bid.starting_price || 0).toFixed(2)}`,
        timeLeft: formatEndDate(bid.end_date),
        bidsCount: bid.bid_count || 0,

        // ✅ Correct uploaded image path
        image: bid.image_path 
            ? `../server_try/item/uploads/${bid.image_path.split('/').pop()}`
            : null
    };
}

function formatSwapItem(swap) {
    return {
        id: swap.item_id,
        title: swap.title,
        category: swap.category_type,

        // ✅ Correct swap image path
        image: swap.image_path 
            ? `../server_try/item/uploads/${swap.image_path.split('/').pop()}`
            : null
    };
}

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

function createBidCard(bid) {
    const div = document.createElement("div");
    div.classList.add("bid-card");
    div.innerHTML = `
        <div class="top">
            ${bid.image ? `<img src="${bid.image}" alt="${bid.title}">`
                        : emptyItemIcon("mdi:package-variant")}
            <button class="heart-button-bid">
                <iconify-icon icon="tabler:heart" width="25"></iconify-icon>
            </button>
        </div>
        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category}</p>
            <p class="start-bid">Starting bid <span class="bid-price">${bid.price}</span></p>
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
            ${swap.image ? `<img src="${swap.image}" alt="${swap.title}">`
                         : emptyItemIcon("mdi:swap-horizontal")}
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

function emptyItemIcon(icon) {
    return `
        <div style="background:#073066;height:100%;display:flex;align-items:center;justify-content:center;color:white;">
            <iconify-icon icon="${icon}" width="50"></iconify-icon>
        </div>
    `;
}

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

categoryCards.forEach(card => {
    card.addEventListener("click", () => {
        const cat = card.getAttribute("browse-category");
        home.style.display = "none";
        viewAll.style.display = "block";
        categoryTitle.textContent = cat;
        categoryDescription.textContent = cat;
        fetchItems(cat);
        bidBtn.classList.add("active");
        swapBtn.classList.remove("active");
    });
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

categoryBtn.addEventListener("click", () => {
    categoryDropDown.classList.toggle("active");
});

dropDownItems.forEach(item => {
    item.addEventListener("click", () => {
        const cat = item.textContent.trim();
        categoryTitle.textContent = cat;
        categoryDescription.textContent = cat;
        fetchItems(cat === "All Programs" ? "" : cat);
        categoryDropDown.classList.remove("active");
    });
});

document.addEventListener("click", e => {
    if (!categoryBtn.contains(e.target) && !categoryDropDown.contains(e.target)) {
        categoryDropDown.classList.remove("active");
    }
});

document.addEventListener("DOMContentLoaded", () => fetchItems());
