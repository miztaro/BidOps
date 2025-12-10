// 1. Google Login Callback
function handleGoogleLoginResponse(response) {
    console.log("Google JWT received. Redirecting...");
    // Redirect to the PHP file
    window.location.href = `/BidOps/server/auth/google-login.php?credential=${response.credential}`;
}

// 2. Initialize Google Sign-In (Runs when window is fully loaded)
window.onload = function () {
    // Check if Google Library is loaded
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
            callback: handleGoogleLoginResponse,
            ux_mode: "popup"
        });

        // Attach Click Event to the Button
        const googleBtn = document.getElementById('google-login-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                google.accounts.id.prompt();
            });
        }
    } else {
        console.error("Google Identity Services script failed to load.");
    }
};

// 3. Standard Login & Session Logic (Runs when HTML is ready)
document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();

    // Standard Login Button Listener
    const loginBtn = document.querySelector('.btn.primary');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleFormLogin);
    }

    // Allow "Enter" key to submit
    const inputs = [document.getElementById('username'), document.getElementById('password')];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleFormLogin(e);
            });
        }
    });
});

// Standard Login Function
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

    // NOTE: Ensure this URL matches your actual PHP server path
    fetch('http://localhost/BidOps/server/auth/login.php', {
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
            const userData = role === 'user' ? data.user : data.admin;
            
            // Store user data in LocalStorage
            localStorage.setItem('role', role);
            localStorage.setItem(role, JSON.stringify(userData));
            
            alert(data.message || 'Login successful!');
            
            // --- UPDATED REDIRECT LOGIC ---
            if (role === 'admin') {
                // Redirect Admin to the Node.js Server (Port 3000)
                // We pass the user ID/Username in URL parameters because LocalStorage 
                // on Port 80 is NOT accessible on Port 3000.
                const adminId = data.admin.admin_id || '';
                const adminName = data.admin.username || '';
                window.location.href = `http://localhost:3000/homepage.html?id=${adminId}&user=${adminName}`;
            } else {
                // Keep Users on the PHP/Apache Server (Port 80)
                window.location.href = 'homepage.html';
            }
            // -----------------------------

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

// Session Check
function checkExistingSession() {
    // Note: This checks the PHP session.
    fetch('http://localhost/BidOps/server/auth/get_role.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        // --- UPDATED SESSION REDIRECT ---
        if (data.role === 'admin') {
            // If PHP session says Admin, go to Node.js
            window.location.href = 'http://localhost:3000/homepage.html';
        } 
        else if (data.role === 'user') {
            // If PHP session says User, go to User Homepage
            window.location.href = 'homepage.html';
        }
    })
    .catch(() => console.log('No active session')); // Silent fail is fine here
}