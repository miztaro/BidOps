document.addEventListener('DOMContentLoaded', function() {
    const listingType = document.getElementById('listingType');
    const bidFields = document.getElementById('bidFields');
    const startingPriceInput = document.getElementById('starting_price');
    const endDateInput = document.getElementById('end_date');
    const listingForm = document.getElementById('listingForm');
    
        // Bid Increment Slider
    const bidIncrement = document.getElementById('bidIncrement');
    const incrementValue = document.getElementById('incrementValue');

    if (bidIncrement) {
        // Initialize display
        incrementValue.textContent = bidIncrement.value + "%";

        // Update display + UI progress on slider move
        bidIncrement.addEventListener("input", function () {
            incrementValue.textContent = this.value + "%";
            this.style.setProperty("--slider-progress", (this.value - this.min) * 100 / (this.max - this.min) + "%");
        });
    }

    listingType.addEventListener('change', function() {
        if (this.value === 'bid') {
            bidFields.style.display = 'block';
            startingPriceInput.required = true;
            endDateInput.required = true;
            
            const now = new Date();
            now.setHours(now.getHours() + 1);
            const minDateTime = now.toISOString().slice(0, 16);
            endDateInput.min = minDateTime;
        } else {
            bidFields.style.display = 'none';
            startingPriceInput.required = false;
            endDateInput.required = false;
        }
    });

    listingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (listingType.value === 'bid') {
            const endDate = new Date(endDateInput.value);
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            
            if (endDate <= oneHourFromNow) {
                showMessage('Bid end date must be at least 1 hour from now.', 'error');
                return;
            }
        }
        
        const formData = new FormData(this);
        
        const submitBtn = document.querySelector('.create-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        fetch('../server/item/insert_item.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showMessage(data.message, data.message.includes('successfully') ? 'success' : 'error');
            
            if (data.message.includes('successfully')) {
                setTimeout(() => {
                    window.location.href = 'homepage.html';
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error creating listing: ' + error.message, 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    });

    function showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 3000);
        }
    }
});