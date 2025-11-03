document.addEventListener('DOMContentLoaded', function() {
  fetch("header.html")  
  .then(response => response.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;

    const profileIcon = document.getElementById("profile-icon");
    if(profileIcon) {
      profileIcon.addEventListener("click", () => {
        window.location.href = "profilepage.html";
      });
    }

    const backHomeBtn = document.getElementById("back-home");
    backHomeBtn.addEventListener("click", () => {
      window.location.href = "homepage.html";
    });

    updateItemCounts();
  })

  .catch(error => console.error("Error loading header:", error));

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
    {id: 2,item: "Architecture Book",category: "Architecture & Design",mode: "Bid",dateListed: "09 / 16 / 2025",status: "Pending"},
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

  // Map section IDs to their buttons
  const buttons = {
    "profile-user-info-content": document.getElementById("profile-user-info-btn"),
    "profile-listings-content": document.getElementById("profile-listings-btn"),
    "profile-bids-content": document.getElementById("profile-bids-btn"),
    "profile-swaps-content": document.getElementById("profile-swaps-btn")
  };

  function showContent(id) { 

    contents.forEach(c => c.style.display = c.id === id ? "block" : "none");
    updateTitleForSection(id);

    Object.values(buttons).forEach(btn => btn.classList.remove("active"));
    buttons[id].classList.add("active");
  }

  showContent("profile-listings-content");

  Object.entries(buttons).forEach(([sectionId, btn]) => {
    btn.onclick = () => showContent(sectionId);
  });

  // ---------------- RENDERING & FILTERING OF ITEMS ----------------
  let currentFilters = {
   Category: null,
    Mode: null,
    Status: null,
  };

  let sectionFilters = {
    listings: { Category: null, Mode: null, Status: null },
    bids: { Category: null, Mode: null, Status: null },
    swaps: { Category: null, Mode: null, Status: null },
  };

  // Rendering of items to display (only renders for the target section)
  function renderItems(itemsArray, section) {
    const listingBody = document.querySelector(".profile-listings-content tbody");
    const bidsBody = document.querySelector(".profile-bids-content tbody");
    const swapsBody = document.querySelector(".profile-swaps-content tbody");

    if (section === "listings") listingBody.innerHTML = "";
    if (section === "bids") bidsBody.innerHTML = "";
    if (section === "swaps") swapsBody.innerHTML = "";

    itemsArray.forEach(item => {
      if (section === "listings") {
        const row = createListingRow(item);
        listingBody.appendChild(row);
      } else if (section === "bids") {
        const row = createWinningBidRow(item);
        bidsBody.appendChild(row);
      } else if (section === "swaps") {
        const row = createSwappedRow(item);
        swapsBody.appendChild(row);
      }
    });
  }

  // Apply Filter (now section-specific)
  function applyFilter(type, value, section) {
    const currentFilters = sectionFilters[section];

    if (type === "Category" && value === "All Programs") {
      currentFilters[type] = null;
    } else {
      currentFilters[type] = value;
    }

    let data = [];
    if (section === "listings") data = listings;
    else if (section === "swaps") data = swappedItems;
    else if (section === "bids") data = winningBids;

    const filtered = data.filter(item => {
      return (
        (!currentFilters.Category || item.category === currentFilters.Category) &&
        (!currentFilters.Mode || item.mode === currentFilters.Mode) &&
        (!currentFilters.Status || item.status === currentFilters.Status)
      );
    });

    renderItems(filtered, section);
  }

  // ---------------- DROPDOWN HANDLING ----------------

  // LISTINGS
  const listingsFilterBtn = document.getElementById("listings-filter-btn");
  const listingsFilterDropdown = document.querySelector(".listings-filter-dropdown");

  listingsFilterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    listingsFilterDropdown.classList.toggle("active");
    listingsFilterBtn.classList.toggle("active");
  });

  // BIDS
  const bidsFilterBtn = document.getElementById("bids-filter-btn");
  const bidsFilterDropdown = document.querySelector(".bids-filter-dropdown");

  bidsFilterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    bidsFilterDropdown.classList.toggle("active");
    bidsFilterBtn.classList.toggle("active");
  });

  // SWAPS
  const swapsFilterBtn = document.getElementById("swaps-filter-btn");
  const swapsFilterDropdown = document.querySelector(".swaps-filter-dropdown");

  swapsFilterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    swapsFilterDropdown.classList.toggle("active");
    swapsFilterBtn.classList.toggle("active");
  });

  const allFilterBtns = document.querySelectorAll(".listings-filter-btn, .bids-filter-btn, .swaps-filter-btn");
  const allFilterDropdowns = document.querySelectorAll(".listings-filter-dropdown, .bids-filter-dropdown, .swaps-filter-dropdown");
  const filterHeaders = document.querySelectorAll(".dropDown-header");
  const subDropDownItems = document.querySelectorAll(".sub-dropdown .dropDown-item");
  const showAllBtns = document.querySelectorAll(".show-all");

  // Handle dropdown header click
  filterHeaders.forEach(header => {
    header.addEventListener("click", (event) => {
      event.stopPropagation();
      const subDropDown = header.nextElementSibling;
      const isOpen = subDropDown.classList.contains("show");

      document.querySelectorAll(".sub-dropdown").forEach(sd => sd.classList.remove("show"));
      filterHeaders.forEach(h => h.classList.remove("active"));

      if (!isOpen) {
        subDropDown.classList.add("show");
        header.classList.add("active");
      }
    });
  });

  // Handle clicks outside of dropdowns
  document.addEventListener("click", (event) => {
    const isClickInsideDropdown = Array.from(allFilterDropdowns).some(dropdown =>
      dropdown.contains(event.target)
    );
    const isClickOnBtn = Array.from(allFilterBtns).some(btn =>
      btn === event.target
    );

    if (!isClickInsideDropdown && !isClickOnBtn) {
      allFilterDropdowns.forEach(dropdown => dropdown.classList.remove("active"));
      allFilterBtns.forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".sub-dropdown").forEach(sd => sd.classList.remove("show"));
      filterHeaders.forEach(h => h.classList.remove("active"));
    }
  });

  // Handle dropdown item selection
  subDropDownItems.forEach(item => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedText = item.textContent.trim();
      const filterType = item.closest(".dropdown-section")
      .querySelector(".dropDown-header").textContent.trim();

      let section = "listings";
      if (item.closest(".bids-filter-dropdown")) section = "bids";
      else if (item.closest(".swaps-filter-dropdown")) section = "swaps";

      applyFilter(filterType, selectedText, section);

      allFilterDropdowns.forEach(dropdown => dropdown.classList.remove("active"));
      allFilterBtns.forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".sub-dropdown").forEach(sd => sd.classList.remove("show"));
      filterHeaders.forEach(h => h.classList.remove("active"));
    });
  });

  // Handle “Show All” for each section
  showAllBtns.forEach(btn => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();

      allFilterDropdowns.forEach(dropdown => dropdown.classList.remove("active"));
      allFilterBtns.forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".sub-dropdown").forEach(sd => sd.classList.remove("show"));

      if (btn.closest(".listings-filter")) {
        sectionFilters.listings = { Category: null, Mode: null, Status: null };
        renderItems(listings, "listings");
      } else if (btn.closest(".bids-filter")) {
        sectionFilters.bids = { Category: null, Mode: null, Status: null };
        renderItems(winningBids, "bids");
      } else if (btn.closest(".swaps-filter")) {
        sectionFilters.swaps = { Category: null, Mode: null, Status: null };
        renderItems(swappedItems, "swaps");
      }
    });
  });
});