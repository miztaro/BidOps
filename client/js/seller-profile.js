document.addEventListener('DOMContentLoaded', () => {
    // Load header
    fetch('header.html')
        .then(response => response.text())
        .then(headerHTML => {
            document.getElementById('header').innerHTML = headerHTML;

            const script = document.createElement('script');
            script.src = 'js/header.js';
            script.onload = function () {
                if (typeof initLogic === 'function') initLogic();
            };
            document.body.appendChild(script);
        })
        .catch(error => console.error('Error loading header:', error));

    // Back button
    const backBtn = document.getElementById('backToPrevious');
    if (backBtn) {
        backBtn.addEventListener('click', () => window.history.back());
    }

    const params = new URLSearchParams(window.location.search);
    const sellerId = params.get('seller_id');

    if (!sellerId) {
        document.getElementById('sellerName').textContent = 'Unknown seller';
        document.getElementById('sellerEmail').textContent = '';
        return;
    }

    // Fallback name until we have username
    document.getElementById('sellerName').textContent = 'Seller ' + sellerId;
    document.getElementById('sellerEmail').textContent = 'Email will be loaded later.';

    // Fetch ratings ABOUT this seller
    fetch(`../server/ratings/get_ratings_for_user.php?user_id=${encodeURIComponent(sellerId)}`)
        .then(res => res.json())
        .then(data => {
            console.log('Ratings for seller', sellerId, data);

            const container = document.getElementById('sellerFeedbackPlaceholder');
            container.innerHTML = '';

            if (!data.success) {
                container.textContent = data.message || 'Failed to load feedback.';
                return;
            }

            if (!data.ratings || data.ratings.length === 0) {
                container.textContent = 'No feedback for this user yet.';
                return;
            }

            const first = data.ratings[0];
            if (first.seller_id === sellerId && first.seller_username) {
                document.getElementById('sellerName').textContent = first.seller_username;
            } else if (first.buyer_id === sellerId && first.buyer_username) {
                document.getElementById('sellerName').textContent = first.buyer_username;
            }

            const list = document.createElement('div');
            list.className = 'feedback-list';

            data.ratings.forEach(r => {
                const item = document.createElement('div');
                item.className = 'feedback-item';

                const roleText = (r.buyer_id === sellerId) ? 'as Buyer' : 'as Seller';
                const fromName = r.rater_username || r.rater_id;

                item.innerHTML = `
                    <div class="feedback-header">
                        <strong>${r.rating ?? '-'} ★</strong>
                        <span>from ${fromName} (${roleText})</span>
                    </div>
                    <div class="feedback-body">
                        <p>${r.comment || ''}</p>
                        <small>
                            Item: ${r.item_title || 'N/A'}
                            • Completed: ${r.completed_at || 'N/A'}
                        </small>
                    </div>
                `;
                list.appendChild(item);
            });

            container.appendChild(list);
        })
        .catch(err => {
            console.error(err);
            document.getElementById('sellerFeedbackPlaceholder').textContent =
                'Failed to load feedback.';
        });

        fetch(`../server/item/get_listings_for_user.php?user_id=${encodeURIComponent(sellerId)}`)
    .then(res => res.json())
    .then(data => {
        console.log('Listings for seller', sellerId, data);

        const container = document.getElementById('sellerListingsPlaceholder');
        container.innerHTML = '';

        if (!data.success) {
            container.textContent = data.message || 'Failed to load listings.';
            return;
        }

        if (!data.items || data.items.length === 0) {
            container.textContent = 'No listings from this user yet.';
            return;
        }

        const list = document.createElement('div');
        list.className = 'seller-listings';

        data.items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'seller-listing-item';

            const badge = item.item_type === 'swap' ? 'Swap' : 'Bid';

            el.innerHTML = `
                <div class="listing-header">
                    <span class="listing-badge">${badge}</span>
                    <strong>${item.title}</strong>
                </div>
                <p class="listing-desc">${item.description || ''}</p>
                <small>
                    Category: ${item.category_type || 'N/A'} • 
                    Status: ${item.status} • 
                    Created: ${item.created_date}
                </small>
            `;


            list.appendChild(el);
        });

        container.appendChild(list);
    })
    .catch(err => {
        console.error(err);
        document.getElementById('sellerListingsPlaceholder').textContent =
            'Failed to load listings.';
    });
});
