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
    
    
    fetch('http://localhost/BidOps/server/auth/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (data.role === 'user') {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('role', 'user');
                
                alert(data.message || 'Login successful!');
                window.location.href = 'homepage.html';
                
            } else if (data.role === 'admin') {
                localStorage.setItem('admin', JSON.stringify(data.admin));
                localStorage.setItem('role', 'admin');
                
                alert(data.message || 'Admin login successful!');
                window.location.href = '../admin/homepage.html';
            }
        } else {
            alert(data.message || 'Login failed, please try again!');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Login failed. Please check your connection and try again!');
    })
    .finally(() => {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    });
}

function checkExistingSession() {
    
    fetch('http://localhost/BidOps/server/auth/get_role.php', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.role === 'admin') {
            localStorage.setItem('role', 'admin');
            localStorage.setItem('admin', JSON.stringify({
                admin_id: data.admin_id,
                username: data.username
            }));
            window.location.href = '../admin/homepage.html';
        } else if (data.role === 'user') {
            localStorage.setItem('role', 'user');
            localStorage.setItem('user', JSON.stringify({
                user_id: data.user_id,
                username: data.username,
                email: data.email
            }));
            window.location.href = 'homepage.html';
        }
        // If guest, stay on login page (no redirect)
    })
    .catch(error => {
        // Silent fail - just stay on login page
        console.log('No active session');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    
    const loginBtn = document.querySelector('.btn.primary');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleFormLogin);
    }
    
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleFormLogin(event);
            }
        });
    }

    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleFormLogin(event);
            }
        });
    }
});