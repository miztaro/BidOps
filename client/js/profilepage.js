import { loadTransactions } from "./transactions";
import { loadRatings } from "./feedbacks";
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

  fetch('footer.html')
    .then(res => res.text())
    .then(html => document.getElementById('footer').innerHTML = html)
    .catch(err => console.error('Error loading footer:', err));

  //User Profile Data & Functions
  async function fetchUserInfo() {
    try {
      const response = await fetch("/bidops/server/user/get_user_info.php", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Failed to fetch user info:", data.message);
        return data;
      }

      const userInfo = {
        user_id: data.user.user_id,
        username: data.user.username,
        email: data.user.email
      };

      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      localStorage.setItem("role", "user");

      displayUserInfo(userInfo);
      displayUserProfileButton(userInfo);
      applyUserAvatar(userInfo.username);

    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  }

  function displayUserInfo() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (!userInfo) {
      console.log("No logged-in user found.");
      return;
    }

    document.getElementById("user-name").textContent = userInfo.username;
    document.getElementById("user-id-placeHolder").textContent = userInfo.user_id;
    document.getElementById("user-email-placeHolder").textContent = userInfo.email;
  }

  function displayUserProfileButton(user) {
    const profileBtn = document.getElementById("profile-user-info-btn");
    if (!profileBtn) return;

    const h6 = profileBtn.querySelector(".user-info h6");
    const p = profileBtn.querySelector(".user-info p");

    if (h6) h6.textContent = user.username;
    if (p) p.textContent = user.user_id;
  }

  function generateProfilePicture(username, size = 300) {
    if (!username) return null;

    const letter = username.charAt(0).toUpperCase();

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = stringToColor(username);
    ctx.fillRect(0, 0, size, size);

    const fontSize = size * 0.5;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const yOffset = fontSize * 0.08;
    ctx.fillText(letter, size / 2, size / 2 + yOffset);

    return canvas.toDataURL("image/png");
  }

  function applyUserAvatar(username) {
    const avatar = generateProfilePicture(username);

    if (!avatar) return;

    const mainImg = document.getElementById("profilePicture");
    if (mainImg) mainImg.src = avatar;

    const thumbImg = document.querySelector("#profile-user-info-btn .profile-avatar");
    if (thumbImg) thumbImg.src = avatar;
  }

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 65%, 45%)`;
  }

  async function changeUsername() {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) return alert("No logged-in user found.");

    const newUsername = prompt("Enter your new username:", userInfo.username);
    if (!newUsername) return alert("Username cannot be empty.");

    try {
      const response = await fetch("/bidops/server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "change_username",
          new_username: newUsername
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Username updated successfully!");
        userInfo.username = newUsername;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        displayUserInfo();
        displayUserProfileButton(userInfo);
      } else {
        alert("Failed to update username: " + data.message);
      }
    } catch (error) {
      console.error("Error updating username: ", error);
      alert("Error updating username. See console for details.");
    }
  }

  async function changePassword() {
    const newPassword = prompt("Enter your new password: ");
    if (!newPassword) return alert("Password cannot be empty.");

    try {
      const response = await fetch("/bidops/server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "change_password",
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Password updated successfully!");
      } else {
        alert("Failed to update password: " + data.message);
      }
    } catch (error) {
      console.error("Error updating password: ", error);
      alert("Error updating password. See console for details.");
    }
  }

  async function deleteAccount() {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const response = await fetch("/bidops/server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_account",
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert("Account deleted successfully!");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("role");
        window.location.href = 'login.html';
      } else {
        alert("Failed to delete account: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting account: " + data.message);
      alert("Error deleting account.See console for details");
    }
  }

  async function signOutUser() {
    const confirmed = confirm("Sign Out?");
    if (!confirmed) return;

    try {
      const response = await fetch('../server/auth/logout.php', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Logout request failed: ${response.status}`);
      }

      localStorage.clear();
      window.location.href = 'login.html';
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. See console for details.");
    }
  }

  document.querySelector("#user-name-container .edit-icon")?.addEventListener("click", changeUsername);
  document.getElementById("change-pass-btn")?.addEventListener("click", changePassword);
  document.getElementById("delete-btn")?.addEventListener("click", deleteAccount);
  document.getElementById("sign-out-btn")?.addEventListener("click", signOutUser);
  fetchUserInfo();
  //End of User Info Data & Functions

  //Listings Data & Functions
  let listings = [];
  function fetchListings() {
    fetch('/bidops/server/item/get_items.php', {
      method: 'GET',
      credentials: 'include'
    })
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
        const listingsBtnCounter = document.querySelector("#profile-listings-btn p");
        if (listingsBtnCounter) listingsBtnCounter.textContent = `${listings.length} Items`;

        if (data.categories) {
          const categoryDropdown = document.getElementById("categoryDropdown");
          categoryDropdown.innerHTML = `<p class="dropDown-item">All Categories</p>`; // reset

          data.categories.forEach(cat => {
            const p = document.createElement("p");
            p.className = "dropDown-item";
            p.textContent = cat;
            categoryDropdown.appendChild(p);
          });
          attachDropDownItemListeners();
        }
      })
      .catch(error => console.error("Error loading listings: ", error));
  }

  function createListingRow(listing) {
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

  function getStatusClass(status) {
    status = status.toLowerCase();
    if (status.includes("active")) return "active-items";
    if (status.includes("pending")) return "pending-items";
    if (status.includes("rejected")) return "rejected-items";
    if (status.includes("sold")) return "sold-items";
    return "";
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
      <div class="total-items"><h6>${stats.total}</h6><p>${stats.total === 1 ? 'Item' : 'Items'}</p></div>
      <div class="active-items"><h6>${stats.active}</h6><p>Active</p></div>
      <div class="pending-items"><h6>${stats.pending}</h6><p>Pending</p></div>
      <div class="rejected-items"><h6>${stats.rejected}</h6><p>Rejected</p></div>
      <div class="sold-items"><h6>${stats.sold}</h6><p>Sold</p></div>
    `;
    return analytics;
  }
  fetchListings();
  //End of Listings Data & Functions

  //Winning Bids Data & Functions 
  let winningBids = [];
  function fetchWinningBids() {
    fetch('/bidops/server/item/get_transactions.php', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          winningBids = data.bids.map(tr => {
            const item = tr.bidItem;
            return {
              bid_id: item.bid_id,
              item_id: item.item_id,
              item: item.item_name,
              category: item.category,
              description: item.description || '',
              winningBid: `P${parseFloat(item.winning_bid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
              dateWon: item.date_won ? new Date(item.date_won).toLocaleDateString() : '',
              vendor: item.vendor || '-'
            };
          });
          renderItems(winningBids, "bids");
          const bidsBtnCounter = document.querySelector("#profile-bids-btn p");
          if (bidsBtnCounter) bidsBtnCounter.textContent = `${winningBids.length} Items`;
        } else {
          console.error('Failed to fetch transactions:', data.message);
        }
      })
      .catch(error => console.error('Fetch error:', error));
  }

  function createWinningBidRow(bid) {
    const row = document.createElement("tr");
    row.classList.add("bids-body-row");
    row.setAttribute("id", `winning-bid-row-${bid.item_id}`);

    row.innerHTML = `
      <td class="item">${bid.item}</td>
      <td>${bid.category}</td>
      <td>${bid.winningBid}</td>
      <td>${bid.vendor}</td>
      <td>${bid.dateWon}</td>
      <td>
        <div class="actions-container">
          <button class="bids-view-btn" data-id="${bid.bid_id}">View</button>
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
      <div class="total-items"><h6>${stats.total}</h6><p>${stats.total === 1 ? 'Item' : 'Items'}</p></div>
    `;
    return analytics;
  }

  fetchWinningBids();
  //End of Winning Bids Data & Functions 

  // ---------------- SWAPPED ITEMS DATA & FUNCTIONS ----------------

  let swappedItems = [];
  function fetchSwappedItems() {
    fetch('/bidops/server/item/get_transactions.php', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          swappedItems = data.swaps.map(tr => {
            const item = tr.swappedItem;
            return {
              swap_id: item.swap_id,
              item_id: item.item_id,
              item: item.item_name,
              category: item.category,
              description: item.description || '',
              dateSwapped: item.completion_date ? new Date(item.completion_date).toLocaleDateString() : '',
              vendor: item.vendor || '-'
            };
          });
          renderItems(swappedItems, "swaps");
          const swapsBtnCounter = document.querySelector("#profile-swaps-btn p");
          if (swapsBtnCounter) swapsBtnCounter.textContent = `${swappedItems.length} Items`;
        } else {
          console.error('Failed to fetch transactions:', data.message);
        }
      })
      .catch(error => console.error('Fetch error:', error));
  }

  function createSwappedRow(swap) {
    const row = document.createElement("tr");
    row.classList.add("swaps-body-row");
    row.setAttribute("id", `swapped-item-row-${swap.item_id}`);

    row.innerHTML = `
      <td class="item">${swap.item}</td>
      <td>${swap.category}</td>
      <td>${swap.dateSwapped}</td>
      <td>${swap.vendor}</td>
      <td>
        <div class="actions-container">
          <button class="swaps-view-btn" data-id="${swap.swap_id}">View</button>
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
      <div class="total-items"><h6>${stats.total}</h6><p>${stats.total === 1 ? 'Item' : 'Items'}</p></div>
    `;
    return analytics;
  }
  fetchSwappedItems();
  //End of Swapped Items Data & Functions 

  // ---------------- TITLE & SECTION HANDLING ----------------

  function updateTitleForSection(sectionId) {
    const titleContainer = document.querySelector(".title-container");
    if (!titleContainer) return;
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
    } else {
      titleHeading.textContent = "";
    }
  }

  const buttons = {
    "profile-user-info-content": document.getElementById("profile-user-info-btn"),
    "profile-listings-content": document.getElementById("profile-listings-btn"),
    "profile-bids-content": document.getElementById("profile-bids-btn"),
    "profile-swaps-content": document.getElementById("profile-swaps-btn"),
    "profile-feedback-content": document.getElementById("profile-feedbacks-btn"),
    "profile-transactions-content": document.getElementById("profile-transactions-btn")
  };

  const contents = document.querySelectorAll(`
    #profile-user-info-content,
    #profile-listings-content,
    #profile-bids-content,
    #profile-swaps-content,
    #profile-feedback-content,
    #profile-transactions-content
  `);

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

    if (id === "profile-transactions-content") {
      loadTransactions();
    } else if (id === "profile-feedback-content"){
      loadRatings();
    }
  }

  showContent("profile-user-info-content");
  Object.entries(buttons).forEach(([sectionId, btn]) => {
    btn.addEventListener("click", () => showContent(sectionId));
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
      if (section === "listings" && listingBody) {
        const row = createListingRow(item);
        listingBody.appendChild(row);
      } else if (section === "bids" && bidsBody) {
        const row = createWinningBidRow(item);
        bidsBody.appendChild(row);
      } else if (section === "swaps" && swapsBody) {
        const row = createSwappedRow(item);
        swapsBody.appendChild(row);
      }
    });

    // if (section === "listings") {
    //   updateTitleForSection("profile-listings-content");
    // }
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

  function attachDropDownItemListeners() {
    document.querySelectorAll(".sub-dropdown .dropDown-item").forEach(item => {
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        const selectedText = item.textContent.trim();
        const filterType = item.closest(".dropdown-section")
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
  }

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

let currentSwapItemId = null;

// Close swap modal
const swapModalClose = document.getElementById('swap-modal-close');
const swapModalOverlay = document.getElementById('swap-modal-overlay');

if (swapModalClose) {
  swapModalClose.addEventListener('click', closeSwapModal);
}

if (swapModalOverlay) {
  swapModalOverlay.addEventListener('click', function (event) {
    if (event.target === this) {
      closeSwapModal();
    }
  });
}

function openSwapModal(id) {
  const modal = document.getElementById("swap-modal");

  if (!modal) {
    console.error("Swap modal not found!");
    return;
  }

  // Store current swap item ID
  currentSwapItemId = id;

  // Show modal
  modal.style.display = "flex";
  document.body.style.overflow = 'hidden';

  // Show loading state
  document.getElementById("swap-modal-body").innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <p>Loading swap details...</p>
    </div>
  `;

  // Fetch the swap offers
  fetchSwapOffers(id);
}


document.getElementById("closeSwapModal")?.addEventListener("click", () => {
  const modal = document.getElementById("swap-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = 'auto';
  }
});

function fetchSwapOffers(itemId) {
  console.log('Fetching swap offers for item:', itemId);

  fetch(`../server/item/get_seller_swap_offers.php?item_id=${itemId}`)
    .then(response => response.json())
    .then(data => {
      console.log('Swap offers data:', data);

      if (data.success) {
        populateSwapModal(data);
      } else {
        alert('Error loading swap offers: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error fetching swap offers:', error);
      alert('Failed to load swap offers');
    });
}

function populateSwapModal(data) {
  const item = data.item;
  const images = data.images;
  const offers = data.swap_offers;

  console.log('Populating swap modal with:', { item, images, offers });

  // Set your item details
  document.getElementById('swap-item-title').textContent = item.title;
  document.getElementById('swap-item-category').textContent = item.category_type;
  document.getElementById('swap-item-description').textContent = item.description || 'No description available.';

  // Set your item images
  if (images.length > 0) {
    const mainImage = document.getElementById('swap-main-image');
    mainImage.src = `../server/item/${images[0].file_path}`;

    const thumbnailContainer = document.getElementById('swap-thumbnails');
    thumbnailContainer.innerHTML = '';

    images.forEach((img, index) => {
      const thumb = document.createElement('img');
      thumb.src = `../server/item/${img.file_path}`;
      thumb.classList.add(index === 0 ? 'active' : '');
      thumb.addEventListener('click', () => {
        mainImage.src = thumb.src;
        thumbnailContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbnailContainer.appendChild(thumb);
    });
  }

  // Set swap offers
  const offersList = document.getElementById('swap-offers-list');
  const totalOffersEl = document.getElementById('total-swap-offers');

  totalOffersEl.textContent = `${offers.length} Offer${offers.length !== 1 ? 's' : ''}`;

  if (offers.length === 0) {
    offersList.innerHTML = `
            <div class="swap-empty-state">
                <iconify-icon icon="ph:swap-bold"></iconify-icon>
                <h4>No swap offers yet</h4>
                <p>When users offer items to swap, they'll appear here</p>
            </div>
        `;
  } else {
    offersList.innerHTML = '';
    offers.forEach(offer => {
      const offerCard = createSwapOfferCard(offer);
      offersList.appendChild(offerCard);
    });
  }
}

function createSwapOfferCard(offer) {
  const card = document.createElement('div');
  card.classList.add('swap-offer-card');

  const initials = offer.offerer_name.charAt(0).toUpperCase();

  const offerImage = offer.offered_item_images && offer.offered_item_images.length > 0
    ? `../server/item/${offer.offered_item_images[0].file_path}`
    : '../assets/images/placeholder.jpg';

  let actionsHTML = '';
  if (offer.swap_status === 'pending') {
    actionsHTML = `
            <div class="swap-offer-actions">
                <button class="btn-swap-accept" onclick="handleSwapAction(${offer.swap_id}, 'accept')">
                    <iconify-icon icon="material-symbols:check-circle" width="20" height="20"></iconify-icon>
                    Accept Swap
                </button>
                <button class="btn-swap-decline" onclick="handleSwapAction(${offer.swap_id}, 'decline')">
                    <iconify-icon icon="material-symbols:cancel" width="20" height="20"></iconify-icon>
                    Decline
                </button>
            </div>
        `;
  } else if (offer.swap_status === 'completed') {
    actionsHTML = '<span class="swap-status-badge-small accepted">✓ Swap Accepted</span>';
  } else if (offer.swap_status === 'cancelled') {
    actionsHTML = '<span class="swap-status-badge-small declined">✗ Declined</span>';
  }

  card.innerHTML = `
        <div class="swap-offer-header">
            <div class="offerer-info">
                <div class="offerer-avatar">${initials}</div>
                <div class="offerer-details">
                    <h4>${offer.offerer_name}</h4>
                    <p>${offer.time_ago}</p>
                </div>
            </div>
        </div>
        
        <div class="swap-offer-body">
            <div class="offered-item-image">
                <img src="${offerImage}" alt="${offer.offered_item_title || 'Offered Item'}">
            </div>
            <div class="offered-item-info">
                <h3>${offer.offered_item_title || 'User\'s Item'}</h3>
                <p class="offered-item-category">
                    <iconify-icon icon="material-symbols:category" width="16" height="16"></iconify-icon>
                    ${offer.offered_item_category || 'N/A'}
                </p>
                <p class="offered-item-description">${offer.offered_item_description || 'No description available'}</p>
            </div>
        </div>
        
        ${actionsHTML}
    `;

  return card;
}

// Handle Accept/Decline Swap Actions
window.handleSwapAction = function (swapId, action) {
  const confirmMessage = action === 'accept'
    ? 'Are you sure you want to accept this swap? Your item will be marked as swapped.'
    : 'Are you sure you want to decline this swap offer?';

  if (!confirm(confirmMessage)) return;

  fetch('../server/item/manage_swap.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      swap_id: swapId,
      action: action
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        // Refresh the modal and listings
        fetchSwapOffers(currentSwapItemId);
        if (typeof fetchListings === 'function') {
          fetchListings();
        }
      } else {
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to process swap action');
    });
};

// Make openSwapModal available globally
window.openSwapModal = openSwapModal;