// ======================
// ЗАГРУЗКА ТОВАРОВ ИЗ products.json
// ======================
async function loadProductsFromServer() {
    try {
        // Загружаем товары с GitHub
        const response = await fetch('https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json');
        if (!response.ok) {
            throw new Error('Файл с товарами не найден');
        }
        return await response.json();
    } catch (error) {
        console.warn('Не удалось загрузить товары с сервера:', error);
        // Возвращаем тестовые товары по умолчанию
        return [
            {
               id: 1,
        name: "ICEBERG ULTRA MENTHOL",
        description: "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg"
        }
        ];
    }
}

// ======================
// ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ======================
async function initializeApp() {
    // Загружаем товары
    window.products = await loadProductsFromServer();
    
    // Рендерим товары
    renderProducts();
    
    // Инициализируем Telegram WebApp
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    
    console.log(`✅ Загружено ${window.products.length} товаров`);
}

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initializeApp);
// ======================
// 1. ДАННЫЕ ТОВАРОВ (можно заменить на загрузку с сервера)
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
        name: "ICEBERG ULTRA BLACK (150 МГ)",
        description: "ICEBERG ULTRA BLACK (150 МГ) - ЖВАЧКА ТУТТИ-ФРУТТИ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg"
    },
    {
        id: 3,
        name: "ICEBERG ULTRA CRAZY MIX",
        description: "ICEBERG ULTRA CRAZY MIX (150 МГ) - МУЛЬТИФРУТ, ЦИТРУС",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/4960/629642080/large_36DE056D-C798-404C-A1A4-098A258FFE2B.jpg"
    },
    {
        id: 4,
        name: "ICEBERG ULTRA EMERALD",
        description: "ICEBERG ULTRA EMERALD (150 МГ) - ЗЕЛЕНОЕ ЯБЛОКО, ЛАЙМ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/5090/629642210/large_E205F534-FC22-4962-AFE3-BB71710AF3F0.jpg"
    },
    {
        id: 5,
        name: "ICEBERG ULTRA DRAGONFIRE",
        description: "ICEBERG ULTRA DRAGONFIRE - АРОМАТ ЦВЕТОВ",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/5177/629642297/large_3097AA0C-00E1-47C7-BDFC-0EA9EA9E1E75.jpg"
    },
    {
        id: 6,
        name: "ICEBERG ULTRA DOUBLE MINT",
        description: "ICEBERG ULTRA DOUBLE MINT (150 МГ) - ДВОЙНАЯ МЯТА",
        price: 500,
        image: "https://static.insales-cdn.com/images/products/1/503/746127863/large_IMG_1491.JPG"
    }
];

// ======================
// 2. КОРЗИНА (состояние приложения)
// ======================
let cart = JSON.parse(localStorage.getItem('lavka_cart')) || [];

// ======================
// 3. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
// ======================
let tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready(); // Сообщаем Telegram, что приложение готово
    tg.expand(); // Расширяем на весь экран
    tg.MainButton.setText("Открыть корзину");
    tg.MainButton.onClick(openCart);
}

// ======================
// 4. ОСНОВНЫЕ ФУНКЦИИ КОРЗИНЫ
// ======================
function saveCart() {
    localStorage.setItem('lavka_cart', JSON.stringify(cart));
    updateCartUI();
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
    showNotification(`Добавлено: ${product.name}`);
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
    if (confirm("Очистить всю корзину?")) {
        cart = [];
        saveCart();
        showNotification("Корзина очищена");
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ======================
// 5. РАБОТА С ИНТЕРФЕЙСОМ
// ======================
function updateCartUI() {
    // Счетчик в кнопке корзины
    const cartCounter = document.getElementById('cartCounter');
    cartCounter.textContent = getCartCount();

    // Обновляем список товаров в корзине
    const cartItemsContainer = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const checkoutButton = document.getElementById('checkoutButton');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Корзина пуста</p>`;
        checkoutButton.disabled = true;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
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
    }

    // Обновляем итоговую сумму
    totalPriceElement.textContent = getCartTotal();

    // Обновляем кнопку в Telegram
    if (tg) {
        if (cart.length > 0) {
            tg.MainButton.setText(`Оформить заказ (${getCartTotal()} ₽)`);
            tg.MainButton.show();
        } else {
            tg.MainButton.setText("Открыть корзину");
        }
    }
}

function renderProducts() {
    const catalogContainer = document.getElementById('catalog');
    catalogContainer.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
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

function showNotification(message) {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 2000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// ======================
// 6. УПРАВЛЕНИЕ КОРЗИНОЙ (открытие/закрытие)
// ======================
function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
}

// ======================
// 7. ОФОРМЛЕНИЕ ЗАКАЗА (интеграция с Telegram)
// ======================
function checkout() {
    if (cart.length === 0) return;

    const orderData = {
        products: cart,
        total: getCartTotal(),
        timestamp: new Date().toISOString(),
        user: tg ? tg.initDataUnsafe.user : null
    };

    // В реальном приложении здесь отправка на сервер
    console.log("Заказ оформлен:", orderData);

    // Показываем сообщение об успехе
    alert(`Заказ оформлен! Сумма: ${getCartTotal()} руб.\nВ реальном приложении здесь будет переход к оплате.`);

    // Если в Telegram, можно отправить данные боту
    if (tg) {
        tg.sendData(JSON.stringify(orderData));
        // tg.close(); // Закрыть мини-приложение после заказа
    }

    // Очищаем корзину после оформления
    cart = [];
    saveCart();
    closeCart();
}

// ======================
// 8. НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ======================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();

    // Открытие/закрытие корзины
    document.getElementById('cartButton').addEventListener('click', openCart);
    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);

    // Кнопки оформления и очистки
    document.getElementById('checkoutButton').addEventListener('click', checkout);
    document.getElementById('clearCartButton').addEventListener('click', clearCart);

    // Глобальные функции для вызова из HTML
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.clearCart = clearCart;

});

