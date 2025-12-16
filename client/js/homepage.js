// js/homepage.js

console.log("Homepage Script loaded");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const homeSwapContainer = document.getElementById("home-swap-cards-list");

document.addEventListener("DOMContentLoaded", function () {
  // 1. Load Header
  fetch("header.html").then(r => r.text()).then(h => {
    document.getElementById("header").innerHTML = h;
    const script = document.createElement("script");
    script.src = "js/header.js";
    script.defer = true;
    document.body.appendChild(script);

    const pIcon = document.getElementById("user-header-profile-icon");
    if (pIcon) pIcon.addEventListener("click", () => window.location.href = "profilepage.html");
  });

  // 2. Load Footer
  fetch("footer.html").then(r => r.text()).then(f => {
    document.getElementById("footer").innerHTML = f;
  });

  // 3. Load Items
  fetchItems();

  // 4. Load Category Cards
  loadCategories();

});

// --- REDIRECTS TO NEW PAGE ---

document.getElementById("bid-view-all").addEventListener("click", () => {
  window.location.href = "browse-items.html?type=bid";
});

document.getElementById("swap-view-all").addEventListener("click", () => {
  window.location.href = "browse-items.html?type=swap";
});

// --- CATEGORY REDIRECTS ---
async function loadCategories() {
  try {
    const categoryButtons = document.querySelectorAll(".category-card");
    const res = await fetch("../server/item/get_items.php");
    const data = await res.json();

    const categories = data.categories || [];

    categoryButtons.forEach(btn => {
      const btnCategory = btn.getAttribute("browse-category");

      const cat = categories.find(c => c.name === btnCategory);

      const countElem = btn.querySelector("p");
      if (countElem) {
        if (cat && cat.count > 0) {
          const itemWord = cat.count === 1 ? "item" : "items";
          countElem.textContent = `${cat.count} ${itemWord}`;
        } else {
          countElem.textContent = "No Item";
        }
      }

      // Click Redirect
      btn.addEventListener("click", () => {
        window.location.href = `browse-items.html?category=${encodeURIComponent(cat.name)}`;
      });
    });
  } catch (err) {
    console.error("Error loading categories:", err);
  }
}

// --- FETCH HOME PREVIEW ITEMS ---
async function fetchItems() {
  try {
    const response = await fetch('../server/item/get_items.php');
    const data = await response.json();

    const items = data.items || [];

    let bids = items.filter(item => item.item_type === 'bid');
    let swaps = items.filter(item => item.item_type === 'swap');

    homeBidContainer.innerHTML = '';
    homeSwapContainer.innerHTML = '';

    // --- Bids ---
    const availableBidsSection = homeBidContainer.closest(".available-bids");
    const noBids = homeBidContainer.closest(".available-bids").querySelector("#no-card-text");
    const bidsTitle = availableBidsSection.querySelector(".available-bids-title");
    if (bids.length === 0) {
      noBids.style.display = "flex";
      if (bidsTitle) bidsTitle.style.display = "none";
    } else {
      noBids.style.display = "none";
      if (bidsTitle) bidsTitle.style.display = "flex";
      bids.slice(0, 4).forEach(bid => homeBidContainer.appendChild(createBidCard(bid)));
    }

    // --- Swaps ---
    const availableSwapsSection = homeSwapContainer.closest(".available-swaps");
    const noSwaps = homeSwapContainer.closest(".available-swaps").querySelector("#no-card-text");
    const swapsTitle = availableSwapsSection.querySelector(".available-swaps-title");
    if (swaps.length === 0) {
      noSwaps.style.display = "flex";
       if (swapsTitle) swapsTitle.style.display = "none";
    } else {
      noSwaps.style.display = "none";
      if (swapsTitle) swapsTitle.style.display = "flex"; 
      swaps.slice(0, 4).forEach(swap => homeSwapContainer.appendChild(createSwapCard(swap)));
    }

  } catch (error) {
    console.error('Error loading items:', error);
  }
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
        <div class="img-container">${imageContent}</div>
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
        </div>`;
  return swapCard;
}