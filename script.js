// ======================
// 1. КОНФИГУРАЦИЯ
// ======================
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json";
const CACHE_DURATION = 30000; // 30 секунд кэширования

// ======================
// 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ======================
let products = [];
let cart = JSON.parse(localStorage.getItem('lavka_cart')) || [];
let lastFetchTime = 0;
let productsCache = null;

// Telegram WebApp
let tg = window.Telegram?.WebApp;

// ======================
// 3. ЗАГРУЗКА ТОВАРОВ С GITHUB
// ======================
async function loadProducts() {
    const now = Date.now();
    
    // Используем кэш если прошло меньше CACHE_DURATION
    if (productsCache && (now - lastFetchTime) < CACHE_DURATION) {
        console.log("📦 Используем кэшированные товары");
        return productsCache;
    }
    
    try {
        console.log("🔄 Загружаем товары с GitHub...");
        
        // Добавляем timestamp для избежания кэширования браузером
        const timestamp = new Date().getTime();
        const url = `${GITHUB_RAW_URL}?t=${timestamp}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Валидация данных
        if (!Array.isArray(data)) {
            throw new Error("Некорректный формат данных");
        }
        
        // Кэшируем результат
        productsCache = data;
        lastFetchTime = now;
        
        console.log(`✅ Загружено ${data.length} товаров`);
        return data;
        
    } catch (error) {
        console.error("❌ Ошибка загрузки товаров:", error);
        
        // Возвращаем кэш или тестовые товары
        if (productsCache) {
            console.log("⚠️ Используем старые данные из кэша");
            return productsCache;
        }
        
        // Резервные тестовые товары
        return [{
            id: 1,
            name: "Апельсины Valencia",
            description: "Сочные сладкие апельсины из Испании",
            price: 299,
            image: "https://images.unsplash.com/photo-1547514701-42782101795e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        }];
    }
}

// ======================
// 4. ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ======================
async function updateProductsDisplay() {
    try {
        // Загружаем свежие товары
        products = await loadProducts();
        
        // Очищаем контейнер
        const catalog = document.getElementById('catalog');
        if (!catalog) {
            console.error("❌ Не найден элемент #catalog");
            return;
        }
        
        // Если товаров нет
        if (products.length === 0) {
            catalog.innerHTML = `
                <div class="empty-store">
                    <i class="fas fa-box-open fa-3x"></i>
                    <h3>Магазин пуст</h3>
                    <p>Товары появятся здесь скоро!</p>
                    <button onclick="updateProductsDisplay()" class="refresh-btn">
                        <i class="fas fa-sync-alt"></i> Обновить
                    </button>
                </div>
            `;
            return;
        }
        
        // Рендерим товары
        catalog.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Товар'">
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
        
        // Добавляем кнопку обновления
        catalog.innerHTML += `
            <div class="update-info">
                <button onclick="forceRefreshProducts()" class="refresh-btn">
                    <i class="fas fa-sync-alt"></i> Обновить товары
                </button>
                <small>Последнее обновление: ${new Date().toLocaleTimeString()}</small>
            </div>
        `;
        
    } catch (error) {
        console.error("❌ Ошибка обновления интерфейса:", error);
        
        const catalog = document.getElementById('catalog');
        if (catalog) {
            catalog.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <h3>Ошибка загрузки товаров</h3>
                    <p>${error.message}</p>
                    <button onclick="updateProductsDisplay()" class="refresh-btn">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
    }
}

// ======================
// 5. ФУНКЦИИ КОРЗИНЫ
// ======================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification("Товар не найден", "error");
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`Добавлено: ${product.name}`);
}

function saveCart() {
    localStorage.setItem('lavka_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const counter = document.getElementById('cartCounter');
    if (counter) {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = count;
    }
}

// ======================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================
function forceRefreshProducts() {
    // Очищаем кэш
    productsCache = null;
    lastFetchTime = 0;
    
    // Показываем индикатор загрузки
    const catalog = document.getElementById('catalog');
    if (catalog) {
        catalog.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Загружаем свежие товары...</p>
            </div>
        `;
    }
    
    // Загружаем заново
    setTimeout(updateProductsDisplay, 500);
}

function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Автоудаление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================
// 7. ИНИЦИАЛИЗАЦИЯ TELEGRAM
// ======================
function initTelegram() {
    if (!tg) return;
    
    tg.ready();
    tg.expand();
    
    // Обновляем кнопку в Telegram
    const updateTelegramButton = () => {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (count > 0) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            tg.MainButton.setText(`Корзина (${total} ₽)`);
            tg.MainButton.show();
        } else {
            tg.MainButton.setText("Корзина пуста");
        }
    };
    
    // Обновляем при изменении корзины
    const originalSaveCart = saveCart;
    saveCart = function() {
        originalSaveCart();
        updateTelegramButton();
    };
    
    tg.MainButton.onClick(() => {
        // Открываем корзину или оформляем заказ
        alert(`Заказ оформлен! Товаров: ${cart.length}`);
    });
}

// ======================
// 8. ЗАПУСК ПРИЛОЖЕНИЯ
// ======================
async function initializeApp() {
    console.log("🚀 Запуск Lavka Orange WebApp...");
    
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем начальные данные
    await updateProductsDisplay();
    updateCartUI();
    
    // Автоматическое обновление каждые 60 секунд
    setInterval(updateProductsDisplay, 60000);
    
    console.log("✅ Приложение запущено");
}

// ======================
// 9. ГОЛОБАЛЬНЫЕ ФУНКЦИИ
// ======================
window.addToCart = addToCart;
window.updateProductsDisplay = updateProductsDisplay;
window.forceRefreshProducts = forceRefreshProducts;

// ======================
// 10. ЗАГРУЗКА ПРИЛОЖЕНИЯ
// ======================
document.addEventListener('DOMContentLoaded', initializeApp);
