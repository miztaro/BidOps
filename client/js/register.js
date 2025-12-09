// 1. Define the callback function FIRST so the code knows it exists
function handleCredentialResponse(response) {
  console.log("Encoded JWT ID token: " + response.credential);

  // Redirect to your PHP backend to verify the email and create the session
  // Make sure this path matches your folder structure exactly
  window.location.href = `/BidOps/server/auth/register-callback.php?credential=${response.credential}`;
}

// 2. Initialize Google Sign-In when the page loads
window.onload = function () {
  // Check if the Google library is loaded
  if (typeof google === 'undefined') {
    console.error("Google Identity Services script not loaded.");
    return;
  }

  google.accounts.id.initialize({
    client_id: "904457542130-klcnacmhmpes2oruc6lkh4rpi6afn1l2.apps.googleusercontent.com",
    callback: handleCredentialResponse, // Now it won't be red because it's defined above
    ux_mode: "popup"
  });

  const btn = document.getElementById('google-register-btn');

  if (btn) {
      btn.addEventListener('click', function() {
        // Trigger the Google prompt
        google.accounts.id.prompt(); 
      });
  } else {
      console.error("Google Register Button not found in HTML");
  }
};