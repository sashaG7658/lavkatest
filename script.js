// script.js
// ======================
// 1. ОПРЕДЕЛЕНИЕ ТЕМЫ TELEGRAM
// ======================
let currentTheme = 'light';
let tg = null;

// Функция определения темы
function detectTheme() {
    try {
        tg = window.Telegram?.WebApp;
        
        if (tg) {
            // Используем тему из Telegram
            const isDark = tg.colorScheme === 'dark';
            currentTheme = isDark ? 'dark' : 'light';
            
            // Применяем тему
            document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
            document.body.classList.add(`${currentTheme}-theme`);
            
            // Сохраняем тему в localStorage
            localStorage.setItem('theme', currentTheme);
            
            // Настраиваем кнопку Telegram
            tg.MainButton.setParams({
                color: isDark ? '#FF9800' : '#FF9800',
                text_color: isDark ? '#FFFFFF' : '#FFFFFF'
            });
            
            console.log(`✅ Тема Telegram: ${currentTheme}`);
            return;
        }
        
        // Если не Telegram, проверяем системную тему
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            currentTheme = savedTheme;
        } else {
            currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
        document.body.classList.add(`${currentTheme}-theme`);
        
    } catch (error) {
        console.error('❌ Ошибка определения темы:', error);
        document.body.classList.add('auto-theme');
    }
}

// Функция переключения темы
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Обновляем классы
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${currentTheme}-theme`);
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', currentTheme);
    
    // Обновляем иконку
    updateThemeIcon();
    
    // Показываем уведомление
    showNotification(`Тема: ${currentTheme === 'dark' ? '🌙 Темная' : '☀️ Светлая'}`);
    
    console.log(`🔄 Переключена тема: ${currentTheme}`);
}

// Обновление иконки темы
function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-switch i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        document.querySelector('.theme-switch').classList.toggle('dark', currentTheme === 'dark');
    }
}

// ======================
// 2. ИНИЦИАЛИЗАЦИЯ TELEGRAM
// ======================
function initTelegram() {
    try {
        if (tg) {
            tg.ready();
            tg.expand();
            
            // Слушаем изменения темы в Telegram
            tg.onEvent('themeChanged', detectTheme);
            tg.onEvent('viewportChanged', detectTheme);
            
            // Настраиваем основную кнопку
            tg.MainButton.setText("Корзина");
            tg.MainButton.onClick(openCart);
            
            console.log('✅ Telegram WebApp инициализирован');
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
    }
}

// ======================
// 3. ДАННЫЕ ТОВАРОВ (оранжевая тема)
// ======================
const products = [
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
// 4. КОРЗИНА
// ======================
let cart = [];

// Загрузка корзины из localStorage
function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        console.error('❌ Ошибка загрузки корзины:', error);
        cart = [];
    }
}

// Сохранение корзины
function saveCart() {
    try {
        localStorage.setItem('iceberg_cart', JSON.stringify(cart));
        updateCartUI();
        updateTelegramButton();
    } catch (error) {
        console.error('❌ Ошибка сохранения корзины:', error);
    }
}

// ======================
// 5. ОСНОВНЫЕ ФУНКЦИИ
// ======================
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
// 6. ОТОБРАЖЕНИЕ
// ======================
function renderProducts() {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    catalog.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.isNew ? '<div class="new-badge pulse">NEW</div>' : ''}
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image loading"
                 loading="lazy"
                 onload="this.classList.remove('loading')"
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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ======================
// 7. КОРЗИНА И ЗАКАЗ
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
        timestamp: new Date().toISOString(),
        theme: currentTheme,
        user: tg ? tg.initDataUnsafe.user : null
    };

    console.log("Заказ оформлен:", orderData);
    
    if (tg && tg.showAlert) {
        tg.showAlert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.`, () => {
            if (tg.sendData) {
                tg.sendData(JSON.stringify(orderData));
            }
            cart = [];
            saveCart();
            closeCart();
        });
    } else {
        alert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.`);
        
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(orderData));
        }
        
        cart = [];
        saveCart();
        closeCart();
    }
}

// ======================
// 8. ИНИЦИАЛИЗАЦИЯ
// ======================
function initApp() {
    // Определяем тему
    detectTheme();
    
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем корзину
    loadCart();
    
    // Рендерим товары
    renderProducts();
    updateCartUI();
    
    // Создаем переключатель темы
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    themeSwitch.onclick = toggleTheme;
    document.body.appendChild(themeSwitch);
    updateThemeIcon();
    
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
    window.toggleTheme = toggleTheme;
    
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
}

// Запускаем при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
