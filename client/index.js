const home = document.getElementById("homepage-section");
const viewAll = document.getElementById("viewAll-section");

const bidViewAllBtn = document.getElementById("bid-view-all")
const swapViewAllBtn = document.getElementById("swap-view-all")

const backHomeBtn = document.getElementById("back-home");

const bidBtn = document.querySelector(".bid-btn");
const swapBtn = document.querySelector(".swap-btn");

const homeBidContainer = document.getElementById("home-bid-cards-list");
const viewAllBidContainer = document.getElementById("viewAll-bid-cards-list");

const homeSwapContainer = document.getElementById("home-swap-cards-list");
const viewAllSwapContainer = document.getElementById("viewAll-swap-cards-list");

const bids = [
  { id: 1, title: "Calculator", category: "General Education", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/calculator.jpg" },
  { id: 2, title: "T-Square", category: "Architecture", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/T-Square.jpg" },
  { id: 3, title: "Calculus Textbook", category: "Engineering & CS", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/CalculusTextbook.png" },
  { id: 4, title: "Camera", category: "Media & Communications", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/Camera.jpg" },
  { id: 5, title: "Arduino Kit", category: "Engineering & CS", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/Arduino Kit.jpg" },
  { id: 6, title: "Arduino Kit", category: "Engineering & CS", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/Arduino Kit.jpg" },
  { id: 7, title: "Arduino Kit", category: "Engineering & CS", price: "₱1,250", timeLeft: "2h 45m left", bidsCount: 12, image: "images/Arduino Kit.jpg" }
];

const swaps = [
  { id: 1, title: "Calculator", category: "General Education", image: "images/calculator.jpg" },
  { id: 2, title: "T-Square", category: "Architecture", image: "images/T-Square.jpg" },
  { id: 3, title: "Calculus Textbook", category: "Engineering & CS", image: "images/CalculusTextbook.png" },
  { id: 4, title: "Camera", category: "Media & Communications", image: "images/Camera.jpg" },
  { id: 5, title: "Arduino", category: "Engineering & CS", image: "images/Arduino Kit.jpg" },
  { id: 6, title: "Arduino", category: "Engineering & CS", image: "images/Arduino Kit.jpg" },
  { id: 7, title: "Arduino", category: "Engineering & CS", image: "images/Arduino Kit.jpg" }
];

function createBidCard(bid){
  const bidCard =document.createElement("div");
  bidCard.classList.add("bid-card");
  bidCard.setAttribute("id", `bid-card-${bid.id}`);

  bidCard.innerHTML = `
    <div class="top">
        <img src="${bid.image}" alt="${bid.title}">
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
      <button class="join-bid-btn"><a href="#">Join Bid</a></button>
    </div>
  `;
  return bidCard;
}

bids.slice(0,5).forEach(bid => {
  homeBidContainer.appendChild(createBidCard(bid));
});

bids.forEach(bid =>{
  viewAllBidContainer.appendChild(createBidCard(bid));
});

function createSwapCard(swap) {
  const swapCard = document.createElement("div");
  swapCard.classList.add("swap-card");
  swapCard.setAttribute("id", `swap-card-${swap.id}`);

  swapCard.innerHTML = `
    <div class="top">
      <div class="offer-wrap"><p>Swap Offer</p></div>
      <p class="posted-items"><span>2</span> days ago</p>
    </div>
    <div class="img-container"><img src="${swap.image}" alt="${swap.title}"></div>
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

swaps.slice(0,5).forEach(swap =>{
  homeSwapContainer.appendChild(createSwapCard(swap));
});

swaps.forEach(swap => {
  viewAllSwapContainer.appendChild(createSwapCard(swap));
});

const bidHeartButtons = document.querySelectorAll(".heart-button-bid");
bidHeartButtons.forEach(button => {
    button.addEventListener("click", () =>{
        button.classList.toggle("active");
    });
});

const swapHeartButtons = document.querySelectorAll(".heart-button-swap");
swapHeartButtons.forEach(button => {
    button.addEventListener("click", () =>{
        button.classList.toggle("active");
    });
});

bidViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";

  viewAllBidContainer.style.display = "grid";
  viewAllSwapContainer.style.display = "none";

  bidBtn.classList.add("active");
  swapBtn.classList.remove("active");
});

swapViewAllBtn.addEventListener("click", () => {
  home.style.display = "none";
  viewAll.style.display = "block";

  viewAllBidContainer.style.display = "none";
  viewAllSwapContainer.style.display = "grid";

  bidBtn.classList.remove("active");
  swapBtn.classList.add("active");
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
});

swapBtn.addEventListener("click", () => {
    bidBtn.classList.remove("active");
    swapBtn.classList.add("active");

    viewAllBidContainer.style.display = "none";
    viewAllSwapContainer.style.display = "grid";
});



