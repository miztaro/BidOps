(function() {
    const currentIP = window.location.hostname;
    // Use dynamic protocol (http: or https:) to match your server
    const protocol = window.location.protocol; 

    // 1. HANDSHAKE PROTOCOL (Catch Data from Login)
  
    const urlParams = new URLSearchParams(window.location.search);
    const incomingRole = urlParams.get('role');
    const incomingUser = urlParams.get('user');
    const incomingId = urlParams.get('id');

    // If we see login data in the URL...
    if (incomingRole) {
        // 1. Save to Storage
        localStorage.setItem('role', incomingRole);
        localStorage.setItem('username', incomingUser);
        localStorage.setItem('user_id', incomingId);

        // 2. CRITICAL: WIPE THE URL IMMEDIATELY
        // This removes the parameters so refreshing won't re-login the user
        const cleanPath = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);
    }

  
    // 2. SECURITY CHECK
    const role = localStorage.getItem('role');

    // SCENARIO A: Not Logged In
    if (!role) {
        // Redirect to Client Login
        window.location.href = `${protocol}//${currentIP}/BidOps/client/login.html`;
        return; // Stop code execution
    }

    // SCENARIO B: Logged in as User (Not Admin)
    if (role !== 'admin') {
        alert("Access Denied. Admins Only.");
        window.location.href = `${protocol}//${currentIP}/BidOps/client/homepage.html`;
        return; // Stop code execution
    }


// 3. UI LOGIC (Dropdown Menu)

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('profileDropdown');
        
        // Toggle Menu on Icon Click
        if (e.target.closest('#profileIcon')) {
            if(dropdown) {
                dropdown.classList.toggle('show');
                const nameDisplay = document.getElementById('adminNameDisplay');
                
              
                // 1. Retrieve the username from Local Storage
                const storedName = localStorage.getItem('username');
                
                // 2. Update the text if the element and name exist
                if(nameDisplay && storedName) {
                    nameDisplay.textContent = storedName;
                }
                // --- FIX ENDS HERE ---
            }
        } 
        // Close Menu on Outside Click
        else if (dropdown && dropdown.classList.contains('show') && !e.target.closest('.profile-menu-container')) {
            dropdown.classList.remove('show');
        }
    });

    // 4. LOGOUT LOGIC (The Fix)

    // We attach this to 'window' so the HTML button can call it directly
    window.adminLogout = function(event) {
        // Prevent default button behavior (reloading)
        if(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (confirm("Are you sure you want to Logout?")) {
            console.log("Logout Initiated...");

            // 1. THE FIX: We add '?action=logout' to the URL
            // This tells login.js to Force-Kill the PHP session
            const clientLoginURL = `${protocol}//${currentIP}/BidOps/client/login.html?action=logout`;

            // 2. Clear Node Data immediately
            localStorage.clear(); 

            // 3. Force Redirect immediately
            // We don't wait for fetch because login.js will handle the cleanup
            window.location.replace(clientLoginURL);
        }
    };

})();