document.addEventListener('DOMContentLoaded', () => {
  fetch('../client/admin_header.html')
    .then(res => res.ok ? res.text() : Promise.reject('Failed to load'))
    .then(html => {
      document.getElementById('admin-header').innerHTML = html;
    })
    .catch(() => {
      document.getElementById('admin-header').innerHTML = `<div style="padding:1em; color:#900; background:#fcc; text-align:center;">
        Error loading navigation. Please refresh the page.
      </div>`;
    });
});
