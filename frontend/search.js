// ==========================
// search.js
// Advanced Product Search
// ==========================

// Products Array
let products = JSON.parse(localStorage.getItem("products")) || [];

// Search Elements
const searchInput = document.getElementById("searchInput");
const productContainer = document.getElementById("products");
const suggestionBox = document.getElementById("suggestions");

// ==========================
// Live Search
// ==========================

function searchProducts(){

let keyword = searchInput.value
.toLowerCase()
.trim();

if(keyword===""){

renderProducts(products);

suggestionBox.innerHTML="";

return;

}

let filtered = products.filter(product=>{

return (

product.name.toLowerCase().includes(keyword) ||

product.category.toLowerCase().includes(keyword) ||

String(product.price).includes(keyword)

);

});

renderProducts(filtered);

showSuggestions(filtered);

}
// ==========================
// SEARCH SUGGESTIONS
// ==========================

function showSuggestions(list){

suggestionBox.innerHTML = "";

if(searchInput.value.trim()==="") return;

if(list.length===0){

suggestionBox.innerHTML = `

<div class="suggestion-item">

❌ No Results Found

</div>

`;

return;

}

list.slice(0,5).forEach(product=>{

let div = document.createElement("div");

div.className = "suggestion-item";

div.innerHTML = `

<strong>${highlightText(product.name)}</strong>

<br>

<small>

${product.category}

&nbsp; | &nbsp;

₹${product.price}

</small>

`;

div.onclick = ()=>{

searchInput.value = product.name;

suggestionBox.innerHTML = "";

renderProducts([product]);

};

suggestionBox.appendChild(div);

});

}

// ==========================
// HIGHLIGHT MATCHING TEXT
// ==========================

function highlightText(text){

let keyword = searchInput.value.trim();

if(keyword==="") return text;

let regex = new RegExp(`(${keyword})`,"gi");

return text.replace(

regex,

"<mark>$1</mark>"

);

}

// ==========================
// CLEAR SEARCH
// ==========================

function clearSearch(){

searchInput.value="";

suggestionBox.innerHTML="";

renderProducts(products);

searchInput.focus();

}

// ==========================
// KEYBOARD NAVIGATION
// ==========================

let selectedIndex = -1;

searchInput.addEventListener("keydown",function(e){

let items =

document.querySelectorAll(".suggestion-item");

if(!items.length) return;

if(e.key==="ArrowDown"){

selectedIndex++;

if(selectedIndex>=items.length)

selectedIndex=0;

updateSelection(items);

}

if(e.key==="ArrowUp"){

selectedIndex--;

if(selectedIndex<0)

selectedIndex=items.length-1;

updateSelection(items);

}

if(e.key==="Enter"){

e.preventDefault();

if(selectedIndex>=0){

items[selectedIndex].click();

}

}

});

function updateSelection(items){

items.forEach(item=>{

item.classList.remove("active");

});

items[selectedIndex].classList.add("active");

}

// ==========================
// MOBILE SUPPORT
// ==========================

searchInput.addEventListener("input",searchProducts);

searchInput.addEventListener("focus",()=>{

if(searchInput.value.trim()!==""){

searchProducts();

}

});

document.addEventListener("click",(e)=>{

if(!searchInput.contains(e.target) &&
!suggestionBox.contains(e.target)){

suggestionBox.innerHTML="";

selectedIndex=-1;

}

});

// ==========================
// ESC KEY CLEAR
// ==========================

document.addEventListener("keydown",(e)=>{

if(e.key==="Escape"){

clearSearch();

}

});
// ==========================
// CATEGORY FILTER
// ==========================

function filterCategory(category){

if(category==="all"){

renderProducts(products);

return;

}

let filtered = products.filter(product=>

product.category.toLowerCase()===category.toLowerCase()

);

renderProducts(filtered);

}


// ==========================
// PRICE FILTER
// ==========================

function filterPrice(min,max){

let filtered = products.filter(product=>

product.price>=min && product.price<=max

);

renderProducts(filtered);

}


// ==========================
// RATING FILTER
// ==========================

function filterRating(rating){

let filtered = products.filter(product=>

(product.rating || 0)>=rating

);

renderProducts(filtered);

}


// ==========================
// SORT PRODUCTS
// ==========================

function sortProducts(type){

let sorted=[...products];

switch(type){

case "low":

sorted.sort((a,b)=>a.price-b.price);

break;

case "high":

sorted.sort((a,b)=>b.price-a.price);

break;

case "rating":

sorted.sort((a,b)=>

(b.rating||0)-(a.rating||0)

);

break;

case "new":

sorted.reverse();

break;

}

renderProducts(sorted);

}


// ==========================
// RENDER PRODUCTS
// ==========================

function renderProducts(list){

productContainer.innerHTML="";

if(list.length===0){

productContainer.innerHTML=`

<div class="no-results">

<h2>😔 No Products Found</h2>

<p>Try another search.</p>

</div>

`;

return;

}

list.forEach(product=>{

productContainer.innerHTML+=`

<div class="product-card">

<img src="${product.image}" alt="${product.name}">

<div class="product-info">

<h3>${product.name}</h3>

<p>${product.category}</p>

<div class="stars">

${"⭐".repeat(product.rating || 5)}

</div>

<h2>₹${product.price}</h2>

<div class="actions">

<button onclick='addToCart(${JSON.stringify(product)})'>

🛒 Cart

</button>

<button onclick='addToWishlist(${JSON.stringify(product)})'>

❤️ Wishlist

</button>

<button onclick='buyNow(${JSON.stringify(product)})'>

⚡ Buy

</button>

</div>

</div>

</div>

`;

});

}


// ==========================
// BUY NOW
// ==========================

function buyNow(product){

localStorage.setItem(

"checkoutItems",

JSON.stringify([

{

...product,

qty:1

}

])

);

window.location.href="orders.html";

}


// ==========================
// SEARCH ON PAGE LOAD
// ==========================

document.addEventListener("DOMContentLoaded",()=>{

renderProducts(products);

});


// ==========================
// LIVE SEARCH
// ==========================

searchInput.addEventListener(

"keyup",

searchProducts

);


// ==========================
// SEARCH BUTTON
// ==========================

const searchBtn=

document.getElementById("searchBtn");

if(searchBtn){

searchBtn.onclick=searchProducts;

}


// ==========================
// ENTER KEY
// ==========================

searchInput.addEventListener(

"keypress",

function(e){

if(e.key==="Enter"){

searchProducts();

}

});


// ==========================
// AUTO COMPLETE
// ==========================

searchInput.setAttribute(

"autocomplete",

"off"

);