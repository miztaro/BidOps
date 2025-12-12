(function() {
    const currentIP = window.location.hostname;
    const protocol = window.location.protocol;

    // --- 1. HANDSHAKE (Catch Data from Login) ---
    const urlParams = new URLSearchParams(window.location.search);
    const incomingRole = urlParams.get('role');
    const incomingUser = urlParams.get('user');
    const incomingId = urlParams.get('id');

    if (incomingRole) {
        // Save session to Node.js LocalStorage
        localStorage.setItem('role', incomingRole);
        localStorage.setItem('username', incomingUser);
        localStorage.setItem('user_id', incomingId);

        // Clean the URL (remove ?role=admin...)
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: cleanUrl}, '', cleanUrl);
    }

    // --- 2. SECURITY CHECK ---
    const role = localStorage.getItem('role');

    // Case A: Not Logged In -> Go to PHP Login
    if (!role) {
        alert("Session Expired. Please Login.");
        window.location.href = `${protocol}//${currentIP}/BidOps/client/login.html`;
        return;
    }

    // Case B: Not an Admin (e.g. Regular User) -> Go to Client Home
    if (role !== 'admin') {
        alert("Access Denied. Admins Only.");
        window.location.href = `${protocol}//${currentIP}/BidOps/client/homepage.html`;
        return;
    }

    // Case C: Admin -> Access Granted
    
    // --- 3. LOGOUT LOGIC ---
    // This handles the logout button automatically if it exists
    window.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if(confirm("Are you sure you want to logout?")) {
                    localStorage.clear();
                    window.location.href = `${protocol}//${currentIP}/BidOps/client/login.html`;
                }
            });
        }
    });

})();