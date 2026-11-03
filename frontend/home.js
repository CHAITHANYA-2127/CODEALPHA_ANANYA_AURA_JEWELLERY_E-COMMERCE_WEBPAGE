// ====================
// STORAGE
// ====================

const API_BASE_URL = "http://127.0.0.1:8000";
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentUserId = localStorage.getItem("user_id");
let frontendBaseUrl = document.currentScript
    ? new URL(".", document.currentScript.src).href
    : "";

function wishlistStorageKey() {
    return currentUserId ? `wishlist_${currentUserId}` : "wishlist_guest";
}

// ====================
// COUNTERS
// ====================

function updateCartCount() {
    let cartCountElement = document.getElementById("cartCount");

    if (cartCountElement) {
        cartCountElement.innerText = cart.reduce((total, item) => total + (Number(item.qty) || 1), 0);
    }
}

function updateWishlistCount() {
    let wishlistCountElement = document.getElementById("wishlistCount");

    if (wishlistCountElement) {
        let savedWishlist = JSON.parse(localStorage.getItem(wishlistStorageKey())) || wishlist;
        wishlistCountElement.innerText = savedWishlist.length;
    }
}

function requireLogin() {
    currentUserId = localStorage.getItem("user_id");

    if (!currentUserId) {
        alert("Please login first");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

function productPayload(name, price, image, productId, category, description) {
    return {
        user_id: currentUserId,
        product_id: productId || "",
        name: name,
        price: Number(price) || 0,
        image: image || "",
        category: category || "Jewellery",
        description: description || "Premium jewellery collection from Ananya Aura."
    };
}

function refreshUserCounts() {
    if (!currentUserId) {
        updateCartCount();
        updateWishlistCount();
        return;
    }

    fetch(`${API_BASE_URL}/cart-count/${currentUserId}/`)
        .then(response => response.json())
        .then(data => {
            let cartCountElement = document.getElementById("cartCount");
            if (cartCountElement) cartCountElement.innerText = data.count || 0;
        })
        .catch(() => updateCartCount());

    fetch(`${API_BASE_URL}/wishlist-count/${currentUserId}/`)
        .then(response => response.json())
        .then(data => {
            let wishlistCountElement = document.getElementById("wishlistCount");
            if (wishlistCountElement) wishlistCountElement.innerText = data.count || 0;
        })
        .catch(() => updateWishlistCount());
}

// ====================
// CART
// ====================

function addToCart(name, price, image, productId, category, description) {
    if (!requireLogin()) return;

    fetch(`${API_BASE_URL}/add-cart/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(productPayload(name, price, image, productId, category, description))
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert(data.message || "Could not add to cart");
                return;
            }

            refreshUserCounts();
            alert(name + " Added To Cart Successfully!");
        })
        .catch(error => {
            console.log("Cart fallback:", error);
            cart.push({
                name: name,
                price: Number(price),
                image: image,
                qty: 1
            });
            localStorage.setItem("cart", JSON.stringify(cart));
            refreshUserCounts();
            alert(name + " Added To Cart Successfully!");
        });
}

function clearCart() {
    localStorage.removeItem("cart");
    cart = [];
    updateCartCount();
    alert("Cart Cleared!");
}

// ====================
// WISHLIST
// ====================

function addToWishlist(name, price, image, productId, category, description) {
    if (!requireLogin()) return;

    fetch(`${API_BASE_URL}/add-wishlist/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(productPayload(name, price, image, productId, category, description))
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message || (data.success ? "Added To Wishlist" : "Already In Wishlist"));
            if (data.success && data.item) {
                wishlist = JSON.parse(localStorage.getItem(wishlistStorageKey())) || [];
                if (!wishlist.some(item => item.id === data.item.id || item.product_id === data.item.product_id)) {
                    wishlist.push(data.item);
                    localStorage.setItem(wishlistStorageKey(), JSON.stringify(wishlist));
                    localStorage.setItem("wishlist", JSON.stringify(wishlist));
                }
            }
            refreshUserCounts();
        })
        .catch(error => {
            console.log("Wishlist fallback:", error);
            wishlist = JSON.parse(localStorage.getItem(wishlistStorageKey())) || [];
            if (!wishlist.some(item => item.name === name)) {
                wishlist.push({ name: name, price: Number(price), image: image });
                localStorage.setItem(wishlistStorageKey(), JSON.stringify(wishlist));
                localStorage.setItem("wishlist", JSON.stringify(wishlist));
            }
            refreshUserCounts();
            alert(name + " Added To Wishlist!");
        });
}

// ====================
// BUY NOW
// ====================

function buyNow(name, price, image) {
    let item = [{
        name: name,
        price: Number(price),
        image: image,
        qty: 1
    }];

    localStorage.setItem("checkoutItems", JSON.stringify(item));
    localStorage.setItem("checkoutSource", "buyNow");
    window.location.href = "orders.html";
}

// ====================
// PRODUCT TABS
// ====================

function scrollToProducts() {
    let womenSection = document.getElementById("womenProducts");

    if (womenSection) {
        womenSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}

function showWomen() {
    let women = document.getElementById("womenProducts");
    let men = document.getElementById("menProducts");
    let womenBtn = document.getElementById("womenBtn");
    let menBtn = document.getElementById("menBtn");

    if (women) women.style.display = "grid";
    if (men) men.style.display = "none";
    if (womenBtn) womenBtn.classList.add("active-tab");
    if (menBtn) menBtn.classList.remove("active-tab");
}

function showMen() {
    let women = document.getElementById("womenProducts");
    let men = document.getElementById("menProducts");
    let womenBtn = document.getElementById("womenBtn");
    let menBtn = document.getElementById("menBtn");

    if (women) women.style.display = "none";
    if (men) men.style.display = "grid";
    if (menBtn) menBtn.classList.add("active-tab");
    if (womenBtn) womenBtn.classList.remove("active-tab");
}

function categoryTab(category) {
    let menCategories = ["chain", "pendant necklace", "brooch", "cuff", "bracelet", "watch"];
    return menCategories.includes((category || "").toLowerCase()) ? "men" : "women";
}

function applySelectedCategory(clearAfterApply = true) {
    let selectedCategory = localStorage.getItem("selectedCategory");

    if (!selectedCategory) {
        return false;
    }

    if (categoryTab(selectedCategory) === "men") {
        showMen();
    } else {
        showWomen();
    }

    let keyword = selectedCategory.toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".product-card").forEach(card => {
        let titleElement = card.querySelector("h3");
        let title = titleElement ? titleElement.innerText.toLowerCase() : "";
        let matches = title.includes(keyword);
        card.style.display = matches ? "" : "none";
        if (matches) visibleCount += 1;
    });

    if (clearAfterApply) {
        localStorage.removeItem("selectedCategory");
    }

    return visibleCount > 0;
}

// ====================
// SEARCH
// ====================

function searchProducts() {
    let searchInput = document.getElementById("searchInput");
    let input = searchInput ? searchInput.value.toLowerCase() : "";
    let cards = document.querySelectorAll(".product-card");

    cards.forEach(function(card) {
        let titleElement = card.querySelector("h3");
        let title = titleElement ? titleElement.innerText.toLowerCase() : "";

        card.style.display = title.includes(input) ? "" : "none";
    });
}

// ====================
// THEME
// ====================

function toggleTheme() {
    if (document.body.classList.contains("light")) {
        document.body.classList.remove("light");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.add("light");
        localStorage.setItem("theme", "light");
    }
}

function applySavedTheme() {
    let savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light");
    }
}

// ====================
// ADMIN PRODUCTS
// ====================

function addImageNameVariants(paths, value) {
    if (!value) {
        return;
    }

    let cleanValue = String(value)
        .trim()
        .toLowerCase()
        .replace(/^["']|["']$/g, "")
        .replaceAll("\\", "/");

    let fileName = cleanValue.split("/").pop();
    let baseName = fileName.replace(/\.(jpeg|jpg|png|webp)$/i, "");
    let compactName = baseName.replace(/[^a-z0-9]/g, "");
    let spacedName = baseName.replace(/[-_]+/g, " ");

    [fileName, baseName, compactName, spacedName].forEach(function(name) {
        if (!name) {
            return;
        }

        paths.push(name);

        if (!name.includes(".")) {
            paths.push(name + ".jpeg");
            paths.push(name + ".jpg");
            paths.push(name + ".png");
            paths.push(name + ".webp");
        }
    });
}

function addFrontendUrlVariants(paths) {
    if (!frontendBaseUrl) {
        return;
    }

    paths.slice().forEach(function(path) {
        if (
            path &&
            !path.startsWith("http://") &&
            !path.startsWith("https://") &&
            !path.startsWith("data:")
        ) {
            paths.push(new URL(path, frontendBaseUrl).href);
        }
    });
}

function getProductImagePaths(product) {
    let image = product.image || "";
    let paths = [];

    image = String(image)
        .trim()
        .replace(/^["']|["']$/g, "")
        .replaceAll("\\", "/");

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:")
    ) {
        return [image];
    }

    if (image.startsWith("frontend/")) {
        paths.push(image.replace("frontend/", ""));
    }

    if (image.startsWith("images/")) {
        paths.push(image.replace("images/", ""));
    }

    if (image.startsWith("/media/") || image.startsWith("media/")) {
        paths.push("http://127.0.0.1:8000/" + image.replace(/^\/+/, ""));
    }

    let fileName = image.split("/").pop();

    addImageNameVariants(paths, image);
    addImageNameVariants(paths, product.name);

    paths.push(fileName);
    paths.push("./" + fileName);
    paths.push("/" + fileName);
    paths.push("frontend/" + fileName);
    paths.push("/frontend/" + fileName);
    paths.push("images/" + fileName);
    paths.push("/images/" + fileName);
    paths.push(image);

    addFrontendUrlVariants(paths);

    return [...new Set(paths.filter(Boolean))];
}

function createProductCard(product) {
    let name = product.name || "Product";
    let price = Number(product.price) || 0;
    let imagePaths = getProductImagePaths(product);
    let imageIndex = 0;
    let image = imagePaths[imageIndex] || "";

    let card = document.createElement("div");
    card.className = "product-card admin-product-card";
    card.dataset.adminProductId = product.id || name;

    let imageElement = document.createElement("img");
    imageElement.src = image;
    imageElement.alt = name;
    imageElement.style.cursor = "pointer";
    imageElement.addEventListener("click", function() {
        openProduct(name, price, image, product.id, product.category, product.description);
    });
    imageElement.onerror = function() {
        imageIndex += 1;

        if (imagePaths[imageIndex]) {
            image = imagePaths[imageIndex];
            imageElement.src = image;
            return;
        }

        imageElement.onerror = null;
        imageElement.style.display = "none";
        console.log("Product image not found:", product.image);
    };

    let title = document.createElement("h3");
    title.innerText = name;

    let priceElement = document.createElement("p");
    priceElement.innerHTML = "&#8377;" + price.toLocaleString("en-IN");

    let cartButton = document.createElement("button");
    cartButton.type = "button";
    cartButton.innerText = "Add To Cart";
    cartButton.addEventListener("click", function() {
        addToCart(name, price, image, product.id, product.category, product.description);
    });

    let wishlistButton = document.createElement("button");
    wishlistButton.type = "button";
    wishlistButton.innerHTML = "&#10084;&#65039; Wishlist";
    wishlistButton.addEventListener("click", function() {
        addToWishlist(name, price, image, product.id, product.category, product.description);
    });

    let buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.innerHTML = "&#9889; Buy Now";
    buyButton.addEventListener("click", function() {
        buyNow(name, price, image);
    });

    card.appendChild(imageElement);
    card.appendChild(title);
    card.appendChild(priceElement);
    card.appendChild(cartButton);
    card.appendChild(wishlistButton);
    card.appendChild(buyButton);

    return card;
}

function productAlreadyShown(product) {
    let productNames = Array.from(document.querySelectorAll(".product-card h3"))
        .map(title => title.innerText.trim().toLowerCase());

    return productNames.includes((product.name || "").trim().toLowerCase());
}

function appendAdminProducts(products) {
    let womenContainer = document.getElementById("womenProducts");
    let menContainer = document.getElementById("menProducts");
    let addedWomen = 0;
    let addedMen = 0;

    if (!womenContainer || !menContainer || !Array.isArray(products)) {
        return { women: 0, men: 0 };
    }

    products.forEach(function(product) {
        if (productAlreadyShown(product)) {
            return;
        }

        let category = (product.category || "").toLowerCase();
        let container = category === "men" ? menContainer : womenContainer;

        container.appendChild(createProductCard(product));

        if (category === "men") {
            addedMen += 1;
        } else {
            addedWomen += 1;
        }
    });

    return { women: addedWomen, men: addedMen };
}

function loadAdminProducts() {
    fetch("http://127.0.0.1:8000/products/")
        .then(function(response) {
            if (!response.ok) {
                throw new Error("Products request failed");
            }

            return response.json();
        })
        .then(function(products) {
            appendAdminProducts(products);
            applySelectedCategory(true);
        })
        .catch(function(error) {
            console.log("Admin products could not be loaded:", error);
            applySelectedCategory(true);
        });
}

// ====================
// PAGE LOAD
// ====================

document.addEventListener("DOMContentLoaded", function() {
    applySavedTheme();
    refreshUserCounts();
    let selectedCategory = localStorage.getItem("selectedCategory");
    let tab = selectedCategory
        ? categoryTab(selectedCategory)
        : new URLSearchParams(window.location.search).get("tab") || localStorage.getItem("selectedHomeTab") || "women";

    if (tab === "men") {
        showMen();
    } else {
        showWomen();
    }

    applySelectedCategory(false);
    localStorage.removeItem("selectedHomeTab");
    loadAdminProducts();
});
function openProduct(name, price, image, id, category, description){
    if (arguments.length === 1 && !isNaN(Number(name))) {
        window.location.href = `product_details.html?id=${name}`;
        return;
    }

    let product = {
        id: id || "",
        name: name,
        price: Number(price) || 0,
        image: image,
        category: category || "Jewellery",
        description: description || "Premium jewellery collection from Ananya Aura."
    };

    localStorage.setItem("selectedProduct", JSON.stringify(product));
    localStorage.setItem("productName", product.name);
    localStorage.setItem("productPrice", product.price);
    localStorage.setItem("productImage", product.image);

    let url = "product_details.html";
    if (product.id) {
        url += "?id=" + encodeURIComponent(product.id);
    }

    window.location.href = url;
}
function openCategory(category){

localStorage.setItem(
"selectedCategory",
category
);

localStorage.setItem(
"selectedHomeTab",
categoryTab(category)
);

window.location.href = "home.html";

}
