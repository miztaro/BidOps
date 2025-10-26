function fetchItems() {
  fetch('http://localhost/bidops/server/item/get_items.php')
    .then(response => response.json())
    .then(data => {
      const bids = data.filter(item => item.item_type === 'bid');
      const swaps = data.filter(item => item.item_type === 'swap');

      homeBidContainer.innerHTML = '';
      viewAllBidContainer.innerHTML = '';
      homeSwapContainer.innerHTML = '';
      viewAllSwapContainer.innerHTML = '';

      bids.slice(0, 5).forEach(bid => {
        homeBidContainer.appendChild(createBidCard({
          id: bid.item_id,
          title: bid.title,
          category: bid.category_type,
          price: `₱${bid.starting_price || '0.00'}`,
          timeLeft: 'TBD',
          bidsCount: 0,
          image: bid.image_path ? '../server/' + bid.image_path : '../../server/uploads/bid_default.webp'
        }));
      });
      
      bids.forEach(bid => {
        viewAllBidContainer.appendChild(createBidCard({
          id: bid.item_id,
          title: bid.title,
          category: bid.category_type,
          price: `₱${bid.starting_price || '0.00'}`,
          timeLeft: 'TBD',
          bidsCount: 0,
          image: bid.image_path ? '../server/' + bid.image_path : '../../server/uploads/bid_default.webp'

        }));
      });

      swaps.slice(0, 5).forEach(swap => {
        homeSwapContainer.appendChild(createSwapCard({
          id: swap.item_id,
          title: swap.title,
          category: swap.category_type,
          image: swap.image_path ? '../server/' + swap.image_path : '../server/uploads/default_swap_img.jpg'
        }));
      });
      swaps.forEach(swap => {
        viewAllSwapContainer.appendChild(createSwapCard({
          id: swap.item_id,
          title: swap.title,
          category: swap.category_type,
          image: swap.image_path ? '../server/' + swap.image_path : '../server/uploads/default_swap_img.jpg'
        }));
      });
    })
    .catch(error => {
      console.error('Error loading items:', error);
    });
}
