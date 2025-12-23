// script.js
// ICEBERG Shop - Версия для пользователей (без показа количества)
// ======================

let currentTheme = 'light';
let tg = null;
let products = [];
let cart = [];
let autoUpdateInterval = null;

// ======================
// 1. ТЕМА И TELEGRAM
// ======================

function detectTheme() {
    try {
        tg = window.Telegram?.WebApp;
        
        if (tg) {
            const isDark = tg.colorScheme === 'dark';
            currentTheme = isDark ? 'dark' : 'light';
            
            document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
            document.body.classList.add(`${currentTheme}-theme`);
            
            localStorage.setItem('theme', currentTheme);
            
            tg.MainButton.setParams({
                color: isDark ? '#FF9800' : '#FF9800',
                text_color: isDark ? '#FFFFFF' : '#FFFFFF'
            });
            
            console.log(`✅ Тема Telegram: ${currentTheme}`);
            return;
        }
        
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

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${currentTheme}-theme`);
    
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    
    showNotification(`Тема: ${currentTheme === 'dark' ? '🌙 Темная' : '☀️ Светлая'}`);
    console.log(`🔄 Переключена тема: ${currentTheme}`);
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-switch i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        document.querySelector('.theme-switch').classList.toggle('dark', currentTheme === 'dark');
    }
}

function initTelegram() {
    try {
        if (tg) {
            tg.ready();
            tg.expand();
            
            tg.onEvent('themeChanged', detectTheme);
            tg.onEvent('viewportChanged', detectTheme);
            
            tg.MainButton.setText("Корзина");
            tg.MainButton.onClick(openCart);
            
            console.log('✅ Telegram WebApp инициализирован');
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации Telegram:', error);
    }
}

// ======================
// 2. ЗАГРУЗКА ТОВАРОВ
// ======================

async function loadProductsFromGitHub() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const loadedProducts = await response.json();
        
        // Добавляем поле quantity если его нет
        loadedProducts.forEach(product => {
            if (!product.hasOwnProperty('quantity')) {
                product.quantity = 10;
            }
        });
        
        console.log(`✅ Загружено ${loadedProducts.length} товаров с GitHub`);
        return loadedProducts;
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров с GitHub:', error);
        return getDefaultProducts();
    }
}

function getDefaultProducts() {
    return [
        {
            id: 1,
            name: "ICEBERG ULTRA MENTHOL",
            description: "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg",
            isNew: true
        },
        {
            id: 2,
            name: "ICEBERG ULTRA BLACK",
            description: "ICEBERG ULTRA BLACK (150 МГ) - ТУТТИ-ФРУТТИ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg",
            isNew: true
        },
        {
            id: 3,
            name: "ICEBERG ULTRA CRAZY MIX",
            description: "ICEBERG ULTRA CRAZY MIX - МУЛЬТИФРУТ, ЦИТРУС",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4960/629642080/large_36DE056D-C798-404C-A1A4-098A258FFE2B.jpg"
        },
        {
            id: 4,
            name: "ICEBERG ULTRA EMERALD",
            description: "ICEBERG ULTRA EMERALD - ЯБЛОКО, ЛАЙМ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/5090/629642210/large_E205F534-FC22-4962-AFE3-BB71710AF3F0.jpg"
        },
        {
            id: 5,
            name: "ICEBERG ULTRA DRAGONFIRE",
            description: "ICEBERG ULTRA DRAGONFIRE - ЦВЕТЫ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/5177/629642297/large_3097AA0C-00E1-47C7-BDFC-0EA9EA9E1E75.jpg"
        },
        {
            id: 6,
            name: "ICEBERG ULTRA DOUBLE MINT",
            description: "ICEBERG ULTRA DOUBLE MINT - ДВОЙНАЯ МЯТА",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/503/746127863/large_IMG_1491.JPG"
        }
    ];
}

// ======================
// 3. ОТОБРАЖЕНИЕ ТОВАРОВ (БЕЗ КОЛИЧЕСТВА)
// ======================

function renderProducts(productsToRender) {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    catalog.innerHTML = productsToRender.map(product => {
        const qty = product.quantity || 0;
        const isAvailable = qty > 0;
        
        // Бейджи только для пользователей
        let badge = '';
        if (product.isNew && isAvailable) {
            badge = '<div class="new-badge pulse">NEW</div>';
        } else if (!isAvailable) {
            badge = '<div class="new-badge" style="background: #F44336;">НЕТ В НАЛИЧИИ</div>';
        }
        // Убираем бейдж "ОСТАЛОСЬ X" - пользователи не видят количество
        
        return `
            <div class="product-card">
                ${badge}
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
                        <button class="add-to-cart" 
                                onclick="addToCart(${product.id})"
                                ${!isAvailable ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            <i class="fas fa-cart-plus"></i> 
                            ${!isAvailable ? 'Нет в наличии' : 'В корзину'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ======================
// 4. КОРЗИНА
// ======================

function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log(`🛒 Загружено ${cart.length} товаров в корзину`);
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
    
    // Проверяем остатки
    if (product.quantity <= 0) {
        showNotification('❌ Товар закончился');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    // Проверяем, не превышаем ли остаток
    if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
            showNotification(`⚠️ Максимум ${product.quantity} шт. в наличии`);
            return;
        }
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
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const itemName = cart[itemIndex].name;
    cart.splice(itemIndex, 1);
    
    saveCart();
    showNotification(`🗑️ ${itemName} удален из корзины`);
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = item.quantity + change;
    
    // Проверяем остатки
    if (newQuantity > product.quantity) {
        showNotification(`⚠️ Максимум ${product.quantity} шт. в наличии`);
        return;
    }
    
    item.quantity = newQuantity;
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
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);
            const isAvailable = product && product.quantity > 0;
            const maxAvailable = product ? product.quantity : 0;
            
            return `
                <div class="cart-item">
                    <img src="${item.image}" 
                         alt="${item.name}" 
                         class="cart-item-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/100x100/FF9800/FFFFFF?text=ICEBERG'">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">${item.price} руб./шт.</div>
                        ${!isAvailable ? '<div class="cart-item-warning" style="color: #F44336; font-size: 0.8rem; margin-bottom: 5px;">⚠️ Товар закончился</div>' : ''}
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" ${!isAvailable ? 'disabled style="opacity: 0.5;"' : ''}>-</button>
                            <span class="item-quantity">${item.quantity} шт.</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)" ${!isAvailable || item.quantity >= maxAvailable ? 'disabled style="opacity: 0.5;"' : ''}>+</button>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        checkoutBtn.disabled = !cart.some(item => {
            const product = products.find(p => p.id === item.id);
            return product && product.quantity > 0;
        });
        
        const total = getCartTotal();
        checkoutBtn.innerHTML = `<i class="fas fa-paper-plane"></i> Оформить заказ (${total} ₽)`;
    }

    totalPrice.textContent = getCartTotal();
}

function showNotification(message) {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
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
// 5. ОФОРМЛЕНИЕ ЗАКАЗА
// ======================

async function checkout() {
    if (cart.length === 0) return;
    
    // Проверяем доступность товаров
    const unavailableItems = cart.filter(item => {
        const product = products.find(p => p.id === item.id);
        return !product || product.quantity <= 0;
    });
    
    if (unavailableItems.length > 0) {
        showNotification(`❌ ${unavailableItems.length} товаров больше не доступны`);
        
        cart = cart.filter(item => {
            const product = products.find(p => p.id === item.id);
            return product && product.quantity > 0;
        });
        
        saveCart();
        return;
    }
    
    // Проверяем превышение остатков
    const exceededItems = cart.filter(item => {
        const product = products.find(p => p.id === item.id);
        return product && item.quantity > product.quantity;
    });
    
    if (exceededItems.length > 0) {
        exceededItems.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (product) {
                item.quantity = product.quantity;
                showNotification(`⚠️ Количество ${item.name} уменьшено до ${product.quantity} шт.`);
            }
        });
        saveCart();
        return;
    }

    // Формируем данные заказа
    const orderData = {
        products: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: getCartTotal(),
        items_count: getCartCount(),
        timestamp: new Date().toISOString(),
        user: tg ? {
            id: tg.initDataUnsafe.user?.id,
            username: tg.initDataUnsafe.user?.username,
            first_name: tg.initDataUnsafe.user?.first_name,
            last_name: tg.initDataUnsafe.user?.last_name
        } : null
    };

    console.log("🛒 Отправка заказа:", orderData);
    
    try {
        // Отправляем заказ в Telegram бота
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(orderData));
            
            tg.showAlert(
                `✅ Заказ оформлен!\n\n` +
                `📦 Товаров: ${getCartCount()} шт.\n` +
                `💰 Сумма: ${getCartTotal()} руб.\n\n` +
                `📞 Свяжитесь с продавцом для уточнения деталей:\n` +
                `👤 @Chief_68`,
                () => {
                    cart = [];
                    saveCart();
                    closeCart();
                    
                    // Обновляем товары через 2 секунды
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
            // Если не в Telegram
            alert(
                `✅ Заказ оформлен!\n\n` +
                `📦 Товаров: ${getCartCount()} шт.\n` +
                `💰 Сумма: ${getCartTotal()} руб.\n\n` +
                `📞 Свяжитесь с продавцом:\n` +
                `👤 @Chief_68\n\n` +
                `🔄 Остатки будут обновлены`
            );
            
            cart = [];
            saveCart();
            closeCart();
        }
        
        // Обновляем товары через 3 секунды
        setTimeout(() => {
            loadAndRenderProducts();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Ошибка оформления заказа:', error);
        showNotification('❌ Ошибка оформления заказа');
    }
}

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

// ======================
// 6. АВТООБНОВЛЕНИЕ
// ======================

async function loadAndRenderProducts() {
    try {
        const newProducts = await loadProductsFromGitHub();
        
        const oldProducts = [...products];
        products = newProducts;
        
        // Рендерим товары (без показа количества для пользователей)
        renderProducts(products);
        
        // Проверяем корзину
        let cartUpdated = false;
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (!product || product.quantity <= 0) {
                removeFromCart(cartItem.id);
                showNotification(`⚠️ ${cartItem.name} больше не доступен`);
                cartUpdated = true;
            } else if (cartItem.quantity > product.quantity) {
                cartItem.quantity = product.quantity;
                showNotification(`⚠️ Количество ${cartItem.name} уменьшено до ${product.quantity} шт.`);
                cartUpdated = true;
            }
        });
        
        if (cartUpdated) {
            saveCart();
        }
        
        const newItems = products.filter(p => !oldProducts.find(op => op.id === p.id));
        if (newItems.length > 0) {
            showNotification(`🆕 Добавлено ${newItems.length} новых товаров`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
    }
}

function startAutoUpdate() {
    // Обновляем каждые 60 секунд
    autoUpdateInterval = setInterval(async () => {
        await loadAndRenderProducts();
    }, 60000);
    
    console.log('🔄 Автообновление запущено (каждые 60 секунд)');
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        console.log('🔄 Автообновление остановлено');
    }
}

// ======================
// 7. ИНИЦИАЛИЗАЦИЯ
// ======================

async function initApp() {
    // Определяем тему
    detectTheme();
    
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем товары
    await loadAndRenderProducts();
    
    // Загружаем корзину
    loadCart();
    
    // Запускаем автообновление
    startAutoUpdate();
    
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
                showNotification('✅ Магазин загружен');
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

// Останавливаем автообновление при закрытии
window.addEventListener('beforeunload', stopAutoUpdate);
