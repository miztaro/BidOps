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

document.addEventListener('DOMContentLoaded', function() {
    fetchItems();
});

function fetchItems() {
    fetch('http://localhost:8000/server_try/item/get_items.php')
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
                    timeLeft: calculateTimeLeft(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? '../server_try/' + bid.image_path : getDefaultImage(bid.category_type)
                }));
            });
            
            bids.forEach(bid => {
                viewAllBidContainer.appendChild(createBidCard({
                    id: bid.item_id,
                    title: bid.title,
                    category: bid.category_type,
                    price: `₱${parseFloat(bid.starting_price || '0').toFixed(2)}`,
                    timeLeft: calculateTimeLeft(bid.end_date),
                    bidsCount: bid.bid_count || 0,
                    image: bid.image_path ? '../server_try/' + bid.image_path : getDefaultImage(bid.category_type)
                }));
            });

            swaps.slice(0, 4).forEach(swap => {
                homeSwapContainer.appendChild(createSwapCard({
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    image: swap.image_path ? '../server_try/' + swap.image_path : getDefaultImage(swap.category_type)
                }));
            });
            
            swaps.forEach(swap => {
                viewAllSwapContainer.appendChild(createSwapCard({
                    id: swap.item_id,
                    title: swap.title,
                    category: swap.category_type,
                    image: swap.image_path ? '../server_try/' + swap.image_path : getDefaultImage(swap.category_type)
                }));
            });
        })
        .catch(error => {
            console.error('Error loading items:', error);
        });
}

function calculateTimeLeft(endDate) {
    if (!endDate) return '7 days left';
    
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Ended';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
}

function getDefaultImage(category) {
    const categoryImages = {
        'Electronics': '../assets/images/calculator.jpg',
        'General Education': '../assets/images/CalculusTextbook.png',
        'Architecture': '../assets/images/T-Square.jpg',
        'Media & Communications': '../assets/images/Camera.jpg',
        'Engineering & CS': '../assets/images/Arduino Kit.jpg',
        'Sports': '../assets/images/calculator.jpg',
        'Collectibles': '../assets/images/Camera.jpg',
        'Accessories': '../assets/images/calculator.jpg',
        'Gaming': '../assets/images/calculator.jpg',
        'Home': '../assets/images/calculator.jpg',
        'Photography': '../assets/images/Camera.jpg',
        'Toys': '../assets/images/calculator.jpg',
        'Fashion': '../assets/images/calculator.jpg'
    };
    return categoryImages[category] || '../assets/images/calculator.jpg';
}

function createBidCard(bid){
    const bidCard = document.createElement("div");
    bidCard.classList.add("bid-card");
    bidCard.setAttribute("id", `bid-card-${bid.id}`);

    //!!IMAGE PATH!!!!!!!!!!!!
    const imagePath = bid.image_path 
        ? `http://localhost:8000/server_try/uploads/${bid.image_path}`
        : getDefaultImage(bid.category_type);

    bidCard.innerHTML = `
        <div class="top">
            <img src="${imagePath}" alt="${bid.title}" onerror="this.src='${getDefaultImage(bid.category_type)}'">
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

    //!!!!!!!!!IMAGE PATH!
    const imagePath = swap.image_path 
        ? `http://localhost:8000/server_try/uploads/${swap.image_path}`
        : getDefaultImage(swap.category_type);

    swapCard.innerHTML = `
        <div class="top">
            <div class="offer-wrap"><p>Swap Offer</p></div>
            <p class="posted-items">Recently posted</p>
        </div>
        <div class="img-container"><img src="${imagePath}" alt="${swap.title}" onerror="this.src='${getDefaultImage(swap.category_type)}'"></div>
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

    fetch(`http://localhost:8000/server_try/item/get_items.php?category=${selectedCategory}`)
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
              timeLeft: calculateTimeLeft(bid.end_date),
              bidsCount: bid.bid_count || 0,
              image: bid.image_path ? '../server_try/' + bid.image_path : getDefaultImage(bid.category_type)
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
              image: swap.image_path ? '../server_try/' + swap.image_path : getDefaultImage(swap.category_type)
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
    ? 'http://localhost:8000/server_try/item/get_items.php'
    : `http://localhost:8000/server_try/item/get_items.php?category=${selectedCategory}`;

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
            timeLeft: calculateTimeLeft(bid.end_date),
            bidsCount: bid.bid_count || 0,
            image: bid.image_path ? '../server_try/' + bid.image_path : getDefaultImage(bid.category_type)
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
            image: swap.image_path ? '../server_try/' + swap.image_path : getDefaultImage(swap.category_type)
          }));
        });
      }
    });
}