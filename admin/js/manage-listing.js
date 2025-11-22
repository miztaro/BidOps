document.addEventListener('DOMContentLoaded', function() {
    const listingContainer = document.getElementById('listing-container');
    const emptyState = document.getElementById('empty-state');

    function createItemCard(item) {

        const article = document.createElement('article');
        article.classList.add('item-card');
        article.dataset.itemId = item.item_id;
        article.dataset.itemType = item.item_type;


        const contentDiv = document.createElement('div');
        contentDiv.classList.add('item-content');

        // Title
        const title = document.createElement('h3');
        title.classList.add('item-title');
        title.textContent = item.title || 'No title';

        // Description
        const desc = document.createElement('p');
        desc.classList.add('item-desc');
        desc.textContent = (item.description && item.description.length > 100) 
            ? item.description.slice(0, 100) + '...' 
            : (item.description || 'No description');

        // Meta div
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('item-meta');

        const categorySpan = document.createElement('span');
        categorySpan.classList.add('category');
        categorySpan.textContent = item.category_type || 'Uncategorized';

        const userSpan = document.createElement('span');
        userSpan.classList.add('user');
        userSpan.textContent = `Submitted by: ${item.seller_id || 'Unknown'}`;

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('date');

        if(item.created_date){
            const date = new Date(item.created_date);
            dateSpan.textContent = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            dateSpan.textContent = '';
        }

        metaDiv.appendChild(categorySpan);
        metaDiv.appendChild(userSpan);
        metaDiv.appendChild(dateSpan);

        contentDiv.appendChild(title);
        contentDiv.appendChild(desc);
        contentDiv.appendChild(metaDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('item-actions');

        const approveBtn = document.createElement('button');
        approveBtn.classList.add('approve');
        approveBtn.dataset.action = 'approve';
        approveBtn.textContent = 'Approve';

        const rejectBtn = document.createElement('button');
        rejectBtn.classList.add('reject');
        rejectBtn.dataset.action = 'reject';
        rejectBtn.textContent = 'Reject';

        actionsDiv.appendChild(approveBtn);
        actionsDiv.appendChild(rejectBtn);

        article.appendChild(contentDiv);
        article.appendChild(actionsDiv);

        return article;
    }


    function loadItems() {
        fetch('../../server/item/get_pending_items.php')
            .then(res => res.json())
            .then(data => {
                console.log('Items fetched:', data);
                listingContainer.innerHTML = '';
                if (data.length === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    emptyState.classList.add('hidden');
                    data.forEach(item => {
                        const card = createItemCard(item);
                        listingContainer.appendChild(card);
                    });
                }
            })
            .catch(err => {
                console.error('Error loading items', err);
            });
    }

    loadItems();
});
