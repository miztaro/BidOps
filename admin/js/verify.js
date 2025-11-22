//ajax js
document.getElementById("verifyBtn").addEventListener("click", () => {
    const code = document.getElementById("code").value;
    const email = sessionStorage.getItem("pendingEmail"); // saved when sending code

    if (!code || !email) {
        alert("Please enter the verification code.");
        return;
    }

    // Send POST request to PHP
    fetch("verify_code.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `code=${encodeURIComponent(code)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store verified email and go to create-account page
            sessionStorage.setItem("verifiedEmail", email);
            window.location.href = "create-account.html";
        } else {
            alert(data.message || "Verification failed");
        }
    })
    .catch(error => console.error("Error:", error));
});
