
// 1. AUTO-REDIRECT IF ALREADY LOGGED INgoogle

(function() {
    // A. CHECK FOR LOGOUT SIGNAL FIRST
    // If we are trying to logout, DO NOT auto-redirect back to dashboard.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'logout') {
        return; 
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

// ...(Auto-Redirect)  ...

function handleGoogleLoginResponse(response) {
    console.log("Google JWT received. Verifying...");

    // 1. Send credential to PHP
    fetch('../server/auth/google-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
    })
    .then(async res => {
        const text = await res.text(); // Get raw text first
        try {
            const data = JSON.parse(text); // Try to parse JSON
            return data;
        } catch (err) {
        
            console.error("SERVER ERROR (HTML Response):", text);
            throw new Error("Server returned HTML instead of JSON. See console for details.");
        }
    })
    .then(data => {
        if (data.success) {
            localStorage.setItem('role', 'user');
            localStorage.setItem('user_id', data.user.user_id);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('email', data.user.email);

            alert("Login successful!");
            window.location.href = 'homepage.html';
        } else {
            alert(data.message);
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        }
    })
    .catch(error => {
        console.error('Google Auth Error:', error);
        alert('Login failed. Check the console (F12) for the server error.');
    });
}

// B. THE TRIGGER: Initialize and Render the Button
window.onload = function () {
    if (typeof google !== 'undefined') {
        
        // 1. Initialize
        google.accounts.id.initialize({
            client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
            callback: handleGoogleLoginResponse,
            ux_mode: "popup", 
            auto_select: false // <--- Ensures it doesn't auto-click
        });

        // 2. Render the Google Button into your div
        // This replaces the .prompt() call which causes the "upper right" overlay
        const container = document.getElementById("google-button-container");
        
        if (container) {
            google.accounts.id.renderButton(
                container,
                { 
                    theme: "outline", 
                    size: "large", 
                    type: "standard",
                    shape: "rectangular",
                    text: "signin_with",
                    logo_alignment: "left",
                    width: 250 // Adjust width to match your design
                } 
            );
        }
    }
};

// 3. MAIN LOGIC (DOM READY)

document.addEventListener('DOMContentLoaded', function() {
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

