// ======================
// 1. ДАННЫЕ ТОВАРОВ (можно заменить на загрузку с сервера)
// ======================
const products = [
    {
        id: 1,
        name: "Апельсины Valencia",
        description: "Сочные сладкие апельсины из Испании. Идеальны для сока.",
        price: 299,
        image: "https://images.unsplash.com/photo-1547514701-42782101795e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        name: "Мандарины Maroc",
        description: "Легко чистящиеся мандарины с насыщенным вкусом.",
        price: 399,
        image: "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Грейпфрут Ruby",
        description: "Красный грейпфрут с горьковато-сладким вкусом.",
        price: 189,
        image: "https://images.unsplash.com/photo-1574302503386-0c4e8c5eaa3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 4,
        name: "Лимон Sicilian",
        description: "Ароматные лимоны с толстой кожурой. Богаты витамином C.",
        price: 149,
        image: "https://images.unsplash.com/photo-1580274467991-3a5c8e7aee3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        name: "Набор цитрусовый",
        description: "Ассорти из апельсинов, мандаринов и грейпфрутов.",
        price: 899,
        image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 6,
        name: "Свежевыжатый апельсиновый сок",
        description: "1 литр. Без добавок и консервантов.",
        price: 450,
        image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
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