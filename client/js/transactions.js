document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('transactions-tbody');
  const analyticsContainer = document.getElementById('transactions-analytics');

  // Handle back-home button click
  const backHomeBtn = document.getElementById('back-home');
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      window.location.href = 'profilepage.html';
    });
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

  function createRow(t) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.item_title || '(Unknown item)'}</td>
      <td>${getTransactionType(t.bid_id, t.swap_id)}</td>
      <td>${getStatusBadge(t.status)}</td>
      <td>₱${parseFloat(t.amount || t.starting_price || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</td>
      <td>${formatDate(t.completed_at)}</td>
      <td>${t.partner_name || t.partner_id || '-'}</td>
    `;
    return tr;
  }

  function createAnalytics(transactions) {
    const total = transactions.length;
    const successful = transactions.filter(t => t.status === 'successful').length;
    
    analyticsContainer.innerHTML = `
      <div class="total-items"><h6>${total}</h6><p>Total Transactions</p></div>
      <div class="success-rate"><h6>${((successful/total)*100 || 0).toFixed(1)}%</h6><p>Success Rate</p></div>
    `;
  }

  function loadTransactions() {
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
        createAnalytics(transactions);
      })
      .catch(err => console.error('Error fetching transactions:', err));
  }

  loadTransactions();
});
