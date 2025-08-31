document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupImage = document.getElementById('popup-image');
  const popupTitle = document.getElementById('popup-title');
  const popupPrice = document.getElementById('popup-price');
  const popupDesc = document.getElementById('popup-description');
  const popupOptions = document.getElementById('popup-options');
  const addBtn = document.getElementById('popup-add');
  const closeBtn = popup.querySelector('.close');

  let currentProduct = null;

  // Open popup
  async function openPopup(handle) {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;

      // Fill content
      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `${Shopify.currency.active} ${(product.price / 100).toFixed(2)}`;
      popupDesc.innerHTML = product.body_html || "";

      // Build dropdowns for options
      popupOptions.innerHTML = '';
      product.options.forEach((optName, idx) => {
        const values = [...new Set(product.variants.map(v => v[`option${idx + 1}`]))];

        const wrapper = document.createElement('div');
        wrapper.className = 'popup-option';
        wrapper.innerHTML = `
          <label style="display:block;margin:.5rem 0 .25rem;font-weight:500;">
            ${optName}
          </label>
          <select data-option-index="${idx}"
                  style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;">
            ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        `;
        popupOptions.appendChild(wrapper);
      });

      popup.classList.remove('hidden');
    } catch (err) {
      console.error('Error loading product:', err);
    }
  }

  // Get currently selected variant
  function getSelectedVariantId() {
    if (!currentProduct) return null;
    const selects = popupOptions.querySelectorAll('select[data-option-index]');
    const chosen = Array.from(selects).map(s => s.value);
    const variant = currentProduct.variants.find(v =>
      chosen.every((val, i) => v[`option${i + 1}`] === val)
    );
    return (variant || currentProduct.variants[0]).id;
  }

  // Add to cart
  addBtn.addEventListener('click', async () => {
    const variantId = getSelectedVariantId();
    if (!variantId) return;

    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });
      popup.classList.add('hidden');
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  });

  // Attach quick-view triggers
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  // Close popup
  closeBtn?.addEventListener('click', () => popup.classList.add('hidden'));
});
