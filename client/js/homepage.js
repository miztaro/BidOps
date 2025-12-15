// js/homepage.js

console.log("Homepage Script loaded");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const homeSwapContainer = document.getElementById("home-swap-cards-list");

document.addEventListener("DOMContentLoaded", function() {
    // 1. Load Header
    fetch("header.html").then(r => r.text()).then(h => {
        document.getElementById("header").innerHTML = h;
        const script = document.createElement("script");
        script.src = "js/header.js"; 
        script.defer = true;
        document.body.appendChild(script);
        
        const pIcon = document.getElementById("user-header-profile-icon");
        if(pIcon) pIcon.addEventListener("click", () => window.location.href = "profilepage.html");
    });
    
    // 2. Load Footer
    fetch("footer.html").then(r => r.text()).then(f => {
        document.getElementById("footer").innerHTML = f;
    });

    // 3. Load Items
    fetchItems(); 
});

// --- REDIRECTS TO NEW PAGE ---

document.getElementById("bid-view-all").addEventListener("click", () => {
    window.location.href = "browse-items.html?type=bid";
});

document.getElementById("swap-view-all").addEventListener("click", () => {
    window.location.href = "browse-items.html?type=swap";
});

// --- CATEGORY REDIRECTS ---

document.querySelectorAll(".category-card").forEach(card => {
    const categoryName = card.getAttribute("browse-category");
    const countElem = card.querySelector("p");

    // Get Item Count
    fetch(`../server/item/get_items.php?category=${categoryName}`)
        .then(r => r.json())
        .then(data => {
            const count = data.items ? data.items.length : 0;
            countElem.textContent = `${count} items`;
        });

    // Click Redirect
    card.addEventListener("click", () => {
        window.location.href = `browse-items.html?category=${encodeURIComponent(categoryName)}`;
    });
});

// --- FETCH HOME PREVIEW ITEMS ---

function fetchItems() {
  fetch('../server/item/get_items.php')
    .then(response => response.json())
    .then(data => {
      const items = data.items || [];
      const bids = items.filter(item => item.item_type === 'bid');
      const swaps = items.filter(item => item.item_type === 'swap');

      homeBidContainer.innerHTML = '';
      homeSwapContainer.innerHTML = '';

      // Only show top 4
      bids.slice(0, 4).forEach(bid => {
        homeBidContainer.appendChild(createBidCard(bid));
      });

      swaps.slice(0, 4).forEach(swap => {
        homeSwapContainer.appendChild(createSwapCard(swap));
      });
    })
    .catch(error => console.error('Error loading items:', error));
}

// --- CARD CREATION HELPERS ---

function formatEndDate(endDate) {
  if (!endDate) return 'Ends at: Not specified';
  const end = new Date(endDate);
  const now = new Date();
  if (end <= now) return 'Ended';
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
  return `Ends at ${end.toLocaleDateString('en-US', options)}`;
}

function createBidCard(bid) {
  const bidCard = document.createElement("div");
  bidCard.classList.add("bid-card");
  const priceValue = parseFloat(bid.starting_price || 0);

  const imageContent = bid.images && bid.images.length > 0 
    ? `<img src="../server/item/${bid.images[0]}" alt="${bid.title}">`
    : `<div style="background: #073066; height: 100%; display: flex; align-items: center; justify-content: center; color: white;"><iconify-icon icon="mdi:package-variant" width="50" height="50"></iconify-icon></div>`;

  bidCard.innerHTML = `
        <div class="top">${imageContent}<button class="heart-button-bid"><iconify-icon icon="tabler:heart" width="25" height="25"></iconify-icon></button></div>
        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category_type}</p>
            <p class="start-bid">Starting bid <span class="bid-price">₱${priceValue.toFixed(2)}</span></p>
            <div class="bid-time-and-count">
                <div class="time"><p>${formatEndDate(bid.end_date)}</p></div>
                <p class="count"><span>${bid.bid_count || 0}</span> bids</p>
            </div>
            <button class="join-bid-btn"><a href="join-bid.html?item_id=${bid.item_id}">Join Bid</a></button>
        </div>`;
  return bidCard;
}

function createSwapCard(swap) {
  const swapCard = document.createElement("div");
  swapCard.classList.add("swap-card");
  const imageContent = swap.images && swap.images.length > 0
    ? `<img src="../server/item/${swap.images[0]}" alt="${swap.title}">`
    : `<div style="background: #073066; height: 100%; display: flex; align-items: center; justify-content: center; color: white;"><iconify-icon icon="mdi:swap-horizontal" width="50" height="50"></iconify-icon></div>`;

  swapCard.innerHTML = `
        <div class="top"><div class="offer-wrap"><p>Swap Offer</p></div><p class="posted-items">Recently posted</p></div>
        <div class="img-container">${imageContent}</div>
        <div class="bottom"><h6>${swap.title}</h6><p>${swap.category_type}</p></div>
        <div class="button-container">
            <button class="make-offer-btn"><a href="view-swap.html?item_id=${swap.item_id}">Make Offer</a></button>
            <button class="heart-button-swap"><iconify-icon icon="tabler:heart" width="25" height="25"></iconify-icon></button>
        </div>`;
  return swapCard;
}