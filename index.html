// script.js
// ======================
// 1. НАСТРОЙКИ
// ======================
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json";
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
// 3. ЗАГРУЗКА ТОВАРОВ ИЗ GITHUB
// ======================
async function loadProducts() {
    try {
        const catalog = document.getElementById('catalog');
        if (catalog) {
            catalog.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Загрузка товаров из GitHub...</p>
                </div>
            `;
        }
        
        // Добавляем уникальный timestamp для предотвращения кэширования
        const timestamp = new Date().getTime();
        const response = await fetch(`${GITHUB_RAW_URL}?t=${timestamp}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Данные не являются массивом');
        }
        
        products = data;
        
        console.log(`✅ Загружено ${products.length} товаров из GitHub`);
        console.log(`📅 Последнее обновление: ${new Date().toLocaleTimeString()}`);
        
        // Сохраняем товары в localStorage как backup
        localStorage.setItem('iceberg_products_backup', JSON.stringify(products));
        localStorage.setItem('iceberg_products_timestamp', timestamp.toString());
        localStorage.setItem('iceberg_last_update', new Date().toISOString());
        
        renderProducts();
        
        // Показываем уведомление если товары были обновлены
        const lastUpdate = localStorage.getItem('iceberg_last_update_notified');
        if (!lastUpdate || Date.now() - new Date(lastUpdate).getTime() > 60000) {
            showNotification(`✅ Загружено ${products.length} товаров`);
            localStorage.setItem('iceberg_last_update_notified', new Date().toISOString());
        }
        
        return products;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        
        // Пробуем загрузить из localStorage
        try {
            const backup = localStorage.getItem('iceberg_products_backup');
            if (backup) {
                products = JSON.parse(backup);
                console.log(`✅ Загружено ${products.length} товаров из кэша`);
                renderProducts();
                
                // Показываем предупреждение
                showNotification('⚠️ Используются кэшированные товары');
                return products;
            }
        } catch (cacheError) {
            console.error('❌ Ошибка загрузки из кэша:', cacheError);
        }
        
        // Показываем ошибку
        const catalog = document.getElementById('catalog');
        if (catalog) {
            catalog.innerHTML = `
                <div class="error" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FF9800; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-color); margin-bottom: 10px;">Ошибка загрузки товаров</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 20px;">Проверьте соединение с интернетом</p>
                    <button onclick="loadProducts()" style="
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 25px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        transition: all 0.3s;
                    ">
                        <i class="fas fa-sync-alt"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
        
        return [];
    }
}

// ======================
// 4. КОРЗИНА
// ======================
function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log(`🛒 Загружено ${cart.length} товаров в корзине`);
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
        console.log(`💾 Корзина сохранена (${cart.length} товаров)`);
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
    
    if (tg && tg.showConfirm) {
        tg.showConfirm("Очистить всю корзину?", function(result) {
            if (result) {
                cart = [];
                saveCart();
                showNotification("🛒 Корзина очищена");
            }
        });
    } else if (confirm("Очистить всю корзину?")) {
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
// 5. ОТОБРАЖЕНИЕ ТОВАРОВ
// ======================
function renderProducts() {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    if (products.length === 0) {
        catalog.innerHTML = `
            <div class="error" style="grid-column: 1 / -1;">
                <i class="fas fa-box-open"></i>
                <p>Товаров пока нет</p>
                <p class="small">Добавьте товары через админ-панель</p>
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
                 onload="this.style.opacity = '1'"
                 onerror="this.src='https://via.placeholder.com/300x200/FF9800/FFFFFF?text=ICEBERG'; this.style.opacity = '1'"
                 style="opacity: 0; transition: opacity 0.3s;">
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
    
    // Показываем количество товаров в заголовке
    const titleElement = document.querySelector('.header h1');
    if (titleElement && products.length > 0) {
        const originalText = titleElement.textContent.replace(/\(\d+\)/, '');
        titleElement.textContent = `${originalText} (${products.length})`;
    }
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
                     loading="lazy"
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
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Автоудаление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
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
    
    // Создаем данные заказа
    const orderData = {
        type: 'order',
        data: {
            products: cart,
            total: getCartTotal(),
            timestamp: new Date().toISOString(),
            user: tg ? tg.initDataUnsafe.user : null
        }
    };
    
    console.log('Отправка заказа:', orderData);
    
    if (tg && tg.sendData) {
        // Отправляем данные в бота
        tg.sendData(JSON.stringify(orderData));
        
        // Показываем уведомление
        showNotification("✅ Заказ отправлен! Проверьте бота для подтверждения.");
        
        // Закрываем корзину
        closeCart();
        
        // Очищаем корзину
        cart = [];
        saveCart();
        
    } else {
        // Для отладки вне Telegram
        alert(`Заказ оформлен!\nСумма: ${getCartTotal()} руб.\n\nВ Telegram это откроет страницу подтверждения.`);
        cart = [];
        saveCart();
        closeCart();
    }
}

// ======================
// 7. ИНИЦИАЛИЗАЦИЯ
// ======================
async function initApp() {
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем корзину
    loadCart();
    
    // Загружаем товары из GitHub
    await loadProducts();
    
    // Обновляем UI
    updateCartUI();
    
    // Настраиваем обработчики
    document.getElementById('cartButton').onclick = openCart;
    document.getElementById('closeCart').onclick = closeCart;
    document.getElementById('cartOverlay').onclick = closeCart;
    document.getElementById('checkoutButton').onclick = checkout;
    document.getElementById('clearCartButton').onclick = clearCart;
    
    // Кнопка обновления товаров
    const refreshBtn = document.getElementById('refreshButton');
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await loadProducts();
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }, 1000);
        };
    }
    
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
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                app.style.display = 'block';
            }, 300);
        }
    }, 500);
    
    console.log('✅ ICEBERG Shop инициализирован');
    
    // Автообновление товаров каждые 2 минуты
    setInterval(async () => {
        console.log('🔄 Автообновление товаров...');
        await loadProducts();
    }, 2 * 60 * 1000);
}

// ======================
// 8. ЗАПУСК
// ======================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
