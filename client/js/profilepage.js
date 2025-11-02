const contents = document.querySelectorAll(
  "#profile-user-info-content, #profile-listings-content, #profile-bids-content, #profile-swaps-content"
);

function showContent(id) {
  contents.forEach(c => c.style.display = c.id === id ? "block" : "none");
}

showContent("profile-listings-content");

document.getElementById("profile-user-info-btn").onclick = () => showContent("profile-user-info-content");
document.getElementById("profile-listings-btn").onclick = () => showContent("profile-listings-content");
document.getElementById("profile-bids-btn").onclick = () => showContent("profile-bids-content");
document.getElementById("profile-swaps-btn").onclick = () => showContent("profile-swaps-content");

//Change/remove this if there is server/backend manipulation of database
const listings = [
    {id: 1,item: "Law Book",category: "Law",mode: "Swap",dateListed: "09 / 16 / 2025",status: "Active"},
    {id: 2,item: "Architecture Book",category: "Architecture",mode: "Bid",dateListed: "09 / 16 / 2025",status: "Pending"},
    {id: 2,item: "Calculator",category:"General Education",mode: "Bid",dateListed: "09 / 16 / 2025",status: "Completed"}
];

function createListingRow(listing){
    const row = document.createElement("tr");
    row.classList.add("body-row");
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

function calculateStats(listings){
    return{
        total: listings.length,
        active: listings.filter(l => l.status === "Active").length,
        pending: listings.filter(l =>l.status === "Pending").length,
        completed: listings.filter(l => l.status === "Completed").length,
    };
}

const tbody = document.querySelector(".listings-content tbody");
listings.forEach(listing => {
    const row = createListingRow(listing);
    tbody.appendChild(row);
});

function createListingAnalytics(listings){
    const stats = calculateStats(listings);

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

const analyticsSection = createListingAnalytics(listings);
document.querySelector(".title-container").appendChild(analyticsSection);