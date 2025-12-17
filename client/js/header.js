/* 
   SAFE HEADER SCRIPT (Final Fixed Version)
   - Uses Event Delegation for Search (Fixes Message Page issues)
   - Uses IIFE for safety
*/
(() => {
    console.log("header.js loaded safely");

    // === 1. CONFIG & HELPERS ===
    
    // Determine the correct path to browse-items.html
    // If you are deep in folders, this relative path might need to be '/pages/browse-items.html'
    const BROWSE_PAGE_URL = "browse-items.html"; 

    function performSearch(query) {
        const cleanQuery = query.trim();
        if (cleanQuery) {
            window.location.href = `${BROWSE_PAGE_URL}?search=${encodeURIComponent(cleanQuery)}`;
        }
    }

    // === 2. MAIN LOAD LOGIC ===
    function loadHeaderAndWatch() {
        const headerContainer = document.getElementById("header");

        // Load Header HTML
        fetch("header.html")
            .then(res => res.text())
            .then(data => {
                if(headerContainer) {
                    headerContainer.innerHTML = data;
                    // We only need to init user data and logo. 
                    // Search is now handled globally below.
                    initHeaderUserData();
                    initLogoClick(); 
                }
            })
            .catch(err => console.error("Header load failed:", err));

        // Watch for DOM changes (in case header is wiped/reloaded)
        if (headerContainer) {
            const observer = new MutationObserver(() => {
                // If header is re-rendered, we just re-apply the avatar/logo logic.
                // Search logic DOES NOT need re-applying because it is on the document body.
                initHeaderUserData();
                initLogoClick();
            });
            observer.observe(headerContainer, { childList: true });
        }
    }

    // === 3. NAVIGATION LOGIC ===
    function initLogoClick() {
        // We use delegation here too just to be safe
        const logo = document.getElementById("header-logo");
        if (logo) {
            // Find the anchor tag parent
            const link = logo.closest('a');
            if (link) {
                // Ensure it goes where we want, or let default HTML handle it
                // If you want to force JS redirection:
                link.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = "homepage.html";
                };
            }
        }
    }

    // === 4. USER PROFILE / AVATAR LOGIC ===
    async function initHeaderUserData() {
        let userInfo = null;

        try {
            const stored = localStorage.getItem("userInfo");
            if (stored) userInfo = JSON.parse(stored);
        } catch (e) {
            console.error("Error parsing user info", e);
        }

        // Fetch if missing
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
            } catch (e) { /* silent fail */ }
        }

        if (userInfo && userInfo.username) {
            generateAndApplyAvatar(userInfo.username);
        }
    }

    function generateAndApplyAvatar(username) {
        const headerImg = document.getElementById("user-header-profile-icon");
        if (!headerImg) return;

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

        headerImg.src = canvas.toDataURL("image/png");
    }

    // === 5. GLOBAL SEARCH LOGIC (THE FIX) ===
    // We attach this ONCE to the document. It works even if the header is deleted and recreated.
    function initGlobalSearchListeners() {
        
        // 1. Handle CLICK on the Search Button (Magnifying Glass)
        document.body.addEventListener('click', (e) => {
            // Check if we clicked inside the header search button
            const btn = e.target.closest('.header-search button');
            if (btn) {
                e.preventDefault();
                // Find the input *next* to this button
                const container = btn.closest('.header-search');
                const input = container ? container.querySelector('input') : null;
                if (input) {
                    performSearch(input.value);
                }
            }
        });

        // 2. Handle ENTER KEY on the Search Input
        document.body.addEventListener('keypress', (e) => {
            // Check if the target is the header search input
            if (e.target.matches('.header-search input') && e.key === 'Enter') {
                e.preventDefault();
                performSearch(e.target.value);
            }
        });
    }

    // === 6. INITIALIZE ===
    if (document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", () => {
            loadHeaderAndWatch();
            initGlobalSearchListeners(); // Attach listeners immediately
        });
    } else {
        loadHeaderAndWatch();
        initGlobalSearchListeners(); // Attach listeners immediately
    }

})();