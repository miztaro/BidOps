console.log("Script loaded");
const home = document.getElementById("homepage-section");
const viewAll = document.getElementById("viewAll-section");
const backHomeBtn = document.getElementById("back-home");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const viewAllBidContainer = document.getElementById("viewAll-bid-cards-list");
const homeSwapContainer = document.getElementById("home-swap-cards-list");
const viewAllSwapContainer = document.getElementById("viewAll-swap-cards-list");

const categoryTitle = document.getElementById("viewAll-category-title");
const categoryDescription = document.getElementById("viewAll-category-description");

// Sort Function
const sortBtn = document.querySelector(".sort-btn");
const sortDropdown = document.getElementById("sort-dropdown");
sortBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const isVisible = sortDropdown.style.display === "block";
  sortDropdown.style.display = isVisible ? "none" : "block";

  const isBidVisible =
    window.getComputedStyle(viewAllBidContainer).display !== "none";

  const options = sortDropdown.querySelectorAll(".sort-option");
  options.forEach((opt) => {
    const sortKey = opt.dataset.sort;
    if (isBidVisible && (sortKey === "asc" || sortKey === "desc")) {
      opt.style.display = "block";
    } else if (!isBidVisible && (sortKey === "az" || sortKey === "za")) {
      opt.style.display = "block";
    } else {
      opt.style.display = "none";
    }
  });
});

document.addEventListener("click", () => {
  sortDropdown.style.display = "none";
});

sortDropdown.addEventListener("click", (event) => {
  const option = event.target.closest(".sort-option");
  if (!option) return;

  const sortType = option.dataset.sort;
  const isBidVisible =
    window.getComputedStyle(viewAllBidContainer).display !== "none";
  const container = isBidVisible ? viewAllBidContainer : viewAllSwapContainer;
  const cards = Array.from(
    container.querySelectorAll(isBidVisible ? ".bid-card" : ".swap-card")
  );

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
      return sortType === "az"
        ? titleA.localeCompare(titleB)
        : titleB.localeCompare(titleA);
    });
  }

  container.innerHTML = "";
  cards.forEach((card) => container.appendChild(card));
  sortDropdown.style.display = "none";
});
// End of Sort Function

// Header
document.addEventListener("DOMContentLoaded", function() {
    fetch("header.html")
        .then(response => response.text())
        .then(header => {
        document.getElementById("header").innerHTML = header;
        const script = document.createElement("script");
        const profileIcon = document.getElementById("user-header-profile-icon");

        if(profileIcon) {
            profileIcon.addEventListener("click", () => {
                window.location.href = "profilepage.html";
            });
        }
        
        script.src = "js/header.js";
        script.defer = true;
        document.body.appendChild(script);
    })
.catch(error => console.error("Error determining role:", error));
});
// End of Header

// Fetch items Bid & Swap Function
function fetchItems() {
    fetch('../server/item/get_items.php')
        .then(response => response.json())
        .then(data => {
            console.log('Loaded items:', data);
            const items = data.items || [];
            const bids = items.filter(item => item.item_type === 'bid');
            const swaps = items.filter(item => item.item_type === 'swap');

            homeBidContainer.innerHTML = '';
            viewAllBidContainer.innerHTML = '';
            homeSwapContainer.innerHTML = '';
            viewAllSwapContainer.innerHTML = '';

            bids.slice(0, 4).forEach(bid => {
                const priceValue = parseFloat(bid.starting_price || 0); 
                const bidData = {
                    id: bid.item_id,
                    title: bid.title,
                    category: bid.category_type,
                    price: priceValue,
                    formattedPrice: `₱${priceValue.toFixed(2)}`, 
                    dateListed: bid.created_date,
                    timeLeft: formatEndDate(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? `../server/item/${bid.image_path}` : null
                };
                homeBidContainer.appendChild(createBidCard(bidData));
            });

            bids.forEach(bid => {
                const priceValue = parseFloat(bid.starting_price || 0);
                const bidData = {
                    id: bid.item_id,
                    title: bid.title,
                    category: bid.category_type,
                    price: priceValue,
                    formattedPrice: `₱${priceValue.toFixed(2)}`,
                    dateListed: bid.created_date,
                    timeLeft: formatEndDate(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? `../server/item/${bid.image_path}` : null
                };
                viewAllBidContainer.appendChild(createBidCard(bidData));
            });

            swaps.slice(0, 4).forEach(swap => {
                const swapData = {
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    dateListed: swap.created_date,
                    image: swap.image_path ? `../server/item/${swap.image_path}` : null
                };
                homeSwapContainer.appendChild(createSwapCard(swapData));
            });

            swaps.forEach(swap => {
                const swapData = {
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    dateListed: swap.created_date,
                    image: swap.image_path ? `../server/item/${swap.image_path}` : null
                };
                viewAllSwapContainer.appendChild(createSwapCard(swapData));
            });
        })
        .catch(error => {
            console.error('Error loading items:', error);
        });
}
// End of Fetch items Bid & Swap Function

//Format date Function
function formatEndDate(endDate) {
    if (!endDate) return 'Ends at: Not specified';
    
    const end = new Date(endDate);
    const now = new Date();
    
    if (end <= now) {
        return 'Ended';
    }
    
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
//End of Format date Function

//Create Bid Card Function
function createBidCard(bid){
    const bidCard = document.createElement("div");
    bidCard.classList.add("bid-card");
    bidCard.setAttribute("id", `bid-card-${bid.id}`);

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
            <button class="heart-button-bid" id="heart-button-${bid.id}">
                <iconify-icon icon="tabler:heart" width="25" height="25" id="favorite-logo-${bid.id}"></iconify-icon>
            </button>
        </div>

        <div class="bottom">
            <h6>${bid.title}</h6>
            <p class="category">${bid.category}</p>
            <p class="start-bid">Starting bid <span class="bid-price">₱${priceValue.toFixed(2)}</span></p>
            <div class="bid-time-and-count">
                <div class="time"><p>${bid.timeLeft}</p></div>
                <p class="count"><span>${bid.bidsCount}</span> bids</p>
            </div>
            <button class="join-bid-btn"><a href="join-bid.html?item_id=${bid.id}">Join Bid</a></button>
        </div>
    `;
    return bidCard;
}
//End of Create Bid Card Function

//Create Swap Card Function
function createSwapCard(swap) {
    const swapCard = document.createElement("div");
    swapCard.classList.add("swap-card");
    swapCard.setAttribute("id", `swap-card-${swap.id}`);

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
        </div>
        <div class="button-container">
            <button class="make-offer-btn"><a href="view-swap.html?item_id=${swap.id}">Make Offer</a></button>
            <button class="heart-button-swap" id="heart-button-swap-${swap.id}">
                <iconify-icon icon="tabler:heart" width="25" height="25" id="favorite-logo-swap-${swap.id}"></iconify-icon>
            </button>
        </div>
    `;
    return swapCard;
}
//End of Create Swap Card Function

//View All Bids Event Handling
const bidViewAllBtn = document.getElementById("bid-view-all");
const bidBtn = document.querySelector(".bid-btn");
const swapBtn = document.querySelector(".swap-btn");
bidViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";
  document.getElementById("header").style.display = "none";

  viewAllBidContainer.style.display = "grid";
  viewAllSwapContainer.style.display = "none";
  bidBtn.classList.add("active");
  swapBtn.classList.remove("active");

  categoryTitle.textContent = "All Categories";
  categoryDescription.textContent = "All Categories"
  
  viewAllBidContainer.innerHTML = "";
  fetchItems();
});
//End of View All Bids Event Handling

//View All Swaps Event Handling
const swapViewAllBtn = document.getElementById("swap-view-all");
swapViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";
  document.getElementById("header").style.display = "none";

  viewAllBidContainer.style.display = "none";
  viewAllSwapContainer.style.display = "grid";
  bidBtn.classList.remove("active");
  swapBtn.classList.add("active");

  categoryTitle.textContent = "All Categories";
  categoryDescription.textContent = "All Categories"

  viewAllSwapContainer.innerHTML = "";
  fetchItems();
});
//End of View All Swaps Event Handling

//Category Cards For Each
const categoryCards = document.querySelectorAll(".category-card");
categoryCards.forEach(card => {
  const categoryName = card.getAttribute("browse-category");
  const countElem = card.querySelector("p"); 

  fetch(`../server/item/get_items.php?category=${categoryName}`)
    .then(response => response.json())
    .then(data => {
      const items = data.items || [];
      countElem.textContent = `${items.length} ${items.length <= 1  ? 'item' : 'items'}` ;
    });

  card.addEventListener("click", () => {
    document.getElementById("header").style.display = "none";
    home.style.display = "none";
    viewAll.style.display = "block";

    bidBtn.classList.add("active");
    swapBtn.classList.remove("active");
    viewAllBidContainer.style.display = "grid";
    viewAllSwapContainer.style.display = "none";

    categoryTitle.textContent = categoryName;
    categoryDescription.textContent = categoryName;

    viewAllBidContainer.innerHTML = "";
    viewAllSwapContainer.innerHTML = "";

    fetch(`../server/item/get_items.php?category=${categoryName}`)
      .then(response => response.json())
      .then(data => {
        const items = data.items || [];
        const filteredBids = items.filter(item => item.item_type === 'bid');
        const filteredSwaps = items.filter(item => item.item_type === 'swap');

        if (filteredBids.length > 0) {
          bidBtn.classList.add("active");
          swapBtn.classList.remove("active");
          viewAllBidContainer.style.display = "grid";
          viewAllSwapContainer.style.display = "none";

          filteredBids.forEach(bid => {
            viewAllBidContainer.appendChild(createBidCard({
              id: bid.item_id,
              title: bid.title,
              category: bid.category_type,
              price: `₱${parseFloat(bid.starting_price || '0').toFixed(2)}`,
              timeLeft: formatEndDate(bid.end_date),
              bidsCount: bid.bid_count || 0,
              image: bid.image_path ? '../server/item/' + bid.image_path : null
            }));
          });
        } 
        else if (filteredSwaps.length > 0) {
          swapBtn.classList.add("active");
          bidBtn.classList.remove("active");
          viewAllSwapContainer.style.display = "grid";

          filteredSwaps.forEach(swap => {
            viewAllSwapContainer.appendChild(createSwapCard({
              id: swap.item_id,
              title: swap.title,
              category: swap.category_type,
              image: swap.image_path ? '../server/item/' + swap.image_path : null
            }));
          });
        } 
        else {
          bidBtn.classList.remove("active");
          swapBtn.classList.remove("active");
          viewAllBidContainer.style.display = "none";
          viewAllSwapContainer.style.display = "none";
          categoryDescription.textContent = "No items found for this category.";
        }
      });
  });
});
//End of Category Cards For Each

//Buttons Event Handling
const categoryBtn = document.getElementById("viewAll-category-btn");
const categoryDropDown = document.getElementById("viewAll-category-dropDown");
backHomeBtn.addEventListener("click", () => {
    viewAll.style.display = "none";
    home.style.display = "block";
    document.getElementById("header").style.display = "block";
});

bidBtn.addEventListener("click", () => {
    bidBtn.classList.add("active");
    swapBtn.classList.remove("active");

    viewAllBidContainer.style.display="grid";
    viewAllSwapContainer.style.display="none";
    applyCurrentCategoryFilter();
});

swapBtn.addEventListener("click", () => {
    bidBtn.classList.remove("active");
    swapBtn.classList.add("active");

    viewAllBidContainer.style.display = "none";
    viewAllSwapContainer.style.display = "grid";
    applyCurrentCategoryFilter();
});

categoryBtn.addEventListener("click", () => {
  event.stopPropagation();
  categoryDropDown.classList.toggle("active");
  categoryBtn.classList.toggle("active")
});
//End of Buttons Event Handling

// Category Dropdown For Each
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

document.addEventListener("click", (event) => {
  if (!categoryBtn.contains(event.target) && !categoryDropDown.contains(event.target)) {
    categoryDropDown.classList.remove("active");
    categoryBtn.classList.remove("active");
  }
});
// End of Category Dropdown For Each

//Category DropDown function
function applyCurrentCategoryFilter() {
  const selectedCategory = categoryTitle.textContent.trim();
  const isBidActive = bidBtn.classList.contains("active");

  const url = selectedCategory === "All Categories" 
    ? '../server/item/get_items.php'
    : `../server/item/get_items.php?category=${selectedCategory}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const items = data.items || [];
      
      if (isBidActive) {
        viewAllBidContainer.innerHTML = "";
        const filteredBids = items.filter(item => item.item_type === 'bid');
        
        filteredBids.forEach(bid => {
          const priceValue = parseFloat(bid.starting_price || 0);
          
          viewAllBidContainer.appendChild(createBidCard({
            id: bid.item_id,
            title: bid.title,
            category: bid.category_type,
            price: priceValue,
            formattedPrice: `₱${priceValue.toFixed(2)}`,
            dateListed: bid.created_date,
            timeLeft: formatEndDate(bid.end_date),
            bidsCount: bid.bid_count || 0,
            image: bid.image_path ? '../server/item/' + bid.image_path : null
          }));
        });
      } else {
        viewAllSwapContainer.innerHTML = "";
        const filteredSwaps = items.filter(item => item.item_type === 'swap');
        
        filteredSwaps.forEach(swap => {
          viewAllSwapContainer.appendChild(createSwapCard({
            id: swap.item_id,
            title: swap.title,
            category: swap.category_type,
            image: swap.image_path ? '../server/item/' + swap.image_path : null
          }));
        });
      }
    });
}
//Category DropDown function

function resolveImagePath(fileName) {
    const basePath = "../server/item/";
    if (!fileName) return null;

    // Remove existing extension (if any)
    const baseName = fileName.replace(/\.(jpg|jpeg|png)$/i, "");

    // Try multiple extensions
    const possibleExtensions = [".jpeg", ".jpg", ".png"];
    const img = new Image();

    // Return the first one that loads successfully
    return new Promise((resolve) => {
        let resolved = false;

        possibleExtensions.forEach((ext) => {
            const testSrc = `${basePath}${baseName}${ext}`;
            const testImg = new Image();
            testImg.onload = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(testSrc);
                }
            };
            testImg.onerror = () => {
                // do nothing, will try next
            };
            testImg.src = testSrc;
        });

        // fallback (in case none work)
        setTimeout(() => {
            if (!resolved) resolve(`${basePath}${fileName}`);
        }, 500);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    fetchItems();
});

// Search functions
function initHomepageSearch() {
  console.log("[simple-search] Initializing live search...");

  const input = document.querySelector(".header-search input");
  const button = document.querySelector(".header-search button");

  // Retry until header is fully loaded
  if (!input || !button) {
    console.warn("[simple-search] Header not ready. Retrying...");
    setTimeout(initHomepageSearch, 500);
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

  // Live search
  input.addEventListener("input", () => filterVisibleCards(input.value));

  // Button click triggers 
  button.addEventListener("click", (e) => {
    e.preventDefault();
    filterVisibleCards(input.value);
  });

  // Enter key triggers 
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") filterVisibleCards(input.value);
  });

  console.log("[simple-search] Ready (live mode)!");
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(initHomepageSearch, 1000);
});
