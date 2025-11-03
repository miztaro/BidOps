console.log("Script loaded");
const home = document.getElementById("homepage-section");
const viewAll = document.getElementById("viewAll-section");

const bidViewAllBtn = document.getElementById("bid-view-all")
const swapViewAllBtn = document.getElementById("swap-view-all")

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

function fetchItems() {
    fetch('../server_try/item/get_items.php')
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
                homeBidContainer.appendChild(createBidCard({
                    id: bid.item_id,
                    title: bid.title,
                    category: bid.category_type,
                    price: `₱${parseFloat(bid.starting_price || '0').toFixed(2)}`,
                    timeLeft: formatEndDate(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? `../server_try/item/${bid.image_path}` : null
                }));
            });
            
            bids.forEach(bid => {
                viewAllBidContainer.appendChild(createBidCard({
                    id: bid.item_id,
                    title: bid.title,
                    category: bid.category_type,
                    price: `₱${parseFloat(bid.starting_price || '0').toFixed(2)}`,
                    timeLeft: formatEndDate(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? `../server_try/item/${bid.image_path}` : null
                }));
            });

            swaps.slice(0, 4).forEach(swap => {
                homeSwapContainer.appendChild(createSwapCard({
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    image: swap.image_path ? `../server_try/item/${swap.image_path}` : null
                }));
            });
            
            swaps.forEach(swap => {
                viewAllSwapContainer.appendChild(createSwapCard({
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    image: swap.image_path ? `../server_try/item/${swap.image_path}` : null
                }));
            });
        })
        .catch(error => {
            console.error('Error loading items:', error);
        });
}

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

function createBidCard(bid){
    const bidCard = document.createElement("div");
    bidCard.classList.add("bid-card");
    bidCard.setAttribute("id", `bid-card-${bid.id}`);

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
            <p class="start-bid">Starting bid <span class="bid-price">${bid.price}</span></p>
            <div class="bid-time-and-count">
                <div class="time"><p>${bid.timeLeft}</p></div>
                <p class="count"><span>${bid.bidsCount}</span> bids</p>
            </div>
            <button class="join-bid-btn"><a href="join-bid.html?item_id=${bid.id}">Join Bid</a></button>
        </div>
    `;
    return bidCard;
}

function createSwapCard(swap) {
    const swapCard = document.createElement("div");
    swapCard.classList.add("swap-card");
    swapCard.setAttribute("id", `swap-card-${swap.id}`);

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
            <button class="make-offer-btn"><a href="#">Make Offer</a></button>
            <button class="heart-button-swap" id="heart-button-swap-${swap.id}">
                <iconify-icon icon="tabler:heart" width="25" height="25" id="favorite-logo-swap-${swap.id}"></iconify-icon>
            </button>
        </div>
    `;
    return swapCard;
}

bidViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";
  document.getElementById("header").style.display = "none";

  viewAllBidContainer.style.display = "grid";
  viewAllSwapContainer.style.display = "none";
  bidBtn.classList.add("active");
  swapBtn.classList.remove("active");

  categoryTitle.textContent = "All Programs";
  categoryDescription.textContent = "All Programs"
  
  viewAllBidContainer.innerHTML = "";
  fetchItems();
});

swapViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";
  document.getElementById("header").style.display = "none";

  viewAllBidContainer.style.display = "none";
  viewAllSwapContainer.style.display = "grid";
  bidBtn.classList.remove("active");
  swapBtn.classList.add("active");

  categoryTitle.textContent = "All Programs";
  categoryDescription.textContent = "All Programs"

  viewAllSwapContainer.innerHTML = "";
  fetchItems();
});

categoryCards.forEach(cards => {
  cards.addEventListener("click", () =>{
    const selectedCategory = cards.getAttribute("browse-category");
    document.getElementById("header").style.display = "none";

    home.style.display = "none";
    viewAll.style.display = "block";

    bidBtn.classList.add("active");
    swapBtn.classList.remove("active");
    viewAllBidContainer.style.display = "grid";
    viewAllSwapContainer.style.display = "none"

    categoryTitle.textContent = selectedCategory;
    categoryDescription.textContent = selectedCategory;

    viewAllBidContainer.innerHTML = "";
    viewAllSwapContainer.innerHTML = "";

    fetch(`../server_try/item/get_items.php?category=${selectedCategory}`)
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
              image: bid.image_path ? '../server_try/item/' + bid.image_path : null
            }));
          });
        } 
        else if (filteredSwaps.length > 0) {
          swapBtn.classList.add("active");
          bidBtn.classList.remove("active");
          viewAllSwapContainer.style.display = "grid";
          viewAllSwapContainer.style.display = "none";

          filteredSwaps.forEach(swap => {
            viewAllSwapContainer.appendChild(createSwapCard({
              id: swap.item_id,
              title: swap.title,
              category: swap.category_type,
              image: swap.image_path ? '../server_try/item/' + swap.image_path : null
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

function applyCurrentCategoryFilter() {
  const selectedCategory = categoryTitle.textContent.trim();
  const isBidActive = bidBtn.classList.contains("active");

  const url = selectedCategory === "All Programs" 
    ? '../server_try/item/get_items.php'
    : `../server_try/item/get_items.php?category=${selectedCategory}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const items = data.items || [];
      
      if (isBidActive) {
        viewAllBidContainer.innerHTML = "";
        const filteredBids = items.filter(item => item.item_type === 'bid');
        
        filteredBids.forEach(bid => {
          viewAllBidContainer.appendChild(createBidCard({
            id: bid.item_id,
            title: bid.title,
            category: bid.category_type,
            price: `₱${parseFloat(bid.starting_price || '0').toFixed(2)}`,
            timeLeft: formatEndDate(bid.end_date),
            bidsCount: bid.bid_count || 0,
            image: bid.image_path ? '../server_try/item/' + bid.image_path : null
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
            image: swap.image_path ? '../server_try/item/' + swap.image_path : null
          }));
        });
      }
    });
    
}
document.addEventListener("DOMContentLoaded", () => {
    fetchItems();
});
