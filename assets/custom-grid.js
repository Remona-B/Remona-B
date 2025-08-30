document.addEventListener("DOMContentLoaded", ()=> {
  const buttons= document.querySelectorAll(".view-details");

  const popup= document.getElementById("product-popup");
  const popupBody= document.getElementById("popup-body");
  const closeBtn =popup.quertSelector(".close");

  buttons.forEach(btn => {
    btn.addEventListener("click", async() => {
      const handle = btn.dataset.handle;
      const response = await fetch('/products/${handle}.js');
      const product = await response.json();

      popupBody.innerHTML ='
        <h2>${product.title}</h2>
        <img src ="${product.image[0]}" style="max-width:100%; border-radius:10px">
        <p>${(product.price/100).toFixed(2)} ${Shopify.currency.active}</p>
        <button id="add-to-cart" data-id="${product.variants[0].id}">Add to Cart</button>
      ';

      popup.classList.remove("hidden");

      document.getElementById("add-to-cart").addEventListener("click", async(e) =>{
        let id = e.target.dataset.id;
        await fetch("/cart/add.js", {
          method:"POST",
          headers: {"Content=Type" : "application/json"},
          body: J SON  .STRINGIFY({  id, quantity:1})
        });
        alert("Added to cart!");
      });
    });
  });

  closeBtn.addEventListener("click", ()=> popup.classList.add("hidden"));
});
