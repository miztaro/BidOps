document.addEventListener("DOMContentLoaded", function () {
    loadHeaderAndWatch();
});

function loadHeaderAndWatch() {
    const headerContainer = document.getElementById("header");

    // 1. Load Header normally
    fetch("header.html")
        .then(res => res.text())
        .then(data => {
            if(headerContainer) {
                headerContainer.innerHTML = data;
                initLogic();
            }
        })
        .catch(console.error);

    if (headerContainer) {
        const observer = new MutationObserver((mutations) => {
            // If the header HTML was wiped/changed, re-apply our logic
            initLogic();
        });
        observer.observe(headerContainer, { childList: true });
    }
}

function initLogic() {
    initHeaderClicks();
    ensureHeaderUserData();
}

function initHeaderClicks() {
    const logo = document.getElementById("header-logo");
    if (logo) {
        logo.parentElement.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "homepage.html";
        });
    }
    // Note: The <a> tag around the profile icon handles the click automatically
}

async function ensureHeaderUserData() {
    let userInfo = JSON.parse(localStorage.getItem("userInfo"));

    // If no user info, try to fetch it
    if (!userInfo) {
        try {
            const response = await fetch("../server/user/get_user_info.php", {
                method: "GET",
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                userInfo = {
                    user_id: data.user.user_id,
                    username: data.user.username,
                    email: data.user.email
                };
                localStorage.setItem("userInfo", JSON.stringify(userInfo));
            }
        } catch (e) {
            console.error("Header: Fetch failed", e);
        }
    }

    // Apply Avatar if we have data
    if (userInfo && userInfo.username) {
        applyHeaderAvatar(userInfo.username);
    }
}

function applyHeaderAvatar(username) {
    // Generate Avatar
    const size = 100;
    const letter = username.charAt(0).toUpperCase();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 65%, 45%)`;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, size / 2, size / 2 + (size * 0.08));

    const avatarUrl = canvas.toDataURL("image/png");

    // Apply to Image Tag

    const headerImg = document.getElementById("user-header-profile-icon");
    if (headerImg) {
        headerImg.src = avatarUrl;
    }
}