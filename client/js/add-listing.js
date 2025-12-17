/* 
   SAFE ADD LISTING MODAL SCRIPT
   Wrapped in an IIFE to prevent interference with other pages.
*/
(() => {
    console.log("add-listing.js loaded safely");

    // === 1. INTERNAL STATE VARIABLES ===
    let fileListDT = new DataTransfer();
    let previewObjectURLs = [];
    let previewContainerEl = null;
    
    // Config
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // === 2. HELPER FUNCTIONS ===

    // Short helper to get element by ID
    function el(id) { return document.getElementById(id); }

    // Display messages inside the modal
    function showMsg(text, type) {
        const msgDiv = el('modalMessage');
        if (!msgDiv) return;
        msgDiv.innerHTML = `<div class="message ${type}">${text}</div>`;
        if (type === 'success') {
            setTimeout(() => { msgDiv.innerHTML = ''; }, 3000);
        }
    }

    // Detect if we should default to 'swap' or 'bid' based on URL
    function getDefaultListingType() {
        const currentURL = window.location.href.toLowerCase();
        return currentURL.includes('swap') ? 'swap' : 'bid';
    }

    // Format Date for Inputs (YYYY-MM-DDTHH:mm)
    function formatDateTime(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    }

    // === 3. MODAL STATE MANAGEMENT ===

    // Clear images and reset file input
    function clearImagePreviews() {
        previewObjectURLs.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
        previewObjectURLs = [];
        fileListDT = new DataTransfer();

        const input = el('image');
        if (input) input.files = fileListDT.files;

        if (previewContainerEl) previewContainerEl.innerHTML = '';
    }

    // Set default dates (Start = Now, End = Empty)
    function setDefaultDates() {
        const now = new Date();
        const nowFormatted = formatDateTime(now);

        const startDateInput = el('start_date');
        if (startDateInput) {
            startDateInput.value = nowFormatted;
            startDateInput.min = nowFormatted;
        }

        const endDateInput = el('end_date');
        if (endDateInput) {
            endDateInput.value = "";
            endDateInput.min = ""; // Optionally set min to nowFormatted
        }
    }

    // Show or Hide Bid specific fields
    function showBidFields(show) {
        const bidFields = el('bidFields');
        if (!bidFields) return;

        bidFields.style.display = show ? 'block' : 'none';

        const startPrice = el('starting_price');
        const startDate = el('start_date');
        const endDate = el('end_date');

        if (show) {
            if (startPrice) startPrice.required = true;
            if (startDate) startDate.required = true;
            if (endDate) endDate.required = true;
            setDefaultDates();
        } else {
            if (startPrice) startPrice.removeAttribute('required');
            if (startDate) startDate.removeAttribute('required');
            if (endDate) endDate.removeAttribute('required');
        }
    }

    // Reset the form to a clean state
    function resetModalForm() {
        const form = el('modalListingForm');
        if (form) form.reset();

        const msg = el('modalMessage');
        if (msg) msg.innerHTML = '';

        const select = el('listingTypeSelect');
        const hiddenType = el('listingType');

        // SMART DETECT: Set default based on page
        const defaultType = getDefaultListingType();

        if (select) select.value = defaultType;
        if (hiddenType) hiddenType.value = defaultType;

        showBidFields(defaultType === 'bid');

        const titleCount = el('titleCount');
        if (titleCount) titleCount.textContent = '0';

        // Reset Slider Visuals
        const bidIncrement = el('bidIncrement');
        const incrementValue = el('incrementValue');
        if (bidIncrement && incrementValue) {
            bidIncrement.value = 5; 
            incrementValue.textContent = "5%";
            // Recalculate slider background
            const percent = (5 - bidIncrement.min) * 100 / (bidIncrement.max - bidIncrement.min);
            bidIncrement.style.setProperty("--slider-progress", percent + "%");
        }

        clearImagePreviews();
        setDefaultDates();
    }

    // Open Modal
    function openAddListingModal() {
        const overlay = el('addListingModal');
        if (!overlay) return;

        resetModalForm(); // Reset every time we open
        overlay.style.display = 'flex';

        setTimeout(() => {
            const titleInput = el('title');
            if (titleInput) titleInput.focus();
        }, 50);
    }

    // Close Modal
    function closeAddListingModal() {
        const overlay = el('addListingModal');
        if (overlay) overlay.style.display = 'none';
        resetModalForm(); 
    }

    // === 4. COMPONENT INITIALIZATIONS ===

    function initListingTypeDropdown() {
        const select = el('listingTypeSelect');
        const hidden = el('listingType');
        if (!select) return;

        select.addEventListener('change', function () {
            if (hidden) hidden.value = this.value;
            showBidFields(this.value === 'bid');
        });
    }

    function initCharCounter() {
        const title = el('title');
        const titleCount = el('titleCount');
        if (!title || !titleCount) return;

        title.addEventListener('input', () => {
            const len = title.value.replace(/\s/g, '').length;
            titleCount.textContent = len;
            titleCount.style.color =
                len >= 50 ? '#d32f2f' :
                len >= 40 ? '#f57c00' :
                '#757575';
        });
    }

    function initBidIncrementSlider() {
        const slider = el('bidIncrement');
        const valueEl = el('incrementValue');
        if (!slider || !valueEl) return;

        slider.addEventListener('input', () => {
            valueEl.textContent = slider.value + "%";
            const min = slider.min || 1;
            const max = slider.max || 20;
            const progress = ((slider.value - min) / (max - min)) * 100;
            slider.style.setProperty("--slider-progress", progress + "%");
        });
    }

    function initImagePreview() {
        const uploadArea = el('imageUploadArea');
        const imageInput = el('image');
        previewContainerEl = el('imagePreview');

        if (!uploadArea || !imageInput || !previewContainerEl) return;

        function renderPreviews() {
            previewContainerEl.innerHTML = '';
            // Revoke old URLs to free memory
            previewObjectURLs.forEach(url => URL.revokeObjectURL(url));
            previewObjectURLs = [];

            Array.from(fileListDT.files).forEach(file => {
                const key = `${file.name}_${file.size}_${file.lastModified}`;

                const item = document.createElement('div');
                item.className = 'preview-item';

                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                previewObjectURLs.push(img.src);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'preview-remove';
                btn.innerHTML = '&times;';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    removeFileByKey(key);
                };

                item.appendChild(img);
                item.appendChild(btn);
                previewContainerEl.appendChild(item);
            });
        }

        function removeFileByKey(key) {
            const remaining = Array.from(fileListDT.files).filter(f =>
                `${f.name}_${f.size}_${f.lastModified}` !== key
            );
            fileListDT = new DataTransfer();
            remaining.forEach(f => fileListDT.items.add(f));
            imageInput.files = fileListDT.files;
            renderPreviews();
        }

        function addFiles(newFiles) {
            let combined = Array.from(fileListDT.files).concat(Array.from(newFiles));
            if (combined.length > MAX_FILES) {
                combined = combined.slice(0, MAX_FILES);
            }

            fileListDT = new DataTransfer();
            combined.forEach(f => fileListDT.items.add(f));
            imageInput.files = fileListDT.files;
            renderPreviews();
        }

        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.closest('#uploadPlaceholder')) {
                imageInput.click();
            }
        });

        imageInput.addEventListener('change', () => addFiles(imageInput.files));

        uploadArea.addEventListener('dragover', e => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () =>
            uploadArea.classList.remove('drag-over')
        );

        uploadArea.addEventListener('drop', e => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            addFiles(e.dataTransfer.files);
        });
    }

    // === 5. FORM SUBMISSION LOGIC ===

    function initModalFormSubmission() {
        const form = el('modalListingForm');
        if (!form) return;

        // Use 'onsubmit' to overwrite any previous listeners if this function runs twice
        form.onsubmit = function (e) {
            e.preventDefault();

            const hiddenType = el('listingType');
            const isBid = hiddenType && hiddenType.value === 'bid';

            const title = el('title');
            const description = el('description');
            const category = el('category');
            const imageInput = el('image');
            const startPrice = el('starting_price');
            const startDate = el('start_date');
            const endDate = el('end_date');
            const files = imageInput.files;
            
            // --- Validation ---
            const titleLength = title ? title.value.replace(/\s/g, '').length : 0;
            if (!title || titleLength < 3) return showMsg('Title must be at least 3 characters.', 'error');
            if (titleLength > 50) return showMsg('Title cannot exceed 50 characters.', 'error');
            if (!description || description.value.trim().length < 10) return showMsg('Description too short.', 'error');
            if (!category || !category.value) return showMsg('Please select a category.', 'error');
            if (!files.length) return showMsg('Please upload at least one image.', 'error');

            for (let f of files) {
                if (f.size > MAX_FILE_SIZE) return showMsg(`Image "${f.name}" is too large (Max 10MB).`, 'error');
            }

            if (isBid) {
                if (!startPrice || parseFloat(startPrice.value) <= 0) return showMsg('Invalid starting price.', 'error');
                if (!startDate.value) return showMsg('Start date required.', 'error');
                if (!endDate.value) return showMsg('End date required.', 'error');

                const start = new Date(startDate.value);
                const end = new Date(endDate.value);
                const now = new Date();
                const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

                if (start < now) return showMsg('Start date cannot be in the past.', 'error');
                if (end <= oneHourFromNow) return showMsg('End date must be at least 1 hour from now.', 'error');
                if (end <= start) return showMsg('End date must be after start date.', 'error');
            }

            // --- Submission ---
            const formData = new FormData(this);
            if (hiddenType) formData.set('listingType', hiddenType.value);
            
            // Re-append files from our DataTransfer object
            // (Note: standard FormData(form) usually grabs the input files, 
            // but manually appending ensures our DT sync is respected)
            formData.delete('image'); 
            for (let f of files) {
                formData.append('image', f);
            }

            const submitBtn = form.querySelector('.create-btn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            fetch('../server/item/insert_item.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                const message = data?.message || 'Unknown response';
                const success = message.toLowerCase().includes('success');
                showMsg(message, success ? 'success' : 'error');

                if (success) {
                    setTimeout(() => {
                        closeAddListingModal();
                        // Optional: Refresh items if on a listing page
                        if (typeof fetchItems === 'function') {
                            fetchItems();
                        } else {
                            location.reload();
                        }
                    }, 1500);
                }
            })
            .catch(err => {
                console.error(err);
                showMsg('Error connecting to server.', 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        };
    }

    // === 6. MAIN INIT FUNCTION ===
    
    function initAddListingModal() {
        // Check if modal exists in DOM
        if (!document.getElementById('modalListingForm')) {
            setTimeout(initAddListingModal, 500);
            return;
        }

        console.log("Initializing Add Listing Modal Logic...");

        // --- Event Delegation for Buttons (Safe) ---
        // This attaches ONE listener to the body to catch clicks
        document.body.addEventListener('click', (e) => {
            // Only proceed if target exists
            if (!e.target) return;

            // 1. OPEN Button (#addItemBtn)
            // (Use .closest in case there's an icon inside the button)
            if (e.target.closest('#addItemBtn')) {
                e.preventDefault();
                openAddListingModal();
            }

            // 2. CLOSE Button (#modalClose)
            if (e.target.closest('#modalClose')) {
                e.preventDefault();
                closeAddListingModal();
            }

            // 3. CANCEL Button (#modalCancelBtn)
            if (e.target.closest('#modalCancelBtn')) {
                e.preventDefault();
                closeAddListingModal();
            }

            // 4. OVERLAY Background (#addListingModal)
            if (e.target.id === 'addListingModal') {
                closeAddListingModal();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', e => {
            const overlay = el('addListingModal');
            if (e.key === 'Escape' && overlay && overlay.style.display === 'flex') {
                closeAddListingModal();
            }
        });

        // --- Init Components ---
        initListingTypeDropdown();
        initCharCounter();
        initBidIncrementSlider();
        initModalFormSubmission();
        initImagePreview();

        // --- Initial State ---
        // We do not auto-open, but we prepare the state
        resetModalForm();
    }

    // === 7. EXECUTION TRIGGER ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAddListingModal);
    } else {
        initAddListingModal();
    }

})();