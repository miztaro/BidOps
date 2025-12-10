(function () {
  function initHeaderNav() {
    const addListingBtn = document.querySelector(".add-btn") || document.querySelector(".add-listing-btn");
    const profileIcon = document.getElementById("user-header-profile-icon");
    const notifIcon = document.querySelector('iconify-icon[icon="material-symbols:notifications-outline"]');
    const messageIcon = document.querySelector('iconify-icon[icon="ri:message-3-line"]');
    const headerLogo = document.getElementById("header-logo");



    // if (addListingBtn) {
    //   addListingBtn.addEventListener("click", (e) => {
    //     e.preventDefault?.();
    //     window.location.href = "js/add-listing.js";
    //   });
    // }

    if (profileIcon) {
      profileIcon.style.cursor = "pointer";
      profileIcon.addEventListener("click", () => {
        window.location.href = "profilepage.html";
      });
    }

    if (notifIcon) {
      notifIcon.style.cursor = "pointer";
      notifIcon.addEventListener("click", () => {
        window.location.href = "notif.html";
      });
    }

    if (messageIcon) {
      messageIcon.style.cursor = "pointer";
      messageIcon.addEventListener("click", () => {
        window.location.href = "messages.html";
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeaderNav);
  } else {
    initHeaderNav();
  }
})();
