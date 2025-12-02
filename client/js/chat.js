document.addEventListener('DOMContentLoaded', () => {
  const chatBtn = document.getElementById('chatBtn');
  if (!chatBtn) return;

  chatBtn.addEventListener('click', () => {
    // Dummy buyer_id for now; seller and item from button attributes
    const buyerId = 'uDUMMY';
    const sellerId = chatBtn.dataset.sellerId;
    const itemId = chatBtn.dataset.itemId;

    const chatUrl = `messages.html?buyer=${buyerId}&seller=${sellerId}&item=${itemId}`;
    window.location.href = chatUrl;
  });
});
