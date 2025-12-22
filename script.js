// script.js
// ======================
// 1. ОПРЕДЕЛЕНИЕ ТЕМЫ TELEGRAM
// ======================
let currentTheme = 'light';
let tg = null;
let products = [];
let cart = [];
let autoUpdateInterval = null;

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
// 3. ЗАГРУЗКА ТОВАРОВ С GITHUB
// ======================
async function loadProductsFromGitHub() {
    try {
        // Добавляем временную метку для избежания кэширования
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const loadedProducts = await response.json();
        
        // Добавляем поле quantity если его нет
        loadedProducts.forEach(product => {
            if (!product.hasOwnProperty('quantity')) {
                product.quantity = 10; // Значение по умолчанию
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
// 4. КОРЗИНА
// ======================

// Загрузка корзины из localStorage
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
    if (!product) {
        showNotification('❌ Товар не найден');
        return;
    }
    
    // Проверяем остатки
    if (product.quantity <= 0) {
        showNotification('❌ Товар закончился');
        updateProductAvailability(productId);
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
        updateProductAvailability(productId);
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

// ======================
// 6. ОТОБРАЖЕНИЕ
// ======================
function renderProducts(productsToRender) {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    catalog.innerHTML = productsToRender.map(product => {
        const qty = product.quantity || 0;
        const isAvailable = qty > 0;
        const isLowStock = qty <= 5 && qty > 0;
        const isOutOfStock = qty <= 0;
        
        let badge = '';
        if (product.isNew) {
            badge = '<div class="new-badge pulse">NEW</div>';
        } else if (isOutOfStock) {
            badge = '<div class="new-badge" style="background: #F44336;">НЕТ В НАЛИЧИИ</div>';
        } else if (isLowStock) {
            badge = `<div class="new-badge" style="background: #FF9800;">ОСТАЛОСЬ ${qty}</div>`;
        }
        
        const qtyColor = isAvailable ? (qty > 5 ? '#4CAF50' : '#FF9800') : '#F44336';
        const qtyText = isAvailable ? `📦 ${qty} шт. в наличии` : '❌ Нет в наличии';
        
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
                        <div>
                            <div class="product-price">${product.price} ₽</div>
                            <div class="product-quantity" style="font-size: 0.8rem; color: ${qtyColor};">
                                ${qtyText}
                            </div>
                        </div>
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

function updateProductAvailability(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const productElement = document.querySelector(`.product-card:has(button[onclick="addToCart(${productId})"])`);
    if (!productElement) return;
    
    const qty = product.quantity || 0;
    const isAvailable = qty > 0;
    const isLowStock = qty <= 5 && qty > 0;
    
    // Обновляем бейдж
    const badgeElement = productElement.querySelector('.new-badge');
    if (badgeElement) {
        if (isAvailable) {
            if (isLowStock) {
                badgeElement.textContent = `ОСТАЛОСЬ ${qty}`;
                badgeElement.style.background = '#FF9800';
            } else {
                badgeElement.remove();
            }
        } else {
            badgeElement.textContent = 'НЕТ В НАЛИЧИИ';
            badgeElement.style.background = '#F44336';
        }
    } else if (isLowStock) {
        const newBadge = document.createElement('div');
        newBadge.className = 'new-badge';
        newBadge.style.background = '#FF9800';
        newBadge.textContent = `ОСТАЛОСЬ ${qty}`;
        productElement.insertBefore(newBadge, productElement.firstChild);
    }
    
    // Обновляем текст количества
    const qtyElement = productElement.querySelector('.product-quantity');
    if (qtyElement) {
        const qtyColor = isAvailable ? (qty > 5 ? '#4CAF50' : '#FF9800') : '#F44336';
        const qtyText = isAvailable ? `📦 ${qty} шт. в наличии` : '❌ Нет в наличии';
        qtyElement.style.color = qtyColor;
        qtyElement.textContent = qtyText;
    }
    
    // Обновляем кнопку
    const button = productElement.querySelector('.add-to-cart');
    if (button) {
        if (!isAvailable) {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.innerHTML = '<i class="fas fa-cart-plus"></i> Нет в наличии';
        } else {
            button.disabled = false;
            button.style.opacity = '';
            button.style.cursor = '';
            button.innerHTML = '<i class="fas fa-cart-plus"></i> В корзину';
        }
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
                        ${isAvailable && item.quantity > maxAvailable ? `<div class="cart-item-warning" style="color: #FF9800; font-size: 0.8rem; margin-bottom: 5px;">⚠️ Максимум ${maxAvailable} шт.</div>` : ''}
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
    // Удаляем старые уведомления
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
    
    // Проверяем доступность товаров
    const unavailableItems = cart.filter(item => {
        const product = products.find(p => p.id === item.id);
        return !product || product.quantity <= 0;
    });
    
    if (unavailableItems.length > 0) {
        showNotification(`❌ ${unavailableItems.length} товаров больше не доступны`);
        
        // Удаляем недоступные товары
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

    const orderData = {
        products: cart,
        total: getCartTotal(),
        timestamp: new Date().toISOString(),
        theme: currentTheme,
        user: tg ? tg.initDataUnsafe.user : null
    };

    console.log("Заказ оформлен:", orderData);
    
    if (tg && tg.showAlert) {
        tg.showAlert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.\nТоваров: ${getCartCount()} шт.`, () => {
            if (tg.sendData) {
                tg.sendData(JSON.stringify(orderData));
            }
            cart = [];
            saveCart();
            closeCart();
        });
    } else {
        alert(`✅ Заказ оформлен!\nСумма: ${getCartTotal()} руб.\nТоваров: ${getCartCount()} шт.`);
        
        if (tg && tg.sendData) {
            tg.sendData(JSON.stringify(orderData));
        }
        
        cart = [];
        saveCart();
        closeCart();
    }
}

// ======================
// 8. АВТООБНОВЛЕНИЕ
// ======================
function startAutoUpdate() {
    // Обновляем каждые 30 секунд
    autoUpdateInterval = setInterval(async () => {
        try {
            const newProducts = await loadProductsFromGitHub();
            
            // Проверяем изменения
            const hasChanges = JSON.stringify(products) !== JSON.stringify(newProducts);
            
            if (hasChanges) {
                const oldProducts = [...products];
                products = newProducts;
                renderProducts(products);
                
                console.log('🔄 Товары обновлены');
                
                // Проверяем товары в корзине на наличие
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
                    
                    // Обновляем отображение конкретного товара
                    updateProductAvailability(cartItem.id);
                });
                
                if (cartUpdated) {
                    saveCart();
                }
                
                // Показываем уведомление об изменениях
                const newItems = products.filter(p => !oldProducts.find(op => op.id === p.id));
                if (newItems.length > 0) {
                    showNotification(`🆕 Добавлено ${newItems.length} новых товаров`);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обновления товаров:', error);
        }
    }, 30000); // 30 секунд
    
    console.log('🔄 Автообновление запущено (каждые 30 секунд)');
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
        console.log('🔄 Автообновление остановлено');
    }
}

// ======================
// 9. ИНИЦИАЛИЗАЦИЯ
// ======================
async function initApp() {
    // Определяем тему
    detectTheme();
    
    // Инициализируем Telegram
    initTelegram();
    
    // Загружаем товары с GitHub
    products = await loadProductsFromGitHub();
    
    // Загружаем корзину
    loadCart();
    
    // Рендерим товары
    renderProducts(products);
    updateCartUI();
    
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
    window.updateProductAvailability = updateProductAvailability;
    
    // Скрываем загрузчик
    setTimeout(() => {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        if (loader && app) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                app.style.display = 'block';
                showNotification('✅ Товары загружены. Автообновление включено');
            }, 300);
        }
    }, 500);
    
    console.log('✅ ICEBERG Shop инициализирован с остатками');
}

// Запускаем при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Останавливаем автообновление при закрытии
window.addEventListener('beforeunload', stopAutoUpdate);
