
function initializeSearch() {
    const searchInput =
        document.querySelector('input[placeholder*="Search"]') ||
        document.getElementById('search-input');

    const searchForm = searchInput?.closest('form');

    if (!searchInput) {
        setTimeout(initializeSearch, 100);
        return;
    }

    console.log("Search initialized");

    searchInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch(this.value);
        }
    });

    const searchIcon =
        searchInput.parentElement.querySelector(".search-icon") ||
        document.querySelector(".search-icon") ||
        searchInput.parentElement.querySelector("iconify-icon");

    if (searchIcon) {
        searchIcon.style.cursor = "pointer";
        searchIcon.addEventListener("click", () => {
            performSearch(searchInput.value);
        });
    }

    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            performSearch(searchInput.value);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(initializeSearch, 500);
});


async function performSearch(query) {
    const searchQuery = query.trim();
    if (!searchQuery) {
        alert("Please enter a search term");
        return;
    }

    showLoadingState();
    console.log("Searching for:", searchQuery);

    try {
        const res = await fetch(
            `../server_try/item/search.php?q=${encodeURIComponent(searchQuery)}`
        );

        const data = await res.json();

        if (data.success) {
            displaySearchResults(data);
        } else {
            alert(data.error || "Search failed");
        }
    } catch (err) {
        console.error("Search error:", err);
        alert("Error searching. Try again.");
    } finally {
        hideLoadingState();
    }
}

function displaySearchResults(results) {
    document.getElementById("homepage-section").style.display = "none";
    document.getElementById("viewAll-section").style.display = "block";
    document.getElementById("header").style.display = "block";

    const bidList = document.getElementById("viewAll-bid-cards-list");
    const swapList = document.getElementById("viewAll-swap-cards-list");

    bidList.innerHTML = "";
    swapList.innerHTML = "";
    bidList.style.display = "grid";
    swapList.style.display = "none";

    document.querySelector(".top-nav .bid-btn").classList.add("active");
    document.querySelector(".top-nav .swap-btn").classList.remove("active");

    document.getElementById("viewAll-category-title").textContent =
        `Search Results for "${results.query}"`;

    const totalItems = (results.total_bid || 0) + (results.total_swap || 0);
    document.getElementById("viewAll-category-description").textContent =
        `${totalItems} items found`;

    if (results.bid_items && results.bid_items.length > 0) {
        results.bid_items.forEach(item => {
            const formatted = {
                id: item.item_id,
                title: item.title,
                category: item.category_type,
                price: item.starting_price ? `₱${item.starting_price}` : "N/A",
                timeLeft: formatEndDate(item.end_date),
                bidsCount: item.bid_count || 0,
                image: item.image_path
                    ? `../server_try/item/uploads/${item.image_path.split("/").pop()}`
                    : null
            };

            bidList.appendChild(
                typeof window.createBidCard === "function"
                    ? window.createBidCard(formatted)
                    : createSearchBidCard(formatted)
            );
        });
    }

  
    if (results.swap_items && results.swap_items.length > 0) {
        swapList.style.display = "grid"; 
        results.swap_items.forEach(item => {
            const formatted = {
                id: item.item_id,
                title: item.title,
                category: item.category_type,
                image: item.image_path
                    ? `../server_try/item/uploads/${item.image_path.split("/").pop()}`
                    : null
            };

            swapList.appendChild(
                typeof window.createSwapCard === "function"
                    ? window.createSwapCard(formatted)
                    : createSearchSwapCard(formatted)
            );
        });
    }

    if (totalItems === 0) {
        bidList.innerHTML = `
            <div class="no-results">
                <h3>No results found for "${results.query}"</h3>
                <p>Try different keywords or browse categories</p>
            </div>
        `;
    }
}


function createSearchBidCard(bid) {
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

function createSearchSwapCard(swap) {
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


function showLoadingState() {
    const loader = document.createElement("div");
    loader.id = "search-loader";
    loader.className = "search-loader";
    loader.innerHTML = `
        <div class="spinner"></div>
        <p>Searching...</p>
    `;
    document.body.appendChild(loader);
}

function hideLoadingState() {
    const loader = document.getElementById("search-loader");
    if (loader) loader.remove();
}

const loaderCSS = `
.search-loader {
    position: fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,.5);
    display:flex;flex-direction:column;
    justify-content:center;align-items:center;
    z-index:9999;color:white;
}
.spinner {
    width:50px;height:50px;border:4px solid rgba(255,255,255,.3);
    border-top-color:white;border-radius:50%;
    animation:spin 1s linear infinite;
}
@keyframes spin {to{transform:rotate(360deg)}}
.no-results {grid-column:1/-1;text-align:center;padding:60px 20px;color:#666;}
`;
const styleEl = document.createElement("style");
styleEl.textContent = loaderCSS;
document.head.appendChild(styleEl);
