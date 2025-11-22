document.getElementById("sendCodeBtn").addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();

    if (!email.endsWith("@slu.edu.ph")) {
        alert("You must use your official SLU email (@slu.edu.ph).");
        return;
    }

    // Send email to backend
    fetch("send_code.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "email=" + encodeURIComponent(email)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            sessionStorage.setItem("pendingEmail", email); // for verify.html
            window.location.href = "verify.html";
        } else {
            alert(data.message);
        }
    });
});
