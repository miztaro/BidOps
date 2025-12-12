// 1. Google Login Callback
function handleGoogleLoginResponse(response) {
    console.log("Google JWT received. Redirecting...");
    window.location.href = `/BidOps/server/auth/google-login.php?credential=${response.credential}`;
}
(function() {
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username');
    const id = localStorage.getItem('user_id');
    const currentIP = window.location.hostname;
    const protocol = window.location.protocol;

    if (role) {
        // User is already logged in! Redirect them immediately.
        
        if (role === 'admin') {
            // Redirect to Admin Server (Port 3000)
            console.log("Already logged in as Admin. Redirecting...");
            window.location.href = `${protocol}//${currentIP}:3000/homepage.html?role=${role}&user=${user}&id=${id}`;
        } else {
            // Redirect to Client Homepage (Port 80)
            console.log("Already logged in as User. Redirecting...");
            window.location.href = 'homepage.html';
        }
    }
})();
// 2. Initialize Google Sign-In
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
    } else {
        console.error("Google Identity Services script failed to load.");
    }
};

// 3. Standard Login & Session Logic
document.addEventListener('DOMContentLoaded', function() {
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

// Standard Login Function
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
            
            // 1. STANDARDIZE DATA SAVING
            // We save these as simple strings so both Client and Admin guards can read them
            localStorage.setItem('role', role);
            
            if (role === 'admin') {
                localStorage.setItem('user_id', data.admin.admin_id);
                localStorage.setItem('username', data.admin.username);

                alert(data.message || 'Admin Login successful!');

                // 2. REDIRECT TO NODE.JS (PORT 3000)
                // We pass the data in the URL (Handshake)
                const currentIP = window.location.hostname; 
                const protocol = window.location.protocol;
                
                window.location.href = `${protocol}//${currentIP}:3000/homepage.html?role=${role}&user=${data.admin.username}&id=${data.admin.admin_id}`;

            } else {
                // User Logic
                localStorage.setItem('user_id', data.user.user_id);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('email', data.user.email);

                alert(data.message || 'Login successful!');

                // Keep Users on Port 80
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

// Session Check
function checkExistingSession() {
    fetch('/BidOps/server/auth/get_role.php', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        if (data.role === 'admin') {
            const currentIP = window.location.hostname;
            const protocol = window.location.protocol;
            window.location.href = `${protocol}//${currentIP}:3000/homepage.html`;
        } 
        else if (data.role === 'user') {
            window.location.href = 'homepage.html';
        }
    })
    .catch(() => console.log('No active session')); 
}