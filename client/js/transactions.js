document.addEventListener('DOMContentLoaded', () => {
  const backHomeBtn = document.getElementById('back-home');
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      window.location.href = 'profilepage.html';
    });
  }
  initRatingModal();
});

const tbody = document.getElementById('transactions-tbody');
const analyticsContainer = document.getElementById('transactions-analytics');

let currentRating = 0;
let ratingTransactionId = null;
let ratingPartnerId = null;
let ratingId = null;

export function loadTransactions() {
  fetch('../server/item/get_transactions.php')
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.error('Failed to load transactions', data);
        return;
      }
      const transactions = data.transactions || [];
      tbody.innerHTML = '';
      transactions.forEach(t => tbody.appendChild(createRow(t)));
      createTransactionsAnalytics(transactions);
      initRateButtons();
    })
    .catch(err => console.error('Error fetching transactions:', err));
}

function createRow(t) {
  const tr = document.createElement('tr');
  const canRate = t.status === 'successful';

  tr.innerHTML = `
      <td>${t.item_title || '(Unknown item)'}</td>
      <td>${getTransactionType(t.bid_id, t.swap_id)}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td>₱${parseFloat(t.amount || t.starting_price || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
      <td>${formatDate(t.completed_at)}</td>
      <td>
        ${t.partner_name || t.partner_id || '-'}
        ${canRate ? `<button class="rate-btn" 
                      data-transaction-id="${t.transaction_id}" 
                      data-partner-id="${t.partner_id || t.seller_id || t.buyer_id}"
                      data-rating-id="${t.rating_id || ''}"
                      data-action="${t.rating_action || 'new'}"
                      data-existing-rating="${t.existing_rating || 0}"
                      data-existing-comment="${t.existing_comment || ''}"
                      ${t.rating_id ? 'title="Edit your existing rating"' : 'title="Rate your partner"'}>
          ${t.rating_id ? 'Edit Rating' : 'Rate Vendor'}
        </button>` : ''}
      </td>
    `;
  return tr;
}

function getStatusBadge(status) {
  const badges = {
    'successful': 'status-success',
    'pending': 'status-pending',
    'failed': 'status-failed',
    'cancelled': 'status-cancelled'
  };
  return `<span class="status-badge ${badges[status] || ''}">${status}</span>`;
}

function createTransactionsAnalytics(transactions) {
  const total = transactions.length;
  const successful = transactions.filter(t => t.status === 'successful').length;

  const titleContainer = document.querySelector(".title-container");
  const oldAnalytics = titleContainer.querySelector(".analytics");
  if (oldAnalytics) oldAnalytics.remove();

  const titleHeading = document.querySelector(".title-container h3");
  titleHeading.textContent = "My Transactions";

  const analytics = document.createElement("div");
  analytics.classList.add("analytics");

  analytics.innerHTML = `
    <div class="total-items">
      <h6>${total}</h6>
      <p>Total Transactions</p>
    </div>
    <div class="success-rate">
      <h6>${((successful / total) * 100 || 0).toFixed(1)}%</h6>
      <p>Success Rate</p>
    </div>
  `;
  titleContainer.appendChild(analytics);
}

function initRateButtons() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('rate-btn')) {
      ratingTransactionId = e.target.dataset.transactionId;
      ratingPartnerId = e.target.dataset.partnerId;
      ratingId = e.target.dataset.ratingId || null;
      const action = e.target.dataset.action;
      const existingRating = parseInt(e.target.dataset.existingRating);
      const existingComment = e.target.dataset.existingComment;

      const itemTitle = e.target.closest('tr').querySelector('td:nth-child(1)').textContent;
      const modalTitle = document.getElementById('rating-item-title');
      const submitBtn = document.getElementById('submit-rating');

      if (action === 'edit' || ratingId) {
        modalTitle.textContent = `Edit Rating for "${itemTitle}"`;
        currentRating = existingRating;
        setStars(currentRating);
        document.getElementById('rating-comment').value = existingComment;
        submitBtn.textContent = 'Update Rating';
      } else {
        modalTitle.textContent = `Rate Vendor for "${itemTitle}"`;
        currentRating = 0;
        setStars(0);
        document.getElementById('rating-comment').value = '';
        submitBtn.textContent = 'Submit Rating';
      }

      document.getElementById('rating-transaction-id').value = ratingTransactionId;
      document.getElementById('rating-partner-id').value = ratingPartnerId;
      document.getElementById('rating-modal').style.display = 'flex';
    }
  });
}


function formatDate(dt) {
  if (!dt) return '-';
  const d = new Date(dt.replace(' ', 'T'));
  if (isNaN(d)) return dt;
  return d.toLocaleString();
}

function getTransactionType(bidId, swapId) {
  if (bidId) return 'Bid';
  if (swapId) return 'Swap';
  return 'Unknown';
}

function setStars(rating) {
  const stars = document.querySelectorAll('.star');
  const currentRatingEl = document.getElementById('current-rating');
  const submitBtn = document.getElementById('submit-rating');

  stars.forEach((star, index) => {
    star.classList.toggle('active', index < rating);
  });
  if (currentRatingEl) currentRatingEl.textContent = rating;
  if (submitBtn) submitBtn.disabled = rating === 0;
}

function initRatingModal() {
  const modal = document.getElementById('rating-modal');
  const closeBtn = document.getElementById('rating-modal-close');
  const cancelBtn = document.getElementById('cancel-rating');
  const submitBtn = document.getElementById('submit-rating');
  const stars = document.querySelectorAll('.star');
  const currentRatingEl = document.getElementById('current-rating');

  function closeModal() {
    if (modal) modal.style.display = 'none';
    currentRating = 0;
    stars.forEach(star => star.classList.remove('active'));
    if (currentRatingEl) currentRatingEl.textContent = '0';
    if (document.getElementById('rating-comment')) document.getElementById('rating-comment').value = '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submit Rating';
    }
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  stars.forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.rating);
      setStars(currentRating);
    });

    star.addEventListener('mouseover', () => {
      if (currentRating === 0) {
        stars.forEach((s, index) => {
          s.classList.toggle('active', index < parseInt(star.dataset.rating));
        });
      }
    });

    star.addEventListener('mouseout', () => {
      if (currentRating === 0) {
        stars.forEach(s => s.classList.remove('active'));
      }
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (currentRating === 0) return;

      const comment = document.getElementById('rating-comment')?.value || '';

      fetch('../server/ratings/create_ratings.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating_id: ratingId,
          transaction_id: ratingTransactionId,
          rater_id: 'u1', //  Get from login session, do after login implementation!!
          rating: currentRating,
          comment: comment,
          rated_user_id: ratingPartnerId
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            closeModal();
            loadTransactions();
            alert('Rating ' + (ratingId ? 'updated' : 'submitted') + ' successfully!');
          } else {
            alert('Error: ' + data.message);
          }
        })
        .catch(err => {
          console.error('Rating error:', err);
          alert('Failed to submit rating');
        });
    });
  }
}
