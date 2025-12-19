// script.js - ОБНОВЛЕННЫЙ
// ======================
// 1. МНОЖЕСТВО АЛЬТЕРНАТИВНЫХ ССЫЛОК
// ======================
const PRODUCTS_SOURCES = [
    // 1. GitHub Raw (основная)
    "https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json",
    
    // 2. jsDelivr CDN (лучшая альтернатива для WebApp)
    "https://cdn.jsdelivr.net/gh/sashaG7658/lavkatest@main/products.json",
    
    // 3. RawGitHub (еще один вариант)
    "https://raw.githack.com/sashaG7658/lavkatest/main/products.json",
    
    // 4. GitHack
    "https://githack.com/sashaG7658/lavkatest/raw/main/products.json",
    
    // 5. Staticaly
    "https://cdn.staticaly.com/gh/sashaG7658/lavkatest/main/products.json",
    
    // 6. Локальный файл (для тестирования)
    // "products.json"
];

// Стандартные товары если ничего не работает
const DEFAULT_PRODUCTS = [
    {
        id: 1,
        name: "ICEBERG ULTRA MENTHOL",
        description: "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg",
        isNew: true
    },
    {
        id: 2,
        name: "ICEBERG ULTRA BLACK",
        description: "ICEBERG ULTRA BLACK (150 МГ) - ТУТТИ-ФРУТТИ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg",
        isNew: true
    }
];

let products = [];
let cart = [];
let tg = null;

// ======================
// 2. УЛУЧШЕННАЯ ЗАГРУЗКА ТОВАРОВ
// ======================
async function loadProducts() {
    console.log("🔄 Начинаю загрузку товаров...");
    
    const catalog = document.getElementById('catalog');
    
    if (catalog) {
        catalog.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1;">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Загрузка товаров...</p>
            </div>
        `;
    }
    
    // Пробуем каждую ссылку по очереди
    for (let i = 0; i < PRODUCTS_SOURCES.length; i++) {
        const url = PRODUCTS_SOURCES[i];
        console.log(`🔄 Пробую источник ${i + 1}: ${url}`);
        
        try {
            // Добавляем случайный параметр для предотвращения кэширования
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const fullUrl = `${url}?t=${timestamp}&r=${random}`;
            
            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    products = data;
                    console.log(`✅ УСПЕХ! Загружено ${products.length} товаров с ${url}`);
                    
                    // Сохраняем успешный источник
                    localStorage.setItem('iceberg_success_source', url);
                    localStorage.setItem('iceberg_products', JSON.stringify(products));
                    localStorage.setItem('iceberg_last_update', new Date().toISOString());
                    
                    renderProducts();
                    showNotification(`✅ Загружено ${products.length} товаров`);
                    
                    return products;
                }
            }
        } catch (error) {
            console.log(`❌ Ошибка с источником ${url}:`, error.message);
            continue; // Пробуем следующую ссылку
        }
    }
    
    // Если все ссылки не работают, пробуем localStorage
    console.log("🔄 Все источники не работают, проверяю localStorage...");
    
    try {
        const savedProducts = localStorage.getItem('iceberg_products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
            console.log(`✅ Загружено ${products.length} товаров из кэша`);
            
            renderProducts();
            showNotification('⚠️ Используются кэшированные товары');
            
            return products;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки из кэша:', error);
    }
    
    // Если ничего не работает, используем дефолтные товары
    console.log("🔄 Использую стандартные товары");
    products = DEFAULT_PRODUCTS;
    
    renderProducts();
    showNotification('⚠️ Используются базовые товары');
    
    // Сохраняем для будущего использования
    localStorage.setItem('iceberg_products', JSON.stringify(products));
    
    return products;
}

// ======================
// 3. УПРОЩЕННЫЕ ФУНКЦИИ КОРЗИНЫ
// ======================
function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log(`🛒 Корзина: ${cart.length} товаров`);
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
    
    // Вибрация на мобильных
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ... остальные функции корзины (без изменений) ...

// ======================
// 4. ОТОБРАЖЕНИЕ ТОВАРОВ
// ======================
function renderProducts() {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    if (products.length === 0) {
        catalog.innerHTML = `
            <div class="error" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Нет товаров для отображения</h3>
                <p>Попробуйте обновить страницу</p>
                <button onclick="loadProducts()" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Обновить товары
                </button>
            </div>
        `;
        return;
    }

    catalog.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.isNew ? '<div class="new-badge">NEW</div>' : ''}
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
    
    // Обновляем заголовок с количеством товаров
    updateTitleWithCount();
}

function updateTitleWithCount() {
    const titleElement = document.querySelector('.header h1');
    if (titleElement && products.length > 0) {
        // Убираем старое количество если есть
        const text = titleElement.textContent.replace(/\(\d+\)/, '').trim();
        titleElement.textContent = `${text} (${products.length})`;
    }
}

// ======================
// 5. ИНИЦИАЛИЗАЦИЯ
// ======================
async function initApp() {
    console.log("🚀 Инициализация ICEBERG Shop...");
    
    // Инициализируем Telegram
    try {
        tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            console.log("✅ Telegram WebApp инициализирован");
        }
    } catch (error) {
        console.error("❌ Ошибка Telegram:", error);
    }
    
    // Загружаем корзину
    loadCart();
    
    // Загружаем товары
    await loadProducts();
    
    // Обновляем UI
    updateCartUI();
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Экспортируем функции
    window.addToCart = addToCart;
    window.loadProducts = loadProducts;
    
    // Скрываем загрузчик
    hideLoader();
    
    console.log("✅ ICEBERG Shop готов к работе!");
}

function setupEventListeners() {
    const cartButton = document.getElementById('cartButton');
    const closeCart = document.getElementById('closeCart');
    const cartOverlay = document.getElementById('cartOverlay');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartButton = document.getElementById('clearCartButton');
    
    if (cartButton) cartButton.onclick = openCart;
    if (closeCart) closeCart.onclick = closeCart;
    if (cartOverlay) cartOverlay.onclick = closeCart;
    if (checkoutButton) checkoutButton.onclick = checkout;
    if (clearCartButton) clearCartButton.onclick = clearCart;
}

function hideLoader() {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                if (app) app.style.display = 'block';
            }, 300);
        } else if (app) {
            app.style.display = 'block';
        }
    }, 500);
}

// ======================
// 6. ЗАПУСК ПРИЛОЖЕНИЯ
// ======================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
