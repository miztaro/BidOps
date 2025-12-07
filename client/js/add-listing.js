console.log("add-listing.js loaded");

let fileListDT = new DataTransfer();
let previewObjectURLs = [];
let formState = null;
let filesState = [];
let previewContainerEl = null;

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// element helper
function el(id) { return document.getElementById(id); }

// clear image previews
function clearImagePreviews() {
    previewObjectURLs.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    previewObjectURLs = [];

    fileListDT = new DataTransfer();

    const input = el('image');
    if (input) input.files = fileListDT.files;

    if (previewContainerEl) previewContainerEl.innerHTML = '';
}

// open modal
function openAddListingModal() {
    const overlay = el('addListingModal');
    if (!overlay) return;
    overlay.style.display = 'flex';
    

    setTimeout(() => {
        const titleInput = el('title');
        if (titleInput) titleInput.focus();
    }, 50);
}

// close modal
function closeAddListingModal() {
    const overlay = el('addListingModal');
    if (overlay) overlay.style.display = 'none';
    resetModalForm();
    clearImagePreviews();
}

// reset modal
function resetModalForm() {
    const form = el('modalListingForm');
    if (form) form.reset();

    const msg = el('modalMessage');
    if (msg) msg.innerHTML = '';

    const select = el('listingTypeSelect');
    const hiddenType = el('listingType');
    if (select) select.value = 'bid';
    if (hiddenType) hiddenType.value = 'bid';

    showBidFields(true);

    const titleCount = el('titleCount');
    if (titleCount) titleCount.textContent = '0';

    const bidIncrement = el('bidIncrement');
    const incrementValue = el('incrementValue');

    if (bidIncrement && incrementValue) {
        incrementValue.textContent = bidIncrement.value + "%";
        bidIncrement.style.setProperty(
            "--slider-progress",
            (bidIncrement.value - bidIncrement.min) * 100 / (bidIncrement.max - bidIncrement.min) + "%"
        );
    }

    setDefaultDates();
}

// default date setup
function setDefaultDates() {
    const now = new Date();

    const formatDateTime = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}`;
    };

    const startDateInput = el('start_date');
    if (startDateInput) {
        const nowFormatted = formatDateTime(now);
        startDateInput.value = nowFormatted;
        startDateInput.min = nowFormatted;
    }

    const endDateInput = el('end_date');
    if (endDateInput) {
        endDateInput.value = "";
        endDateInput.min = "";
    }
}

// show/hide bid fields
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

// listing type dropdown
function initListingTypeDropdown() {
    const select = el('listingTypeSelect');
    const hidden = el('listingType');
    if (!select) return;

    select.addEventListener('change', function () {
        if (hidden) hidden.value = this.value;
        showBidFields(this.value === 'bid');
    });

    const initial = select.value || 'bid';
    if (hidden) hidden.value = initial;
    showBidFields(initial === 'bid');
}

// title character counter
function initCharCounter() {
    const title = el('title');
    const titleCount = el('titleCount');
    if (!title || !titleCount) return;

    const MAX = 50;

    function update() {
        const len = title.value.replace(/\s/g, '').length;
        titleCount.textContent = len;
        titleCount.style.color =
            len >= MAX ? '#d32f2f' :
            len >= MAX - 10 ? '#f57c00' :
            '#757575';
    }

    title.addEventListener('input', update);
    update();
}

// image previews
function initImagePreview() {
    const uploadArea = el('imageUploadArea');
    const imageInput = el('image');
    previewContainerEl = el('imagePreview');

    if (!uploadArea || !imageInput || !previewContainerEl) return;

    function renderPreviews() {
        previewContainerEl.innerHTML = '';
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

    // remove file
    function removeFileByKey(key) {
        const remaining = Array.from(fileListDT.files).filter(f =>
            `${f.name}_${f.size}_${f.lastModified}` !== key
        );
        fileListDT = new DataTransfer();
        remaining.forEach(f => fileListDT.items.add(f));
        imageInput.files = fileListDT.files;
        renderPreviews();
    }

    // add image files
function addFiles(newFiles) {
    let combined = Array.from(fileListDT.files).concat(Array.from(newFiles));
    
    if (combined.length > MAX_FILES) {
        combined = combined.slice(0, MAX_FILES);
    }

    // Reset DataTransfer and add combined files
    fileListDT = new DataTransfer();
    combined.forEach(f => fileListDT.items.add(f));
    imageInput.files = fileListDT.files;

    renderPreviews();
}

uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea) {
        imageInput.click();
    }
});

imageInput.addEventListener('change', () => {
    addFiles(imageInput.files);
});

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

renderPreviews();
}

// bid increment slider
function initBidIncrementSlider() {
    const slider = el('bidIncrement');
    const valueEl = el('incrementValue');
    if (!slider || !valueEl) return;

    function update() {
        const value = slider.value;
        valueEl.textContent = value + "%";

        const min = slider.min;
        const max = slider.max;
        const progress = ((value - min) / (max - min)) * 100;
        slider.style.setProperty("--slider-progress", progress + "%");
    }

    slider.addEventListener('input', update);
    update();
}

// form submission
function initModalFormSubmission() {
    const form = el('modalListingForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
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
        const titleLength = title ? title.value.replace(/\s/g, '').length : 0;

        // input field validations
        if (!title || titleLength < 3)
            return showMsg('Title must be at least 3 characters long.', 'error');

        if (titleLength > 50)
            return showMsg('Title cannot exceed 50 characters.', 'error');

        if (!description || description.value.replace(/\s/g, '').length < 10)
            return showMsg('Description must be at least 10 characters long.', 'error');

        if (!category || !category.value)
            return showMsg('Please select a category.', 'error');

        if (!files.length)
            return showMsg('Please upload at least one image.', 'error');

        for (let f of files) {
            if (f.size > MAX_FILE_SIZE)
                return showMsg(`Image "${f.name}" exceeds 10MB limit.`, 'error');
        }

        if (isBid) {
            if (!startPrice || parseFloat(startPrice.value) <= 0)
                return showMsg('Please enter a valid starting price.', 'error');

            if (!startDate.value)
                return showMsg('Please select a start date.', 'error');

            if (!endDate.value)
                return showMsg('Please select an end date.', 'error');

            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 3600000);

            if (start < now)
                return showMsg('Start date cannot be in the past.', 'error');

            if (end <= oneHourFromNow)
                return showMsg('Bid end date must be at least 1 hour from now.', 'error');

            if (end <= start)
                return showMsg('End date must be after start date.', 'error');
        }

        const formData = new FormData(this);

        if (hiddenType) formData.set('listingType', hiddenType.value);

        for (let f of files) formData.append('image', f);

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
                        if (typeof fetchItems === 'function') fetchItems();
                        else location.reload();
                    }, 1500);
                }
            })
            .catch(() => showMsg('Error creating listing. Please try again.', 'error'))
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
    });
}

function showMsg(text, type) {
    const msgDiv = el('modalMessage');
    if (!msgDiv) return;

    msgDiv.innerHTML = `<div class="message ${type}">${text}</div>`;

    if (type === 'success') {
        setTimeout(() => { msgDiv.innerHTML = ''; }, 3000);
    }
}


// initialize modal
function initAddListingModal() {
    // --- CHANGED SECTION START ---
    
    // We use document.addEventListener because the header is loaded dynamically.
    // By checking e.target.closest('#addItemBtn'), we capture clicks on ANY element
    // with that ID, whether it's in the header or the body.
    document.addEventListener('click', (e) => {
        if (e.target && e.target.closest('#addItemBtn')) {
            e.preventDefault();
            openAddListingModal();
        }
    });


    const closeBtn = el('modalClose');
    if (closeBtn) closeBtn.onclick = closeAddListingModal;

    const cancelBtn = el('modalCancelBtn');
    if (cancelBtn) cancelBtn.onclick = closeAddListingModal;

    const overlay = el('addListingModal');
    if (overlay) overlay.onclick = (e) => {
        if (e.target === overlay) closeAddListingModal();
    };

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeAddListingModal();
    });

    initListingTypeDropdown();
    initCharCounter();
    initBidIncrementSlider();
    initModalFormSubmission();
    initImagePreview();
}

// run after DOM ready
document.addEventListener('DOMContentLoaded', initAddListingModal);