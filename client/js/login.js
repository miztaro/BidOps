
// 1. AUTO-REDIRECT IF ALREADY LOGGED IN

(function() {
    // A. CHECK FOR LOGOUT SIGNAL FIRST
    // If we are trying to logout, DO NOT auto-redirect back to dashboard.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'logout') {
        return; // STOP HERE. Let the page load so we can clear the session.
    }

    // B. NORMAL AUTO-REDIRECT
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username');
    const id = localStorage.getItem('user_id');
    const currentIP = window.location.hostname;
    const protocol = window.location.protocol;

    if (role) {
        if (role === 'admin') {
            console.log("Already logged in as Admin. Redirecting...");
            window.location.href = `${protocol}//${currentIP}:3000/homepage.html?role=${role}&user=${user}&id=${id}`;
        } else {
            console.log("Already logged in as User. Redirecting...");
            window.location.href = 'homepage.html';
        }
    }
})();

// 2. GOOGLE LOGIN SETUP

function handleGoogleLoginResponse(response) {
    console.log("Google JWT received. Redirecting...");
    window.location.href = `/BidOps/server/auth/google-login.php?credential=${response.credential}`;
}

window.onload = function () {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
            callback: handleGoogleLoginResponse,
            ux_mode: "popup"
        });

        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                google.accounts.id.prompt();
            });
        }
    }
};

// ==============================================
// 3. MAIN LOGIC (DOM READY)
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    // Run session cleanup or check
    checkExistingSession();

    const loginBtn = document.querySelector('.btn.primary');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleFormLogin);
    }

    const inputs = [document.getElementById('username'), document.getElementById('password')];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleFormLogin(e);
            });
        }
    });
});

// 4. FORM LOGIN FUNCTION

function handleFormLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please enter both username and password!');
        return;
    }

    const loginBtn = document.querySelector('.btn.primary');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;

    fetch('/BidOps/server/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            const role = data.role;
            
            // SAVE SESSION DATA
            localStorage.setItem('role', role);
            
            if (role === 'admin') {
                localStorage.setItem('user_id', data.admin.admin_id);
                localStorage.setItem('username', data.admin.username);

                alert(data.message || 'Admin Login successful!');

                // REDIRECT TO NODE.JS (PORT 3000)
                const currentIP = window.location.hostname; 
                const protocol = window.location.protocol;
                window.location.href = `${protocol}//${currentIP}:3000/homepage.html?role=${role}&user=${data.admin.username}&id=${data.admin.admin_id}`;

            } else {
                // REDIRECT TO CLIENT (PORT 80)
                localStorage.setItem('user_id', data.user.user_id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('email', data.user.email);

                alert(data.message || 'Login successful!');
                window.location.href = 'homepage.html';
            }

        } else {
            alert(data.message || 'Login failed, please try again!');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please check your connection.');
    })
    .finally(() => {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    });
}


// 5. SESSION CHECK & LOGOUT HANDLER

function checkExistingSession() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // --- A. LOGOUT CLEANUP ---
    if (urlParams.get('action') === 'logout') {
        console.log("Logout signal detected. Cleaning up...");

        // 1. Clear Client-Side Storage (Port 80)
        localStorage.clear();

        // 2. Kill PHP Session
        fetch('/BidOps/server/auth/logout.php')
            .then(() => {
                console.log("PHP Session killed.");
                // Remove ?action=logout from URL so refreshing works normally
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            });
            
        // STOP HERE. Do not check for session.
        return; 
    }

    // --- B. NORMAL SESSION CHECK ---
    fetch('/BidOps/server/auth/get_role.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.role === 'admin') {
            const currentIP = window.location.hostname;
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${currentIP}:3000/homepage.html?role=${data.role}&user=${data.username}&id=${data.id}`;
        } 
        else if (data.role === 'user') {
            window.location.href = 'homepage.html';
        }
    })
    .catch(() => console.log('No active session')); 
}