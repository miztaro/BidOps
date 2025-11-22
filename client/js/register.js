window.onload = function () {
  // Initialize Google Identity Services
  google.accounts.id.initialize({
    client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    ux_mode: "popup" // temporarily use popup for debug
  });

  const btn = document.getElementById('google-register-btn');

  btn.addEventListener('click', function() {
    // Trigger login popup
    google.accounts.id.prompt(); // or use google.accounts.id.request()
  });
};

// JS callback
function handleCredentialResponse(response) {
  console.log("DEBUG: JWT Token received:", response.credential);

  // Optional: show decoded JWT payload in console
  const base64Url = response.credential.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  console.log("DEBUG: Decoded payload:", JSON.parse(jsonPayload));

  // Redirect to PHP callback for server verification
  window.location.href = `http://localhost/BidOps/server/auth/register-callback.php?credential=${response.credential}`;
}
