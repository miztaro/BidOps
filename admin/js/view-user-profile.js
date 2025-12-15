// view-user-profile.js

// 1. Core Function to Open the Modal
async function openUserProfileModal(userId) {
    const modal = document.getElementById('user-profile-view-modal');
    if (!modal) return console.error("User Profile Modal HTML missing!");

    // Reset fields
    document.getElementById('view-user-name').textContent = "Loading...";
    document.getElementById('view-user-avatar').src = "";
    modal.style.display = "flex";

    try {
        // DETECT ENVIRONMENT (Admin Node vs Client PHP)
        // Adjust this logic based on your folder structure
        let apiUrl = '';
        if (window.location.pathname.includes('admin') || window.location.port === '3000') {
            // Node.js Admin Side
            apiUrl = `/api/user/${userId}`; 
        } else {
            // PHP Client Side
            apiUrl = `../server/user/get_public_profile.php?user_id=${userId}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success || data.user) {
            const user = data.user || data; // Handle different API response structures
            populateUserProfile(user);
        } else {
            alert("User not found.");
            modal.style.display = "none";
        }

    } catch (error) {
        console.error("Error fetching user profile:", error);
        document.getElementById('view-user-name').textContent = "Error loading user";
    }
}

// 2. Populate Data & Generate Avatar
function populateUserProfile(user) {
    // Text Fields
    document.getElementById('view-user-name').textContent = user.username;
    document.getElementById('view-user-id').textContent = user.user_id;
    document.getElementById('view-user-email').textContent = user.email;
    
    const statusEl = document.getElementById('view-user-status');
    if (statusEl) {
        statusEl.textContent = user.is_banned == 1 ? "Banned" : "Active";
        statusEl.style.color = user.is_banned == 1 ? "red" : "green";
    }

    // --- AVATAR GENERATION LOGIC (From profilepage.js) ---
    const avatarImg = document.getElementById('view-user-avatar');
    
    // Check if user has a custom uploaded image, else generate it
    if (user.profile_pic && user.profile_pic !== "") {
        // Adjust path based on environment
        const basePath = window.location.port === '3000' ? '/server/item/' : '../server/item/';
        avatarImg.src = basePath + user.profile_pic;
    } else {
        // Generate Colorful Initials
        avatarImg.src = generateUserCanvas(user.username);
    }

    // --- REPORT BUTTON LOGIC ---
    // Check if current viewer is a 'user' (Client Side)
    const reportBtn = document.getElementById('btn-report-user');
    const role = localStorage.getItem('role'); // Assumes 'user' or 'admin' is stored here
    
    // Show report button ONLY if role is 'user' AND they are not viewing themselves
    const currentUserId = JSON.parse(localStorage.getItem('userInfo'))?.user_id;
    
    if (role === 'user' && user.user_id !== currentUserId) {
        reportBtn.style.display = 'flex';
        reportBtn.onclick = () => {
            // Redirect to report page or open report modal
            // Assuming you have a generic openReportModal function or page
            if (typeof openReportModal === 'function') {
                document.getElementById('user-profile-view-modal').style.display = 'none';
                openReportModal(user.user_id, 'user'); 
            } else {
                alert(`Reporting functionality for user ${user.username}`);
            }
        };
    } else {
        reportBtn.style.display = 'none';
    }
}

// 3. Avatar Generator (Canvas Logic)
function generateUserCanvas(username) {
    if (!username) return null;
    const size = 200; // Resolution
    const letter = username.charAt(0).toUpperCase();
    
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Background Color
    ctx.fillStyle = stringToHslColor(username);
    ctx.fillRect(0, 0, size, size);

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, size / 2, size / 2 + (size * 0.05));

    return canvas.toDataURL("image/png");
}

// 4. Color Generator Helper
function stringToHslColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 65%, 45%)`;
}

// 5. Close Modal Events
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('user-profile-view-modal');
    const closeBtn = document.getElementById('close-user-view');
    const closeBtn2 = document.getElementById('btn-close-user-view');

    const closeModal = () => { if(modal) modal.style.display = 'none'; };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
});

// Make globally available
window.viewUserProfile = openUserProfileModal;