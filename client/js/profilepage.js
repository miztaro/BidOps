import { loadTransactions } from "./transactions.js";
import { loadRatings } from "./feedbacks.js";

document.addEventListener('DOMContentLoaded', function () {
  // --- 1. SYSTEM CLOCK LOGIC ---
  // Updates a clock element every second to show the current local time
  setInterval(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const timerElement = document.getElementById("profile-current-time");
    if (timerElement) timerElement.textContent = timeString;
  }, 1000);

  // --- 2. HEADER & FOOTER LOADING ---
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
      if (backHomeBtn) {
        backHomeBtn.addEventListener("click", () => {
          window.location.href = "homepage.html";
        });
      }
    })
    .catch(error => console.error("Error loading header:", error));

  fetch('footer.html')
    .then(res => res.text())
    .then(html => document.getElementById('footer').innerHTML = html)
    .catch(err => console.error('Error loading footer:', err));

  // --- 3. USER PROFILE DATA & FUNCTIONS ---
  async function fetchUserInfo() {
    try {
      const response = await fetch("../server/user/get_user_info.php", {
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
      const response = await fetch("../server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_username", new_username: newUsername }),
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
    }
  }

  async function changePassword() {
    const newPassword = prompt("Enter your new password: ");
    if (!newPassword) return alert("Password cannot be empty.");
    try {
      const response = await fetch("../server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", new_password: newPassword }),
      });
      const data = await response.json();
      if (data.success) alert("Password updated successfully!");
      else alert("Failed to update password: " + data.message);
    } catch (error) {
      console.error("Error updating password: ", error);
    }
  }

  async function deleteAccount() {
    const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    try {
      const response = await fetch("../server/user/update_user_info.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_account" }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Account deleted successfully!");
        localStorage.clear();
        window.location.href = 'login.html';
      } else {
        alert("Failed to delete account: " + data.message);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
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
      localStorage.clear();
      window.location.href = 'login.html';
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out.");
    }
  }

  document.querySelector("#user-name-container .edit-icon")?.addEventListener("click", changeUsername);
  document.getElementById("change-pass-btn")?.addEventListener("click", changePassword);
  document.getElementById("delete-btn")?.addEventListener("click", deleteAccount);
  document.getElementById("sign-out-btn")?.addEventListener("click", signOutUser);
  fetchUserInfo();

  // --- 4. LISTINGS DATA & FUNCTIONS (With Timer Support) ---
  let listings = [];
  const bidBtn = document.getElementById("filter-bid-btn");
  const swapBtn = document.getElementById("filter-swap-btn");
  const tbody = document.querySelector("#profile-listings-content table tbody");
  let currentMode;

  function startProfileCountdowns() {
    const timers = document.querySelectorAll('.profile-countdown');
    if (timers.length === 0) return;

    if (window.profileTimerInterval) clearInterval(window.profileTimerInterval);

    window.profileTimerInterval = setInterval(() => {
      timers.forEach(timer => {
        const endDateTime = new Date(timer.dataset.endtime).getTime();
        const now = new Date().getTime();
        const distance = endDateTime - now;

        if (distance < 0) {
          timer.innerHTML = "<span style='color: #e74c3c; font-weight: bold;'>Auction Ended</span>";
          return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        timer.textContent = `${d}d ${h}h ${m}m ${s}s`;
      });
    }, 1000);
  }

  function fetchListings() {
    fetch('../server/item/get_items.php', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (!data.listings) return;

        listings = data.listings.map(item => ({
          id: item.item_id,
          item: item.title,
          category: item.category_type,
          mode: item.item_type,
          dateListed: item.created_date,
          endDate: item.end_date, // Ensure server provides this for bidding
          status: item.status,
        }));

        currentMode = listings.length > 0 ? listings[0].mode : 'bid';
        renderListings(currentMode);
        setupToggleButtons();

        if (currentMode === 'bid') {
          bidBtn?.classList.add("active");
          swapBtn?.classList.remove("active");
        } else {
          swapBtn?.classList.add("active");
          bidBtn?.classList.remove("active");
        }

        const listingsBtnCounter = document.querySelector("#profile-listings-btn p");
        if (listingsBtnCounter) listingsBtnCounter.textContent = `${listings.length} ${listings.length === 1 ? "Item" : "Items"}`;
      })
      .catch(error => console.error("Error loading listings: ", error));
  }

  function createListingRow(listing) {
    const row = document.createElement("tr");
    row.classList.add("listings-body-row");
    row.setAttribute("id", `listing-row-${listing.id}`);

    let timeColumnContent = listing.dateListed;
    // If it's an active bid with an end date, show the countdown
    if (listing.mode.toLowerCase() === 'bid' && listing.status.toLowerCase() === 'active' && listing.endDate) {
      timeColumnContent = `<div class="profile-countdown" data-endtime="${listing.endDate}">Calculating...</div>`;
    }

    row.innerHTML = `
      <td class="item">${listing.item}</td>
      <td>${listing.category}</td>
      <td>${listing.mode}</td>
      <td>${timeColumnContent}</td>
      <td><div class="status ${getStatusClass(listing.status)}">${listing.status}</div></td>
      <td>
        <div class="actions-container">
          <button class="lists-view-btn" 
            onclick="${listing.mode.toLowerCase() === 'swap' ? `window.openSwapModal(${listing.id})` : ''}"
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

  function renderListings(mode) {
    if(!tbody) return;
    tbody.innerHTML = '';
    const filtered = listings.filter(item => item.mode.toLowerCase() === mode.toLowerCase());

    if (filtered.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="6" style="text-align:center;">No ${mode} listings available</td>`;
      tbody.appendChild(row);
    } else {
      filtered.forEach(listing => {
        tbody.appendChild(createListingRow(listing));
      });
      startProfileCountdowns(); // Start timers after rendering rows
    }
  }

  function toggleView(viewType) {
    currentMode = viewType;
    if (viewType === 'bid') {
      bidBtn?.classList.add("active");
      swapBtn?.classList.remove("active");
    } else {
      swapBtn?.classList.add("active");
      bidBtn?.classList.remove("active");
    }
    renderListings(viewType);
  }

  function setupToggleButtons() {
    bidBtn?.addEventListener("click", () => toggleView('bid'));
    swapBtn?.addEventListener("click", () => toggleView('swap'));
  }

  fetchListings();

  // --- 5. WINNING BIDS DATA & FUNCTIONS --- 
  let winningBids = [];
  function fetchWinningBids() {
    fetch('../server/item/get_transactions.php', {
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
          if (bidsBtnCounter) bidsBtnCounter.textContent = `${winningBids.length} ${winningBids.length === 1 ? "Item" : "Items"}`;
        }
      })
      .catch(error => console.error('Fetch error:', error));
  }

  function createWinningBidRow(bid) {
    const row = document.createElement("tr");
    row.classList.add("bids-body-row");
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

  function createBidsAnalytics(bids) {
    const analytics = document.createElement("div");
    analytics.classList.add("analytics");
    analytics.innerHTML = `<div class="total-items"><h6>${bids.length}</h6><p>${bids.length === 1 ? 'Item' : 'Items'}</p></div>`;
    return analytics;
  }

  fetchWinningBids();

  // --- 6. SWAPPED ITEMS DATA & FUNCTIONS ---
  let swappedItems = [];
  function fetchSwappedItems() {
    fetch('../server/item/get_transactions.php', {
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
          if (swapsBtnCounter) swapsBtnCounter.textContent = `${swappedItems.length} ${swappedItems.length === 1 ? "Item" : "Items"}`;
        }
      })
      .catch(error => console.error('Fetch error:', error));
  }

  function createSwappedRow(swap) {
    const row = document.createElement("tr");
    row.classList.add("swaps-body-row");
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

  function createSwapsAnalytics(swaps) {
    const analytics = document.createElement("div");
    analytics.classList.add("analytics");
    analytics.innerHTML = `<div class="total-items"><h6>${swaps.length}</h6><p>${swaps.length === 1 ? 'Item' : 'Items'}</p></div>`;
    return analytics;
  }

  fetchSwappedItems();

  // --- 7. TITLE & SECTION HANDLING ---
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
      currentAnalytics.replaceWith(createBidsAnalytics(winningBids));
    }
    else if (sectionId === "profile-swaps-content") {
      titleHeading.textContent = "My Swaps";
      currentAnalytics.replaceWith(createSwapsAnalytics(swappedItems));
    }
    else if (sectionId === "profile-listings-content") {
      titleHeading.textContent = "My Listings";
      currentAnalytics.replaceWith(createListingAnalytics(listings));
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
    Object.values(buttons).forEach(btn => btn?.classList.remove("active"));
    buttons[id]?.classList.add("active");

    if (id === "profile-transactions-content") loadTransactions();
    else if (id === "profile-feedback-content") loadRatings();
  }

  showContent("profile-user-info-content");
  Object.entries(buttons).forEach(([sectionId, btn]) => {
    btn?.addEventListener("click", () => showContent(sectionId));
  });

  // --- 8. RENDERING OF ITEMS ---
  function renderItems(itemsArray, section) {
    const listingBody = document.querySelector(".profile-listings-content tbody");
    const bidsBody = document.querySelector(".profile-bids-content tbody");
    const swapsBody = document.querySelector(".profile-swaps-content tbody");

    if (section === "listings" && listingBody) {
      listingBody.innerHTML = "";
      itemsArray.forEach(item => listingBody.appendChild(createListingRow(item)));
    } else if (section === "bids" && bidsBody) {
      bidsBody.innerHTML = "";
      itemsArray.forEach(item => bidsBody.appendChild(createWinningBidRow(item)));
    } else if (section === "swaps" && swapsBody) {
      swapsBody.innerHTML = "";
      itemsArray.forEach(item => swapsBody.appendChild(createSwappedRow(item)));
    }
  }
});

// --- GLOBAL MODAL LOGIC FOR SWAPS ---
let currentSwapItemId = null;

function closeSwapModal() {
  const modal = document.getElementById("swap-modal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = 'auto';
  }
}

const swapModalClose = document.getElementById('swap-modal-close');
const swapModalOverlay = document.getElementById('swap-modal-overlay');

if (swapModalClose) swapModalClose.addEventListener('click', closeSwapModal);
if (swapModalOverlay) {
  swapModalOverlay.addEventListener('click', function (event) {
    if (event.target === this) closeSwapModal();
  });
}

function openSwapModal(id) {
  const modal = document.getElementById("swap-modal");
  if (!modal) return;
  currentSwapItemId = id;
  modal.style.display = "flex";
  document.body.style.overflow = 'hidden';
  document.getElementById("swap-modal-body").innerHTML = `<p style="text-align:center; padding:20px;">Loading swap details...</p>`;
  fetchSwapOffers(id);
}

document.getElementById("closeSwapModal")?.addEventListener("click", closeSwapModal);

function fetchSwapOffers(itemId) {
  fetch(`../server/item/get_seller_swap_offers.php?item_id=${itemId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) populateSwapModal(data);
      else alert('Error: ' + data.message);
    })
    .catch(() => alert('Failed to load swap offers'));
}

function populateSwapModal(data) {
  const item = data.item;
  const images = data.images;
  const offers = data.swap_offers;

  document.getElementById('swap-item-title').textContent = item.title;
  document.getElementById('swap-item-category').textContent = item.category_type;
  document.getElementById('swap-item-description').textContent = item.description || 'No description.';

  if (images.length > 0) {
    const mainImage = document.getElementById('swap-main-image');
    mainImage.src = `../server/item/${images[0].file_path}`;
    const thumbnailContainer = document.getElementById('swap-thumbnails');
    thumbnailContainer.innerHTML = '';
    images.forEach((img, index) => {
      const thumb = document.createElement('img');
      thumb.src = `../server/item/${img.file_path}`;
      if (index === 0) thumb.classList.add('active');
      thumb.addEventListener('click', () => {
        mainImage.src = thumb.src;
        thumbnailContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbnailContainer.appendChild(thumb);
    });
  }

  const offersList = document.getElementById('swap-offers-list');
  const totalOffersEl = document.getElementById('total-swap-offers');
  totalOffersEl.textContent = `${offers.length} Offer${offers.length !== 1 ? 's' : ''}`;

  if (offers.length === 0) {
    offersList.innerHTML = `<div class="swap-empty-state"><iconify-icon icon="ph:swap-bold"></iconify-icon><h4>No swap offers yet</h4></div>`;
  } else {
    offersList.innerHTML = '';
    offers.forEach(offer => offersList.appendChild(createSwapOfferCard(offer)));
  }
}

function createSwapOfferCard(offer) {
  const card = document.createElement('div');
  card.classList.add('swap-offer-card');
  const initials = offer.offerer_name.charAt(0).toUpperCase();
  const offerImage = offer.offered_item_images?.length > 0 ? `../server/item/${offer.offered_item_images[0].file_path}` : '../assets/images/placeholder.jpg';

  let actionsHTML = '';
  if (offer.swap_status === 'pending') {
    actionsHTML = `<div class="swap-offer-actions">
        <button class="btn-swap-accept" onclick="handleSwapAction(${offer.swap_id}, 'accept')"><iconify-icon icon="material-symbols:check-circle"></iconify-icon> Accept</button>
        <button class="btn-swap-decline" onclick="handleSwapAction(${offer.swap_id}, 'decline')"><iconify-icon icon="material-symbols:cancel"></iconify-icon> Decline</button>
      </div>`;
  } else {
    const statusText = offer.swap_status === 'completed' ? '✓ Accepted' : '✗ Declined';
    actionsHTML = `<span class="swap-status-badge-small">${statusText}</span>`;
  }

  card.innerHTML = `
    <div class="swap-offer-header"><div class="offerer-info"><div class="offerer-avatar">${initials}</div><div><h4>${offer.offerer_name}</h4><p>${offer.time_ago}</p></div></div></div>
    <div class="swap-offer-body">
      <div class="offered-item-image"><img src="${offerImage}"></div>
      <div class="offered-item-info"><h3>${offer.offered_item_title}</h3><p>${offer.offered_item_category}</p></div>
    </div>${actionsHTML}`;
  return card;
}

window.handleSwapAction = function (swapId, action) {
  if (!confirm(`Are you sure you want to ${action} this swap?`)) return;
  fetch('../server/item/manage_swap.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ swap_id: swapId, action: action })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);
        fetchSwapOffers(currentSwapItemId);
      } else alert('Error: ' + data.message);
    });
};

window.openSwapModal = openSwapModal;