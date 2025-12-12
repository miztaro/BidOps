(function() {
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username');
    const id = localStorage.getItem('user_id');
    const currentIP = window.location.hostname;
    const protocol = window.location.protocol;

    // 1. No User Logged In? -> Go to Login
    if (!role) {
        // Allow access only to login/register pages
        const path = window.location.pathname;
        if (!path.includes('login.html') && !path.includes('register.html') && !path.includes('create-account.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // 2. Is Admin? -> Go to Admin Server (Port 3000)
    if (role === 'admin') {
        const adminURL = `${protocol}//${currentIP}:3000/homepage.html?role=${role}&user=${user}&id=${id}`;
        window.location.href = adminURL;
    }

    // 3. Is User? -> Stay here. (Do nothing)
})();