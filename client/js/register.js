document.getElementById("sendCodeBtn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    if(!email.endsWith("@slu.edu.ph")){
        alert("Only SLU emails allowed");
        return;
    }

    fetch('send_code.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `email=${encodeURIComponent(email)}`
    }).then(res => res.json())
      .then(data => {
        if(data.success){
            sessionStorage.setItem("pendingEmail", email);
            window.location.href = "verify-code.html";
        } else alert(data.message);
      });
});
