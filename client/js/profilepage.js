document.addEventListener('DOMContentLoaded', function() {
  // Load header.html dynamically
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;
      updateItemCounts();
    })
    .catch(error => console.error("Error loading header:", error));


  const backHomeBtn = document.getElementById("back-home");
  backHomeBtn.addEventListener("click", () => {
    window.location.href = "homepage.html";
  });

  const contents = document.querySelectorAll(
    "#profile-user-info-content, #profile-listings-content, #profile-bids-content, #profile-swaps-content"
  );

  function updateItemCounts(){
    const listingsCount = document.querySelector("#profile-listings-btn p");
    const bidsCount = document.querySelector("#profile-bids-btn p");
    const swapsCount = document.querySelector("#profile-swaps-btn p");

    listingsCount.textContent = `${listings.length} Items`;
    bidsCount.textContent = `${winningBids.length} Items`;
    swapsCount.textContent = `${swappedItems.length} items`;
  }

  // ---------------- LISTINGS DATA & FUNCTIONS ----------------

  //Change/Remove when manipulating backend database
  const listings = [
    {id: 1,item: "Law Book",category: "Law",mode: "Swap",dateListed: "09 / 16 / 2025",status: "Active"},
    {id: 2,item: "Architecture Book",category: "Architecture",mode: "Bid",dateListed: "09 / 16 / 2025",status: "Pending"},
    {id: 3,item: "Calculator",category:"General Education",mode: "Bid",dateListed: "09 / 16 / 2025",status: "Completed"}
  ];

  function createListingRow(listing){
    const row = document.createElement("tr");
    row.classList.add("listings-body-row");
    row.setAttribute("id", `listing-row-${listing.id}`);

    const statusClass = listing.status.toLowerCase();

    row.innerHTML = `
      <td class="item">${listing.item}</td>
      <td>${listing.category}</td>
      <td>${listing.mode}</td>
      <td>${listing.dateListed}</td>
      <td><div class="status ${statusClass}">${listing.status}</div></td>
      <td>
        <div class="actions-container">
          <button class="view-btn">View</button>
          <iconify-icon icon="flowbite:edit-outline" width="24" height="24"></iconify-icon>
        </div>
      </td>
    `;
    return row;
  }

  function calculateListingStats(listings){
    return{
      total: listings.length,
      active: listings.filter(l => l.status === "Active").length,
      pending: listings.filter(l => l.status === "Pending").length,
      completed: listings.filter(l => l.status === "Completed").length,
    };
  }

  function createListingAnalytics(listings){
    const stats = calculateListingStats(listings);

    const analytics = document.createElement("div");
    analytics.classList.add("analytics");

    analytics.innerHTML = `
      <div class="total-items"><h6>${stats.total}</h6><p>Items</p></div>
      <div class="active-items"><h6>${stats.active}</h6><p>Active</p></div>
      <div class="pending-items"><h6>${stats.pending}</h6><p>Pending</p></div>
      <div class="completed-items"><h6>${stats.completed}</h6><p>Completed</p></div>
    `;
    return analytics;
  }

  const listingBody = document.querySelector(".profile-listings-content tbody");
  listings.forEach(listing => {
    const listingRow = createListingRow(listing);
    listingBody.appendChild(listingRow);
  });

  // ---------------- WINNING BIDS DATA & FUNCTIONS ----------------

  //Change/Remove when manipulating backend database
  const winningBids = [
    {id: 1,item: "Law Book",category: "Law",winningBid: "P100" ,dateWon: "09 / 16 / 2025"},
    {id: 2,item: "Law Book",category: "Law",winningBid: "P100" ,dateWon: "09 / 16 / 2025"},
    {id: 3,item: "Law Book",category: "Law",winningBid: "P100" ,dateWon: "09 / 16 / 2025"},
    {id: 4,item: "Law Book",category: "Law",winningBid: "P100" ,dateWon: "09 / 16 / 2025"}
  ];

  function createWinningBidRow(bid) {
    const row = document.createElement("tr");
    row.classList.add("bids-body-row");
    row.setAttribute("id", `winning-bid-row-${bid.id}`);

    row.innerHTML = `
      <td class="item">${bid.item}</td>
      <td>${bid.category}</td>
      <td>${bid.winningBid}</td>
      <td>${bid.dateWon}</td>
      <td>
        <div class="actions-container">
          <button class="view-btn">View</button>
        </div>
      </td>
    `;
    return row;
  }

  function calculateBidsStats(bids){
    return{
      total: bids.length
    };
  }

  function createBidsAnalytics(bids){
    const stats = calculateBidsStats(bids);

    const analytics = document.createElement("div");
    analytics.classList.add("analytics");

    analytics.innerHTML = `
      <div class="total-items"><h6>${stats.total}</h6><p>Items</p></div>
    `;
    return analytics;
  }

  const bidsBody = document.querySelector(".profile-bids-content tbody");
  winningBids.forEach(bid => {
    const bidsRow = createWinningBidRow(bid);
    bidsBody.appendChild(bidsRow);
  });

  // ---------------- SWAPPED ITEMS DATA & FUNCTIONS ----------------

  //Change/Remove when manipulating backend database
  const swappedItems= [
    {id: 1,item: "Law Book",category: "Law",swappedItem: "Calculator" ,dateSwapped: "09 / 16 / 2025"},
    {id: 2,item: "Law Book",category: "Law",swappedItem: "Calculator" ,dateSwapped: "09 / 16 / 2025"},
    {id: 3,item: "Law Book",category: "Law",swappedItem: "Calculator" ,dateSwapped: "09 / 16 / 2025"},
  ];

  function createSwappedRow(swap){
    const row = document.createElement("tr");
    row.classList.add("swaps-body-row");
    row.setAttribute("id", `swapped-item-row-${swap.id}`);

    row.innerHTML = `
      <td class="item">${swap.item}</td>
      <td>${swap.category}</td>
      <td>${swap.swappedItem}</td>
      <td>${swap.dateSwapped}</td>
      <td>
        <div class="actions-container">
          <button class="view-btn">View</button>
        </div>
      </td>
    `;
    return row;
  }

  function calculateSwapsStats(swaps){
    return{
      total: swaps.length
    };
  }

  function createSwapsAnalytics(swaps){
    const stats = calculateSwapsStats(swaps);

    const analytics = document.createElement("div");
    analytics.classList.add("analytics");

    analytics.innerHTML = `
      <div class="total-items"><h6>${stats.total}</h6><p>Items</p></div>
    `;
    return analytics;
  }

  const swapsBody = document.querySelector(".profile-swaps-content tbody");
  swappedItems.forEach(swap => {
    const swapsRow = createSwappedRow(swap);
    swapsBody.appendChild(swapsRow);
  });

  // ---------------- TITLE & SECTION HANDLING ----------------
  function updateTitleForSection(sectionId) {
   const titleContainer = document.querySelector(".title-container h3");
   const currentAnalytics = document.querySelector(".title-container .analytics");

    if (sectionId === "profile-bids-content") {
      titleContainer.textContent = "My Winning Bids";
      const bidsAnalytics = createBidsAnalytics(winningBids);
      currentAnalytics.replaceWith(bidsAnalytics);
    } 
    else if (sectionId === "profile-swaps-content") {
      titleContainer.textContent = "My Swaps";
      const swapsAnalytics = createSwapsAnalytics(swappedItems);
      currentAnalytics.replaceWith(swapsAnalytics);
    } 
    else if (sectionId === "profile-listings-content") {
      titleContainer.textContent = "My Listings";
      const listingAnalytics = createListingAnalytics(listings);
      currentAnalytics.replaceWith(listingAnalytics);
    }
  }


  function showContent(id) { 
    contents.forEach(c => c.style.display = c.id === id ? "block" : "none");
    updateTitleForSection(id);
  }

  showContent("profile-listings-content");

  document.getElementById("profile-user-info-btn").onclick = () => showContent("profile-user-info-content");
  document.getElementById("profile-listings-btn").onclick = () => showContent("profile-listings-content");
  document.getElementById("profile-bids-btn").onclick = () => showContent("profile-bids-content");
  document.getElementById("profile-swaps-btn").onclick = () => showContent("profile-swaps-content");
});