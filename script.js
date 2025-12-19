// script.js - УПРОЩЕННАЯ ВЕРСИЯ С РАБОЧЕЙ ЗАГРУЗКОЙ
// ======================
// 1. НАСТРОЙКИ С СИСТЕМОЙ ФАЛЛБЭКОВ
// ======================
const GITHUB_URLS = [
    // Основная ссылка на GitHub
    "https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json",
    // Альтернативная ссылка (если основная не работает)
    "https://cdn.jsdelivr.net/gh/sashaG7658/lavkatest/products.json",
    // Raw.githack (третий вариант)
    "https://raw.githack.com/sashaG7658/lavkatest/main/products.json"
];

// Стартовые товары (на случай если ни одна ссылка не работает)
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "ICEBERG ULTRA MENTHOL",
        description: "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg"
    },
    {
        id: 2,
        name: "ICEBERG ULTRA BLACK",
        description: "ICEBERG ULTRA BLACK (150 МГ) - ТУТТИ-ФРУТТИ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg"
    },
    {
        id: 3,
        name: "ICEBERG ULTRA CRAZY MIX",
        description: "ICEBERG ULTRA CRAZY MIX - МУЛЬТИФРУТ, ЦИТРУС",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4960/629642080/large_36DE056D-C798-404C-A1A4-098A258FFE2B.jpg"
    }
];

let products = [];
let cart = [];
let tg = null;
let currentTheme = 'light';

// ======================
// 2. ИНИЦИАЛИЗАЦИЯ TELEGRAM
// ======================
function initTelegram() {
    try {
        tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            
            // Определяем тему
            currentTheme = tg.colorScheme === 'dark' ? 'dark' : 'light';
            document.body.classList.add(`${currentTheme}-theme`);
            
            // Настраиваем кнопку
            tg.MainButton.setText("Корзина");
            tg.MainButton.onClick(openCart);
            
            console.log('✅ Telegram WebApp инициализирован');
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
    }
}

// ======================
// 3. ЗАГРУЗКА ТОВАРОВ С ФАЛЛБЭКАМИ
// ======================
async function loadProducts() {
    const catalog = document.getElementById('catalog');
    
    if (catalog) {
        catalog.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #FF9800; margin-bottom: 15px;"></i>
                <p style="color: var(--text-color);">Загрузка товаров...</p>
            </div>
        `;
    }
    
    // Пробуем загрузить с каждой ссылки по очереди
    for (let i = 0; i < GITHUB_URLS.length; i++) {
        const url = GITHUB_URLS[i];
        console.log(`🔄 Пробую загрузить с: ${url}`);
        
        try {
            const response = await fetch(`${url}?t=${Date.now()}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    products = data;
                    console.log(`✅ Успешно загружено ${products.length} товаров с ${url}`);
                    
                    // Сохраняем успешную ссылку
                    localStorage.setItem('iceberg_success_url', url);
                    localStorage.setItem('iceberg_products', JSON.stringify(products));
                    localStorage.setItem('iceberg_last_update', new Date().toISOString());
                    
                    renderProducts();
                    showNotification(`✅ Загружено ${products.length} товаров`);
                    return products;
                }
            }
        } catch (error) {
            console.log(`❌ Ошибка загрузки с ${url}:`, error.message);
            continue; // Пробуем следующую ссылку
        }
    }
    
    // Если все ссылки не работают, пробуем загрузить из localStorage
    console.log('🔄 Все ссылки не работают, пробую загрузить из localStorage...');
    
    try {
        const savedProducts = localStorage.getItem('iceberg_products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            console.log(`✅ Загружено ${products.length} товаров из localStorage`);
            renderProducts();
            showNotification('⚠️ Используются сохраненные товары');
            return products;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки из localStorage:', error);
    }
    
    // Если ничего не работает, используем дефолтные товары
    console.log('🔄 Использую дефолтные товары');
    products = DEFAULT_PRODUCTS;
    renderProducts();
    showNotification('⚠️ Используются базовые товары');
    
    // Сохраняем дефолтные товары
    localStorage.setItem('iceberg_products', JSON.stringify(products));
    
    return products;
}

// ======================
// 4. ОСНОВНЫЕ ФУНКЦИИ (упрощенные)
// ======================
function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        console.error('❌ Ошибка загрузки корзины:', error);
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('iceberg_cart', JSON.stringify(cart));
        updateCartUI();
        updateTelegramButton();
    } catch (error) {
        console.error('❌ Ошибка сохранения корзины:', error);
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('❌ Товар не найден');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    showNotification(`✅ ${product.name} добавлен в корзину`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    showNotification("🗑️ Товар удален из корзины");
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity < 1) {
        removeFromCart(productId);
    } else {
        saveCart();
    }
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm("Очистить всю корзину?")) {
        cart = [];
        saveCart();
        showNotification("🛒 Корзина очищена");
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateTelegramButton() {
    if (!tg) return;
    
    const count = getCartCount();
    if (count > 0) {
        tg.MainButton.setText(`Корзина (${count})`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// ======================
// 5. ОТОБРАЖЕНИЕ
// ======================
function renderProducts() {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    if (products.length === 0) {
        catalog.innerHTML = `
            <div class="error" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FF9800; margin-bottom: 20px;"></i>
                <h3 style="color: var(--text-color); margin-bottom: 10px;">Нет товаров для отображения</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Попробуйте обновить страницу</p>
                <button onclick="loadProducts()" style="
                    background: #FF9800;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-sync-alt"></i> Обновить
                </button>
            </div>
        `;
        return;
    }

    catalog.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200/FF9800/FFFFFF?text=ICEBERG'">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">${product.price} ₽</div>
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> В корзину
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCartUI() {
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
        const count = getCartCount();
        cartCounter.textContent = count;
        cartCounter.style.display = count > 0 ? 'inline-block' : 'none';
    }

    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutButton');

    if (!cartItems || !totalPrice || !checkoutBtn) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fas fa-shopping-cart fa-2x"></i>
                <p>Корзина пуста</p>
                <p class="small">Добавьте товары из каталога</p>
            </div>
        `;
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Оформить заказ';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='https://via.placeholder.com/100x100/FF9800/FFFFFF?text=ICEBERG'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price} руб./шт.</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="item-quantity">${item.quantity} шт.</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Оформить заказ (${getCartTotal()} ₽)`;
    }

    totalPrice.textContent = getCartTotal();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeIn 0.3s ease;
        max-width: calc(100% - 40px);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ======================
// 6. КОРЗИНА И ЗАКАЗ
// ======================
function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function checkout() {
    if (cart.length === 0) return;
    
    const orderData = {
        products: cart,
        total: getCartTotal(),
        timestamp: new Date().toISOString()
    };
    
    console.log('Заказ:', orderData);
    alert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.`);
    
    cart = [];
    saveCart();
    closeCart();
}

// ======================
// 7. ИНИЦИАЛИЗАЦИЯ
// ======================
async function initApp() {
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем корзину
    loadCart();
    
    // Загружаем товары
    await loadProducts();
    
    // Обновляем UI
    updateCartUI();
    
    // Настраиваем обработчики
    document.getElementById('cartButton').onclick = openCart;
    document.getElementById('closeCart').onclick = closeCart;
    document.getElementById('cartOverlay').onclick = closeCart;
    document.getElementById('checkoutButton').onclick = checkout;
    document.getElementById('clearCartButton').onclick = clearCart;
    
    // Экспортируем функции
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.clearCart = clearCart;
    window.loadProducts = loadProducts;
    
    // Скрываем загрузчик
    setTimeout(() => {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        if (loader && app) {
            loader.style.display = 'none';
            app.style.display = 'block';
        }
    }, 500);
    
    console.log('✅ ICEBERG Shop инициализирован');
}

// ======================
// 8. ЗАПУСК
// ======================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
