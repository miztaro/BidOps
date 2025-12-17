//Edit Overlay
//import { getStatusClass } from '../profilepage.js';

document.addEventListener('DOMContentLoaded', function () {
  const editOverlay = document.querySelector(".edit-overlay");
  document.addEventListener("click", (event) => {
    const editButton = event.target.closest(".edit-btn");
    if (editButton) {
      const itemId = editButton.getAttribute("data-id");
      if (!itemId) {
        alert("Item ID not found.");
        return;
      }

      editOverlay.classList.add("active");
      fetchItemData(itemId);    
    }
  });
  

  document.querySelector(".form-container").addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!this.checkValidity()) {
      this.reportValidity();
      return;
    }

    // Detect changes in fields
    const fields = ['item-name', 'category', 'description', 'start-price', 'end-date'];
    let changed = fields.some(id => {
      const input = document.getElementById(id);
      return input && input.value !== input.dataset.original;
    });

    // Detect changes in images
    const originalImages = JSON.parse(document.getElementById('image-container').dataset.originalImages || '[]');
    if (images.length !== originalImages.length || removedImages.length > 0 || newFiles.length > 0) {
      changed = true;
    }

    if (!changed) {
      alert("No changes detected.");
      document.querySelector(".edit-overlay").classList.remove("active");
      return;
    }

    const formData = new FormData(this);

    // Append removed images (URLs to delete from DB)
    formData.append('removed_images', JSON.stringify(removedImages));

    // Append new files
    newFiles.forEach((file, i) => {
      formData.append('images[]', file, file.name);
    });

    // Append remaining existing images
    const existingImages = images.filter(src => typeof src === 'string' && !src.startsWith('data:'));
    formData.append('existing_images', JSON.stringify(existingImages));

    fetch("../server/item/update_item.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Item updated!");
          document.querySelector(".edit-overlay").classList.remove("active");
          removedImages = [];
          newFiles = [];
        } else {
          alert("Update failed: " + data.message);
        }
      })
      .catch(err => console.error(err));
  });

  const editCancelButton = document.querySelector(".edit-cancel-btn");
  editCancelButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const inputs = document.querySelectorAll(".form-container input, .form-container textarea, .form-container select");
    inputs.forEach(input => {
      if (input.dataset.original !== undefined) {
        input.value = input.dataset.original;
      }
    });

    const imageContainer = document.getElementById('image-container');
    if (imageContainer.dataset.originalImages) {
      const originalImages = JSON.parse(imageContainer.dataset.originalImages);

      images = [...originalImages];
      newFiles = [];
      removedImages = [];

      renderImages();
    }
    editOverlay.classList.remove("active");
  });

  async function fetchItemData(itemId) {
    try {
      const response = await fetch(`../server/item/get_item_single.php?id=${itemId}`);
      const data = await response.json();
      populateForm(data);
    } catch (error) {
      console.error("Error fetching item data:", error);
    }
  }

  function getStatusClass(status) {
    status = status.toLowerCase();
    if (status.includes("active")) return "active-items";
    if (status.includes("pending")) return "pending-items";
    if (status.includes("rejected")) return "rejected-items";
    if (status.includes("sold")) return "sold-items";
    return "";
  }

  let images = [];
  let removedImages = [];
  let newFiles = [];

  function populateForm(data) {
    const item = data.item;
    const bid = data.bid;
    const existingImages = Array.isArray(data.images) ? data.images : [];
    const categories = data.categories || [];
    const statusDisplayDiv = document.getElementById('status-display');
    const statusClass = getStatusClass(item.status);

    images = [
      ...existingImages,
      ...images.filter(img => img instanceof File)
    ];

    removedImages = [];
    const imageContainer = document.getElementById('image-container');
    imageContainer.dataset.originalImages = JSON.stringify(existingImages);
    renderImages();

    // Inputs
    const itemIdInput = document.getElementById('item-id');
    const itemNameInput = document.getElementById('item-name');
    const categoryInput = document.querySelector('.item-info-field .category-sec .category');
    const descriptionInput = document.querySelector('.description-field .description');
    const statusHiddenInput = document.getElementById('status-hidden');
    const startPriceInput = document.getElementById('start-price');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const modeFieldH3 = document.querySelector('.mode-field h3');
    const itemTypeInput = document.getElementById('item-type');
    itemTypeInput.value = item.item_type || '';

    // Set values
    itemIdInput.value = item.item_id;
    itemNameInput.value = item.title;
    // categoryInput.value = item.category_type;
    descriptionInput.value = item.description;
    statusDisplayDiv.textContent = item.status;
    statusDisplayDiv.className = `status-display ${statusClass}`;
    statusHiddenInput.value = item.status;

    const isSwap = item.item_type?.toLowerCase() === "swap";
    if (modeFieldH3) {
      modeFieldH3.textContent = isSwap ? "Swap" : "Bid";
    }

    const priceFieldSection = document.querySelector('.price-field');
    if (priceFieldSection) {
      if (isSwap) {
        priceFieldSection.style.display = 'none';

        startPriceInput.required = false;
        endDateInput.required = false;

        startPriceInput.disabled = true;
        startDateInput.disabled = true;
        endDateInput.disabled = true;

      } else {
        priceFieldSection.style.display = 'flex';

        startPriceInput.required = true;
        endDateInput.required = true;

        startPriceInput.disabled = false;
        startDateInput.disabled = false;
        endDateInput.disabled = false;

        startPriceInput.value = bid ? bid.starting_price : 0;
        startDateInput.value = bid ? formatDateTimeLocal(bid.start_date) : formatDateTimeLocal(new Date());
        startDateInput.readOnly = true;
        endDateInput.value = bid ? formatDateTimeLocal(bid.end_date) : '';
      }
    }

    categoryInput.innerHTML = '';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      if (cat === item.category_type) option.selected = true;
      categoryInput.appendChild(option);
    });

    // Store original values for reset
    itemIdInput.dataset.original = itemIdInput.value;
    itemNameInput.dataset.original = itemNameInput.value;
    categoryInput.dataset.original = categoryInput.options[categoryInput.selectedIndex].value;
    descriptionInput.dataset.original = descriptionInput.value;
    statusDisplayDiv.dataset.original = statusDisplayDiv.textContent;
    statusHiddenInput.dataset.original = statusHiddenInput.value;
    startPriceInput.dataset.original = startPriceInput.value;
    startDateInput.dataset.original = startDateInput.value;
    endDateInput.dataset.original = endDateInput.value;
  }

  // Render images (existing + new)
  function renderImages() {
    const imageContainer = document.getElementById('image-container');
    imageContainer.innerHTML = '';

    images.forEach((img, index) => {
      const div = document.createElement('div');
      div.classList.add('image-preview');

      const imgSrc = img instanceof File
        ? URL.createObjectURL(img)
        : `../server/item/${img}`;

      div.innerHTML = `
            <img src="${imgSrc}" alt="">
            <button class="remove-btn">&times;</button>
        `;

      div.querySelector('.remove-btn').addEventListener('click', () => {
        if (img instanceof File) {
          const fileIndex = newFiles.indexOf(img);
          if (fileIndex > -1) newFiles.splice(fileIndex, 1);
        } else {
          removedImages.push(img);
        }
        images.splice(index, 1);
        renderImages();
      });
      imageContainer.appendChild(div);
    });
  }

  document.getElementById('image-upload').addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    files.forEach(file => {
      images.push(file);
      newFiles.push(file);
    });

    renderImages();
    event.target.value = '';
  });

  function formatDateTimeLocal(dt) {
    if (!dt) return '';
    const d = new Date(dt);
    if (isNaN(d)) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});