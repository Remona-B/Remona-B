document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupBody = document.getElementById('popup-body');
  const closeBtn = popup.querySelector('.close');

  // Open popup with product data
  const openPopup = async (handle) => {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();

      const price = (product.price / 100).toFixed(2);

      // Variant options
      const optionsHtml = product.options.map((optName, idx) => {
        const values = [...new Set(product.variants.map(v => v[`option${idx + 1}`]))];
        return `
          <label style="display:block;margin:.5rem 0 .25rem;">${optName}</label>
          <select data-option-index="${idx}" 
                  style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;">
            ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        `;
      }).join('');

      // Popup content
      popupBody.innerHTML = `
        <div class="popup-product" style="display:flex;flex-direction:column;gap:1rem;">
          <img src="${product.images[0] || ''}" 
               alt="${product.title}" 
               style="width:100%;border-radius:8px;">

          <h2 style="margin:0;">${product.title}</h2>
          <p style="margin:.25rem 0;font-weight:bold;">
            ${Shopify.currency.active} ${price}
          </p>
          <div style="font-size:14px;line-height:1.4;color:#555;">
            ${product.body_html || ""}
          </div>

          <div class="popup-options" style="margin-top:1rem;">${optionsHtml}</div>

          <button id="popup-add"
                  style="margin-top:1.5rem;padding:.75rem 1rem;background:#000;color:#fff;
                         border:0;border-radius:6px;cursor:pointer;font-weight:bold;">
            Add to cart →
          </button>
        </div>
      `;

      popup.classList.remove('hidden');

      // Get selected variant
      const getSelectedVariantId = () => {
        const selects = popupBody.querySelectorAll('select[data-option-index]');
        const chosen = Array.from(selects).map(s => s.value);
        const variant = product.variants.find(v =>
          chosen.every((val, i) => v[`option${i + 1}`] === val)
        );
        return (variant || product.variants[0]).id;
      };

      // Add to cart handler
      document.getElementById('popup-add').onclick = async () => {
        const variantId = getSelectedVariantId();

        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        });

        popup.classList.add('hidden');
      };

    } catch (err) {
      console.error('Error loading product:', err);
    }
  };

  // Attach quick-view buttons
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  // Close popup
  closeBtn?.addEventListener('click', () => popup.classList.add('hidden'));
});
