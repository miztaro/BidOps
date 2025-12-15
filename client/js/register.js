// client/js/register.js

function handleGoogleRegisterResponse(response) {
    console.log("Google JWT received. Processing...");

    fetch('../server/auth/google-register.php', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
    })
    .then(async res => {
        const text = await res.text();
        try { return JSON.parse(text); } 
        catch (err) { console.error("Server Error:", text); throw new Error("Server Error"); }
    })
    .then(data => {
        if (data.success) {
            // Case A: User existed, logged in
            localStorage.setItem('role', 'user');
            localStorage.setItem('user_id', data.user.user_id);
            localStorage.setItem('username', data.user.username);
            alert(data.message);
            window.location.href = data.redirect; // Go to homepage
        } else if (data.redirect) {
            // Case B: New User -> Go to Create Account Form
            console.log("Redirecting to finish registration...");
            window.location.href = data.redirect; // Go to create-account.html
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred.');
    });
}

window.onload = function () {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
            callback: handleGoogleRegisterResponse,
            ux_mode: "popup",
            auto_select: false
        });

        const container = document.getElementById("google-register-container");
        if (container) {
            google.accounts.id.renderButton(container, { theme: "outline", size: "large", width: 250 });
        }
    }
};