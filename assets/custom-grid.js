document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupBody = document.getElementById('popup-body');
  const closeBtn = document.querySelector('#product-popup .close');

  // Open product popup by handle
  const openPopup = async (handle) => {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();

      const price = (product.price / 100).toFixed(2);

      // Build variant options
      const optionsHtml = product.options
        .map((optName, idx) => {
          const values = [...new Set(product.variants.map(v => v[`option${idx + 1}`]))];

          // Style Color as buttons, others as dropdown
          if (optName.toLowerCase() === "color") {
            return `
              <label style="display:block;margin:.5rem 0 .25rem 0;font-weight:500;">${optName}</label>
              <div class="color-options" data-option-index="${idx}" style="display:flex;gap:.5rem;flex-wrap:wrap;">
                ${values.map(v => `
                  <button type="button" 
                    class="color-btn" 
                    data-value="${v}" 
                    style="padding:.5rem 1rem;border:1px solid #000;background:#fff;cursor:pointer;border-radius:6px;">
                    ${v}
                  </button>
                `).join('')}
              </div>
            `;
          } else {
            return `
              <label style="display:block;margin:.5rem 0 .25rem 0;font-weight:500;">${optName}</label>
              <select data-option-index="${idx}" 
                style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;">
                ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
            `;
          }
        })
        .join('');

      // Build popup content
      popupBody.innerHTML = `
        <div class="popup-product" style="text-align:left;">
          <img src="${product.images[0] || ''}" 
               alt="${product.title}" 
               style="width:100%;max-width:200px;margin:0 auto 1rem;display:block;border-radius:8px;">
          
          <h2 style="margin:0 0 .5rem 0;font-size:1.25rem;">${product.title}</h2>
          <p style="margin:0 0 1rem 0;font-weight:bold;font-size:1.1rem;">
            ${Shopify.currency.active} ${price}
          </p>
          
          <p style="margin:0 0 1rem 0;font-size:.9rem;color:#444;">
            ${product.description?.substring(0,150) || ''}
          </p>

          <div class="popup-options">${optionsHtml}</div>

          <button id="popup-add" 
            style="margin-top:1.5rem;width:100%;padding:.75rem 1rem;background:#000;color:#fff;
                   border:0;border-radius:6px;cursor:pointer;font-size:1rem;text-transform:uppercase;">
            Add to Cart →
          </button>
        </div>
      `;

      popup.classList.remove('hidden');

      // Helper: get currently selected variant
      const getSelectedVariantId = () => {
        const chosen = [];

        product.options.forEach((optName, idx) => {
          if (optName.toLowerCase() === "color") {
            const activeBtn = popupBody.querySelector(`.color-options[data-option-index="${idx}"] .active`);
            if (activeBtn) chosen[idx] = activeBtn.dataset.value;
          } else {
            const select = popupBody.querySelector(`select[data-option-index="${idx}"]`);
            if (select) chosen[idx] = select.value;
          }
        });

        const variant = product.variants.find(v =>
          chosen.every((val, i) => v[`option${i + 1}`] === val)
        );
        return (variant || product.variants[0]).id;
      };

      // Activate color buttons
      popupBody.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const parent = btn.closest('.color-options');
          parent.querySelectorAll('.color-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = '#fff';
            b.style.color = '#000';
          });
          btn.classList.add('active');
          btn.style.background = '#000';
          btn.style.color = '#fff';
        });
      });

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

  // Attach popup opener to "+" quick-view buttons
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => popup.classList.add('hidden'));
  }
});
