// ======================
// 1. ОПТИМИЗИРОВАННЫЕ ДАННЫЕ ТОВАРОВ
// ======================
const products = [
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
    },
    {
        id: 4,
        name: "ICEBERG ULTRA EMERALD",
        description: "ICEBERG ULTRA EMERALD - ЯБЛОКО, ЛАЙМ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/5090/629642210/large_E205F534-FC22-4962-AFE3-BB71710AF3F0.jpg"
    },
    {
        id: 5,
        name: "ICEBERG ULTRA DRAGONFIRE",
        description: "ICEBERG ULTRA DRAGONFIRE - ЦВЕТЫ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/5177/629642297/large_3097AA0C-00E1-47C7-BDFC-0EA9EA9E1E75.jpg"
    },
    {
        id: 6,
        name: "ICEBERG ULTRA DOUBLE MINT",
        description: "ICEBERG ULTRA DOUBLE MINT - ДВОЙНАЯ МЯТА",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/503/746127863/large_IMG_1491.JPG"
    }
];

// ======================
// 2. КОРЗИНА С ПРОВЕРКОЙ
// ======================
let cart = [];
try {
    const savedCart = localStorage.getItem('iceberg_cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
} catch (e) {
    console.error('Ошибка загрузки корзины:', e);
    cart = [];
}

// ======================
// 3. ТЕЛЕГРАМ WEBAPP ИНИЦИАЛИЗАЦИЯ
// ======================
let tg = null;
try {
    tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Устанавливаем тему Telegram
        if (tg.colorScheme === 'dark') {
            document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
            document.documentElement.style.setProperty('--card-color', '#2d2d2d');
            document.documentElement.style.setProperty('--text-color', '#ffffff');
            document.documentElement.style.setProperty('--border-color', '#404040');
        }
        
        // Настраиваем кнопку
        tg.MainButton.setText("Корзина");
        tg.MainButton.onClick(openCart);
        updateTelegramButton();
    }
} catch (e) {
    console.error('Ошибка инициализации Telegram:', e);
}

// ======================
// 4. ОПТИМИЗИРОВАННЫЕ ФУНКЦИИ КОРЗИНЫ
// ======================
function saveCart() {
    try {
        localStorage.setItem('iceberg_cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Ошибка сохранения корзины:', e);
    }
    updateCartUI();
    updateTelegramButton();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

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
    showNotification(`✅ Добавлено: ${product.name}`);
    
    // Вибрация на мобильных (если поддерживается)
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
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
    
    // Используем диалог Telegram если доступен
    if (tg && tg.showConfirm) {
        tg.showConfirm("Очистить всю корзину?", function(result) {
            if (result) {
                cart = [];
                saveCart();
                showNotification("🗑️ Корзина очищена");
            }
        });
    } else if (confirm("Очистить всю корзину?")) {
        cart = [];
        saveCart();
        showNotification("🗑️ Корзина очищена");
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
// 5. ОТОБРАЖЕНИЕ ТОВАРОВ (2 В СТРОКУ)
// ======================
function renderProducts() {
    const catalogContainer = document.getElementById('catalog');
    
    if (!catalogContainer) {
        console.error('Контейнер каталога не найден!');
        return;
    }
    
    if (products.length === 0) {
        catalogContainer.innerHTML = `
            <div class="error" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Нет товаров для отображения</p>
            </div>
        `;
        return;
    }
    
    // Очищаем контейнер
    catalogContainer.innerHTML = '';
    
    // Создаем карточки товаров
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200/0B5B8A/FFFFFF?text=ICEBERG'">
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
        `;
        catalogContainer.appendChild(productCard);
    });
}

function updateCartUI() {
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
        cartCounter.textContent = getCartCount();
    }

    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkoutButton = document.getElementById('checkoutButton');

    if (!cartItemsContainer || !totalPriceElement || !checkoutButton) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fas fa-shopping-cart fa-2x"></i>
                <p>Корзина пуста</p>
                <p class="small">Добавьте товары из каталога</p>
            </div>
        `;
        checkoutButton.disabled = true;
        checkoutButton.innerHTML = '<i class="fas fa-paper-plane"></i> Оформить заказ';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/100x100/0B5B8A/FFFFFF?text=ICEBERG'">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price} руб./шт.</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="item-quantity">${item.quantity} шт.</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-times"></i> Удалить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = `<i class="fas fa-paper-plane"></i> Оформить заказ (${getCartTotal()} ₽)`;
    }

    if (totalPriceElement) {
        totalPriceElement.textContent = getCartTotal();
    }
}

function showNotification(message) {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 15px;
        left: 15px;
        background: #4CAF50;
        color: white;
        padding: 12px 16px;
        border-radius: 10px;
        z-index: 2000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        text-align: center;
        font-size: 0.9rem;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Автоудаление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================
// 6. УПРАВЛЕНИЕ КОРЗИНОЙ
// ======================
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        
        // Предотвращаем прокрутку фона
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        
        // Восстанавливаем прокрутку
        document.body.style.overflow = '';
    }
}

// ======================
// 7. ОФОРМЛЕНИЕ ЗАКАЗА
// ======================
function checkout() {
    if (cart.length === 0) return;

    const orderData = {
        products: cart,
        total: getCartTotal(),
        timestamp: new Date().toISOString(),
        user: tg ? tg.initDataUnsafe.user : null
    };

    console.log("Заказ оформлен:", orderData);
    
    // Используем Telegram Alert если доступен
    if (tg && tg.showAlert) {
        tg.showAlert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.`, function() {
            if (tg.sendData) {
                tg.sendData(JSON.stringify(orderData));
            }
            cart = [];
            saveCart();
            closeCart();
        });
    } else {
        alert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.\n\nЗаказ будет обработан администратором.`);
        
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(orderData));
        }
        
        cart = [];
        saveCart();
        closeCart();
    }
}

// ======================
// 8. ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ======================
function initApp() {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        try {
            // Рендерим товары
            renderProducts();
            updateCartUI();
            
            // Настраиваем обработчики событий
            const cartButton = document.getElementById('cartButton');
            const closeCartBtn = document.getElementById('closeCart');
            const cartOverlay = document.getElementById('cartOverlay');
            const checkoutButton = document.getElementById('checkoutButton');
            const clearCartButton = document.getElementById('clearCartButton');
            
            if (cartButton) cartButton.addEventListener('click', openCart);
            if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
            if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
            if (checkoutButton) checkoutButton.addEventListener('click', checkout);
            if (clearCartButton) clearCartButton.addEventListener('click', clearCart);
            
            // Экспортируем функции в глобальную область видимости
            window.addToCart = addToCart;
            window.removeFromCart = removeFromCart;
            window.updateQuantity = updateQuantity;
            window.openCart = openCart;
            window.closeCart = closeCart;
            window.checkout = checkout;
            window.clearCart = clearCart;
            
            console.log('✅ ICEBERG Shop инициализирован успешно');
            
            // Проверяем сетку товаров
            setTimeout(() => {
                const catalog = document.querySelector('.catalog');
                if (catalog) {
                    const gridStyle = window.getComputedStyle(catalog);
                    const columns = gridStyle.gridTemplateColumns;
                    console.log('Сетка товаров:', columns);
                    
                    // Принудительно устанавливаем 2 колонки если нужно
                    if (!columns.includes('1fr 1fr') && !columns.includes('repeat(2')) {
                        console.log('Исправляем сетку на 2 колонки...');
                        catalog.style.gridTemplateColumns = 'repeat(2, 1fr)';
                    }
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Ошибка инициализации приложения:', error);
            showNotification('Ошибка загрузки приложения');
        }
    }
    
    // Запускаем инициализацию
    initialize();
}

// ======================
// 9. ЗАПУСК ПРИЛОЖЕНИЯ
// ======================
// Запускаем инициализацию с небольшой задержкой
setTimeout(initApp, 100);

// Резервная проверка загрузки
setTimeout(() => {
    if (typeof window.addToCart === 'undefined') {
        console.error('❌ Основной скрипт не загрузился!');
        const catalog = document.getElementById('catalog');
        if (catalog) {
            catalog.innerHTML = `
                <div class="error" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Ошибка загрузки приложения</p>
                    <p class="small">Перезагрузите страницу или проверьте консоль</p>
                </div>
            `;
        }
    }
}, 2000);

// Обработчик изменения ориентации экрана
window.addEventListener('resize', () => {
    const catalog = document.querySelector('.catalog');
    if (catalog) {
        // Всегда 2 колонки на мобильных
        if (window.innerWidth <= 768) {
            catalog.style.gridTemplateColumns = 'repeat(2, 1fr)';
        }
    }
});

// Обработчик касаний для мобильных
document.addEventListener('touchstart', function() {}, {passive: true});
