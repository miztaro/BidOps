export function getStatusClass(status) {
  status = status.toLowerCase();
  if (status.includes("active")) return "active-items";
  if (status.includes("pending")) return "pending-items";
  if (status.includes("rejected")) return "rejected-items";
  if (status.includes("sold")) return "sold-items";
  return "";
}

export function createListingRow(listing) {
  const row = document.createElement("tr");
  row.classList.add("listings-body-row");
  row.setAttribute("id", `listing-row-${listing.id}`);

  row.innerHTML = `
      <td class="item">${listing.item}</td>
      <td>${listing.category}</td>
      <td>${listing.mode}</td>
      <td>${listing.dateListed}</td>
      <td><div class="status ${getStatusClass(listing.status)}">${listing.status}</div></td>
      <td>
        <div class="actions-container">
          <button class="lists-view-btn" 
            data-id="${listing.id}"
            data-type="${listing.mode}"
            data-status="${listing.status.toLowerCase()}">
            View
          </button>
          ${listing.status.toLowerCase() === "active" ? `<iconify-icon data-id="${listing.id}" class="edit-btn" icon="flowbite:edit-outline" width="24" height="24"></iconify-icon>` : ''}
        </div>
      </td>
    `;
  return row;
}

document.addEventListener('DOMContentLoaded', function () {
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header").innerHTML = data;

      const profileIcon = document.getElementById("user-header-profile-icon");
      if (profileIcon) {
        profileIcon.addEventListener("click", () => {
          window.location.href = "profilepage.html";
        });
      }

      const backHomeBtn = document.getElementById("back-home");
      backHomeBtn.addEventListener("click", () => {
        window.location.href = "homepage.html";
      });
    })
    .catch(error => console.error("Error loading header:", error));

  const contents = document.querySelectorAll(
    "#profile-user-info-content, #profile-listings-content, #profile-bids-content, #profile-swaps-content"
  );

  fetchListings();

  // ---------------- TODO: USER PROFILE DATA & FUNCTIONS ----------------

  //Listings Data & Functions
  let listings = [];
  function fetchListings() {
    fetch('../server/item/get_items.php')
      .then(response => response.json())
      .then(data => {

        if (!data.listings) {
          console.error("No listings found in response:", data);
          return;
        }

        listings = data.listings.map(item => ({
          id: item.item_id,
          item: item.title,
          category: item.category_type,
          mode: item.item_type,
          dateListed: item.created_date,
          status: item.status,
        }));
        renderItems(listings, "listings");
        document.querySelector("#profile-listings-btn p").textContent = `${listings.length} Items`;
      })
      .catch(error => console.error("Error loading listings: ", error));
  }

  function calculateListingStats(listings) {
    return {
      total: listings.length,
      active: listings.filter(l => l.status.toLowerCase().includes("active")).length,
      pending: listings.filter(l => l.status.toLowerCase().includes("pending")).length,
      rejected: listings.filter(l => l.status.toLowerCase().includes("rejected")).length,
      sold: listings.filter(l => l.status.toLowerCase().includes("sold")).length
    };
  }

  function createListingAnalytics(listings) {
    const stats = calculateListingStats(listings);

    const analytics = document.createElement("div");
    analytics.classList.add("analytics");

    analytics.innerHTML = `
      <div class="total-items"><h6>${stats.total}</h6><p>Items</p></div>
      <div class="active-items"><h6>${stats.active}</h6><p>Active</p></div>
      <div class="pending-items"><h6>${stats.pending}</h6><p>Pending</p></div>
      <div class="rejected-items"><h6>${stats.rejected}</h6><p>Rejected</p></div>
      <div class="sold-items"><h6>${stats.sold}</h6><p>Sold</p></div>
    `;
    return analytics;
  }
  //End of Listings Data & Functions

  //Winning Bids Data & Functions 
  //NOTE: THIS IS STATIC DATA , Change/Remove when manipulating backend database
  const winningBids = [
    { id: 1, item: "Gaming Laptop", category: "Electronics", winningBid: "P100", dateWon: "09 / 16 / 2025" },
    { id: 2, item: "DSLR Lens", category: "Photography", winningBid: "P100", dateWon: "09 / 16 / 2025" },
    { id: 3, item: "Board Game", category: "Toys", winningBid: "P100", dateWon: "09 / 16 / 2025" },
    { id: 4, item: "ps5 cONTROLLER", category: "Gaming", winningBid: "P100", dateWon: "09 / 16 / 2025" },
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
          <button class="bids-view-btn" data-id="${bid.id}">View</button>
        </div>
      </td>
    `;
    return row;
  }

  function calculateBidsStats(bids) {
    return {
      total: bids.length
    };
  }

  function createBidsAnalytics(bids) {
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
  document.querySelector("#profile-bids-btn p").textContent = `${winningBids.length} Items`;
  //End of Winning Bids Data & Functions 

  // ---------------- SWAPPED ITEMS DATA & FUNCTIONS ----------------

  //NOTE: THIS IS STATIC DATA , Change/Remove when manipulating backend database
  const swappedItems = [
    { id: 1, item: "Gaming Laptop", category: "Electronics", swappedItem: "Calculator", dateSwapped: "09 / 16 / 2025" },
    { id: 2, item: "DSLR Lens", category: "Photography", swappedItem: "Mechanical KB", dateSwapped: "09 / 16 / 2025" },
    { id: 3, item: "Board Game", category: "Toys", swappedItem: "Monitor", dateSwapped: "09 / 16 / 2025" },
  ];

  function createSwappedRow(swap) {
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
          <button class="swaps-view-btn">View</button>
        </div>
      </td>
    `;
    return row;
  }

  function calculateSwapsStats(swaps) {
    return {
      total: swaps.length
    };
  }

  function createSwapsAnalytics(swaps) {
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

  document.querySelector("#profile-swaps-btn p").textContent = `${swappedItems.length} Items`;

  // ---------------- TITLE & SECTION HANDLING ----------------

  function updateTitleForSection(sectionId) {
    const titleContainer = document.querySelector(".title-container");
    const titleHeading = document.querySelector(".title-container h3");
    const currentAnalytics = document.querySelector(".title-container .analytics");

    if (sectionId === "profile-user-info-content") {
      titleContainer.style.display = "none";
      return;
    }

    titleContainer.style.display = "flex";

    if (sectionId === "profile-bids-content") {
      titleHeading.textContent = "My Winning Bids";
      const bidsAnalytics = createBidsAnalytics(winningBids);
      currentAnalytics.replaceWith(bidsAnalytics);
    }
    else if (sectionId === "profile-swaps-content") {
      titleHeading.textContent = "My Swaps";
      const swapsAnalytics = createSwapsAnalytics(swappedItems);
      currentAnalytics.replaceWith(swapsAnalytics);
    }
    else if (sectionId === "profile-listings-content") {
      titleHeading.textContent = "My Listings";
      const listingAnalytics = createListingAnalytics(listings);
      currentAnalytics.replaceWith(listingAnalytics);
    }
  }

  const buttons = {
    "profile-user-info-content": document.getElementById("profile-user-info-btn"),
    "profile-listings-content": document.getElementById("profile-listings-btn"),
    "profile-bids-content": document.getElementById("profile-bids-btn"),
    "profile-swaps-content": document.getElementById("profile-swaps-btn")
  };

  function showContent(id) {

    contents.forEach(c => {
      if (c.id === id) {
        c.style.display = (id === "profile-user-info-content") ? "flex" : "block";
      } else {
        c.style.display = "none";
      }
    });

    updateTitleForSection(id);

    Object.values(buttons).forEach(btn => btn.classList.remove("active"));
    buttons[id].classList.add("active");
  }

  showContent("profile-listings-content");

  Object.entries(buttons).forEach(([sectionId, btn]) => {
    btn.onclick = () => showContent(sectionId);
  });

  // ---------------- RENDERING & FILTERING OF ITEMS ----------------

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

    if (section === "listings") {
      updateTitleForSection("profile-listings-content");
    }
  }

  function applyFilter(type, value, section) {
    const currentFilters = sectionFilters[section];

    type = type.toLowerCase();

    if (type === "Category" && value === "All Categories") {
      currentFilters.Category = null;
    } else if (type === "category") {
      currentFilters.Category = value;
    } else if (type === "mode" && value.toLowerCase() === "all") {
      currentFilters.Mode = null;
    } else if (type === "mode") {
      currentFilters.Mode = value;
    } else if (type === "status" && value.toLowerCase() === "all") {
      currentFilters.Status = null;
    } else if (type === "status") {
      currentFilters.Status = value;
    }

    let data = [];
    if (section === "listings") data = listings;
    else if (section === "bids") data = winningBids;
    else if (section === "swaps") data = swappedItems;

    const filtered = data.filter(item => {
      return (
        (!currentFilters.Category || item.category.toLowerCase() === currentFilters.Category.toLowerCase()) &&
        (!currentFilters.Mode || item.mode.toLowerCase() === currentFilters.Mode.toLowerCase()) &&
        (!currentFilters.Status || item.status.toLowerCase() === currentFilters.Status.toLowerCase())
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
  const showAllBtns = document.querySelectorAll(".show-all");
  const subDropDownItems = document.querySelectorAll(".sub-dropdown .dropDown-item");

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

  subDropDownItems.forEach(item => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedText = item.textContent.trim();
      const filterType = item
        .closest(".dropdown-section")
        .querySelector(".dropDown-header")
        .textContent.trim()
        .toLowerCase();

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

  //Edit Overlay
  const editOverlay = document.querySelector(".edit-overlay");
  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-btn");
    if (editButton) {
      const itemId = editButton.getAttribute("data-id");
      if (!itemId) {
        alert("Item ID not found.");
        return;
      }

      fetchItemData(itemId);
      editOverlay.classList.add("active");
    }
  });

  document.querySelector(".form-container").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }

    // Detect changes in fields
    const fields = ['item-name', 'category', 'description', 'start-price', 'end-date'];
    let changed = fields.some(id => {
      const input = document.getElementById(id);
      return input && input.value !== input.dataset.original;
    });

    // Detect changes in images
    const originalImages = JSON.parse(document.getElementById('image-container').dataset.originalImages || '[]');
    if (images.length !== originalImages.length || removedImages.length > 0 || newFiles.length > 0) {
      changed = true;
    }

    if (!changed) {
      alert("No changes detected.");
      document.querySelector(".edit-overlay").classList.remove("active");
      return;
    }

    const formData = new FormData(this);

    // Append removed images (URLs to delete from DB)
    formData.append('removed_images', JSON.stringify(removedImages));

    // Append new files
    newFiles.forEach((file, i) => {
      formData.append('images[]', file, file.name);
    });

    // Append remaining existing images
    const existingImages = images.filter(src => typeof src === 'string' && !src.startsWith('data:'));
    formData.append('existing_images', JSON.stringify(existingImages));

    fetch("../server/item/update_item.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Item updated!");
          document.querySelector(".edit-overlay").classList.remove("active");
          removedImages = [];
          newFiles = [];
        } else {
          alert("Update failed: " + data.message);
        }
      })
      .catch(err => console.error(err));
  });

  const editCancelButton = document.querySelector(".edit-cancel-btn");
  editCancelButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const inputs = document.querySelectorAll(".form-container input, .form-container textarea, .form-container select");
    inputs.forEach(input => {
      if (input.dataset.original !== undefined) {
        input.value = input.dataset.original;
      }
    });

    const imageContainer = document.getElementById('image-container');
    if (imageContainer.dataset.originalImages) {
      const originalImages = JSON.parse(imageContainer.dataset.originalImages);

      images = [...originalImages];
      newFiles = [];
      removedImages = [];

      renderImages();
    }
    editOverlay.classList.remove("active");
  });

  function fetchItemData(itemId) {
    fetch(`../server/item/get_item_single.php?id=${itemId}`)
      .then(response => response.json())
      .then(data => {
        populateForm(data);
      })
      .catch(error => console.error("Error fetching item data:", error));
  }

  let images = [];
  let removedImages = [];
  let newFiles = [];

  function populateForm(data) {
    const item = data.item;
    const bid = data.bid;
    const existingImages = Array.isArray(data.images) ? data.images : [];
    const categories = data.categories || [];
    const statusDisplayDiv = document.getElementById('status-display');
    const statusClass = getStatusClass(item.status);

    images = [
      ...existingImages,
      ...images.filter(img => img instanceof File)
    ];

    removedImages = [];
    // newFiles = [];

    const imageContainer = document.getElementById('image-container');
    imageContainer.dataset.originalImages = JSON.stringify(existingImages);
    renderImages();

    // Inputs
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const statusHiddenInput = document.getElementById('status-hidden');
    const startPriceInput = document.getElementById('start-price');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const modeFieldH3 = document.querySelector('.mode-field h3');
    const itemTypeInput = document.getElementById('item-type');
    itemTypeInput.value = item.item_type || '';

    // Set values
    itemIdInput.value = item.item_id;
    itemNameInput.value = item.title;
    categoryInput.value = item.category_type;
    descriptionInput.value = item.description;
    statusDisplayDiv.textContent = item.status;
    statusDisplayDiv.className = `status-display ${statusClass}`;
    statusHiddenInput.value = item.status;

    const isSwap = item.item_type?.toLowerCase() === "swap";
    if (modeFieldH3) {
      modeFieldH3.textContent = isSwap ? "Swap" : "Bid";
    }

    const priceFieldSection = document.querySelector('.price-field');
    if (priceFieldSection) {
      if (isSwap) {
        priceFieldSection.style.display = 'none';

        startPriceInput.required = false;
        endDateInput.required = false;

        startPriceInput.disabled = true;
        startDateInput.disabled = true;
        endDateInput.disabled = true;

      } else {
        priceFieldSection.style.display = 'flex';

        startPriceInput.required = true;
        endDateInput.required = true;

        startPriceInput.disabled = false;
        startDateInput.disabled = false;
        endDateInput.disabled = false;

        startPriceInput.value = bid ? bid.starting_price : 0;
        startDateInput.value = bid ? formatDateTimeLocal(bid.start_date) : formatDateTimeLocal(new Date());
        startDateInput.readOnly = true;
        endDateInput.value = bid ? formatDateTimeLocal(bid.end_date) : '';
      }
    }

    categoryInput.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      if (cat === item.category_type) option.selected = true;
      categoryInput.appendChild(option);
    });

    // Store original values for reset
    itemIdInput.dataset.original = itemIdInput.value;
    itemNameInput.dataset.original = itemNameInput.value;
    categoryInput.dataset.original = categoryInput.options[categoryInput.selectedIndex].value;
    descriptionInput.dataset.original = descriptionInput.value;
    statusDisplayDiv.dataset.original = statusDisplayDiv.textContent;
    statusHiddenInput.dataset.original = statusHiddenInput.value;
    startPriceInput.dataset.original = startPriceInput.value;
    startDateInput.dataset.original = startDateInput.value;
    endDateInput.dataset.original = endDateInput.value;
  }

  // Render images (existing + new)
  function renderImages() {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';

    images.forEach((img, index) => {
      const div = document.createElement('div');
      div.classList.add('image-preview');

      const imgSrc = img instanceof File
        ? URL.createObjectURL(img)
        : `../server/item/${img}`;

      div.innerHTML = `
            <img src="${imgSrc}" alt="">
            <button class="remove-btn">&times;</button>
        `;

      div.querySelector('.remove-btn').addEventListener('click', () => {
        if (img instanceof File) {
          const fileIndex = newFiles.indexOf(img);
          if (fileIndex > -1) newFiles.splice(fileIndex, 1);
        } else {
          removedImages.push(img);
        }
        images.splice(index, 1);
        renderImages();
      });
      imageContainer.appendChild(div);
    });
  }

  document.getElementById('image-upload').addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
      images.push(file);   
      newFiles.push(file); 
    });

    renderImages();   
    event.target.value = ''; 
  });

  function formatDateTimeLocal(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d)) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});