document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('feedback-tbody');
  const analyticsContainer = document.querySelector('.title-container .analytics');

  // Handle back-profile button click to go to profilepage.html
  const backProfileBtn = document.getElementById('back-profile');
  if (backProfileBtn) {
    backProfileBtn.addEventListener('click', () => {
      window.location.href = 'profilepage.html';
    });
  }

  function renderStars(rating) {
    const r = parseInt(rating, 10) || 0;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= r ? '★' : '☆';
    }
    return `<span class="rating-stars">${stars}</span> (${r})`;
  }

  function formatDate(dt) {
    if (!dt) return '-';
    const d = new Date(dt.replace(' ', 'T'));
    if (isNaN(d)) return dt;
    return d.toLocaleString();
  }

  function createRow(r) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="item">${r.item_title || '(Unknown item)'}</td>
      <td>${r.rater_username || r.rater_id}</td>
      <td>${renderStars(r.rating)}</td>
      <td>${r.comment || ''}</td>
      <td>${formatDate(r.completed_at)}</td>
      <td>${r.transaction_status || '-'}</td>
    `;
    return tr;
  }

  function createAnalytics(ratings) {
    const total = ratings.length;
    const avg =
      total === 0
        ? 0
        : (
            ratings.reduce((sum, r) => sum + (parseInt(r.rating, 10) || 0), 0) /
            total
          ).toFixed(1);

    analyticsContainer.innerHTML = `
      <div class="total-items"><h6>${total}</h6><p>Total Ratings</p></div>
      <div class="avg-rating"><h6>${avg}</h6><p>Average Rating</p></div>
    `;
  }

  function loadRatings() {
    fetch('../server/ratings/get_ratings.php')
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          console.error('Failed to load ratings', data);
          return;
        }
        const ratings = data.ratings || [];
        tbody.innerHTML = '';
        ratings.forEach(r => tbody.appendChild(createRow(r)));
        createAnalytics(ratings);
      })
      .catch(err => console.error('Error fetching ratings:', err));
  }

  loadRatings();
});
