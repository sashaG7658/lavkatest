// script.js
// ICEBERG Shop - Версия с разделами категорий
// ======================

let currentTheme = 'light';
let tg = null;
let products = [];
let cart = [];
let autoUpdateInterval = null;
let currentCategory = 'all'; // Текущая выбранная категория

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
// 2. КАТЕГОРИИ ТОВАРОВ
// ======================

const categories = [
    { id: 'all', name: '🔥 ВСЕ ТОВАРЫ', icon: 'fas fa-fire', color: '#FF9800' },
    { id: 'nicotine', name: '🚬 НИКОТИНОВЫЕ ПЛАСТИНКИ', icon: 'fas fa-tablets', color: '#795548' },
    { id: 'arqa', name: '🎨 ARQA', icon: 'fas fa-palette', color: '#2196F3' },
    { id: 'shok', name: '⚡ ШОК', icon: 'fas fa-bolt', color: '#FF5722' },
    { id: 'storm', name: '🌪️ STORM BY ШОК', icon: 'fas fa-wind', color: '#9C27B0' },
    { id: 'st', name: '🔬 ST (АНАЛОГ FERDS)', icon: 'fas fa-flask', color: '#009688' },
    { id: 'kasta', name: '👑 KASTA', icon: 'fas fa-crown', color: '#FFC107' },
    { id: 'ferds', name: '⚗️ FERDS', icon: 'fas fa-vial', color: '#3F51B5' },
    { id: 'iceberg', name: '❄️ ICEBERG', icon: 'fas fa-snowflake', color: '#03A9F4' },
    { id: 'faff', name: '🐉 FAFF', icon: 'fas fa-dragon', color: '#E91E63' },
    { id: 'randm', name: '🎲 RANDM BY FAFF', icon: 'fas fa-dice', color: '#673AB7' },
    { id: 'shooter', name: '🎯 SHOOTER BY FAFF', icon: 'fas fa-bullseye', color: '#FF9800' },
    { id: 'zuzu', name: '✨ ZUZU BY FAFF', icon: 'fas fa-star', color: '#FFEB3B' },
    { id: 'sweden', name: '🇸🇪 ШВЕЦИЯ', icon: 'fas fa-flag', color: '#F44336' },
    { id: 'red', name: '🔴 RED', icon: 'fas fa-circle', color: '#F44336' },
    { id: 'mad', name: '😜 MAD', icon: 'fas fa-grin-tongue-wink', color: '#9C27B0' },
    { id: 'bitcoin', name: '₿ BITCOIN', icon: 'fab fa-bitcoin', color: '#FF9800' },
    { id: 'drymost', name: '💧 DRYMOST', icon: 'fas fa-tint', color: '#2196F3' },
    { id: 'corvus', name: '🐦 CORVUS', icon: 'fas fa-crow', color: '#607D8B' }
];

// ======================
// ФУНКЦИЯ ФИЛЬТРАЦИИ ПО КАТЕГОРИЯМ
// ======================

function filterProductsByCategory(productsToFilter) {
    if (currentCategory === 'all') {
        return productsToFilter;
    }
    
    return productsToFilter.filter(product => {
        const productName = product.name.toLowerCase();
        
        switch(currentCategory) {
            // Никотиновые пластинки
            case 'nicotine':
                return productName.includes('пластин') || 
                       productName.includes('никотин') ||
                       productName.includes('пастил');
            
            // ARQA - включает несколько подкатегорий
            case 'arqa':
                return productName.includes('arqa') ||
                       productName.includes('арка') ||
                       productName.includes('70mg') ||
                       productName.includes('70 мг') ||
                       productName.includes('standart') ||
                       productName.includes('standard') ||
                       productName.includes('slim') ||
                       productName.includes('cs:go') ||
                       productName.includes('cs go') ||
                       productName.includes('слово пацана') ||
                       productName.includes('слово');
            
            // ШОК - включает несколько подкатегорий
            case 'shok':
                return productName.includes('шок') ||
                       productName.includes('shok') ||
                       (productName.includes('150 мг') && productName.includes('шок')) ||
                       (productName.includes('150 мг') && productName.includes('shok')) ||
                       (productName.includes('75 мг') && productName.includes('шок')) ||
                       (productName.includes('75 мг') && productName.includes('shok')) ||
                       productName.includes('shok by x') ||
                       productName.includes('шок by x');
            
            // STORM BY ШОК
            case 'storm':
                return productName.includes('storm') ||
                       productName.includes('шторм');
            
            // ST (АНАЛОГ FERDS) - только определенные позиции
            case 'st':
                return (productName.includes('st') && !productName.includes('storm')) ||
                       productName.includes('стей') ||
                       productName.includes('ст ') ||
                       productName.includes(' st') ||
                       productName.includes('menthol 45') ||
                       productName.includes('lime delight 55') ||
                       productName.includes('luxury mint 65') ||
                       productName.includes('freeze mint 75') ||
                       productName.includes('royal mint 120');
            
            // KASTA - включает несколько подкатегорий
            case 'kasta':
                return productName.includes('kasta') ||
                       productName.includes('каста') ||
                       (productName.includes('101 мг') && productName.includes('kasta')) ||
                       (productName.includes('105 мг') && productName.includes('kasta')) ||
                       productName.includes('limited edition') ||
                       productName.includes('covid') ||
                       productName.includes('anime') ||
                       productName.includes('dota') ||
                       productName.includes('phobia');
            
            // FERDS - только определенные позиции
            case 'ferds':
                return productName.includes('ferds') ||
                       productName.includes('фердс') ||
                       productName.includes('feds') ||
                       productName.includes('fedrs') ||
                       productName.includes('fedrs №5') ||
                       productName.includes('fedrs №8') ||
                       productName.includes('fedrs №9');
            
            // ICEBERG - делится на подкатегории
            case 'iceberg':
                return productName.includes('iceberg') ||
                       productName.includes('айсберг') ||
                       productName.includes('strong 75') ||
                       productName.includes('triangles 75') ||
                       productName.includes('extra strong 100') ||
                       productName.includes('extreme 110') ||
                       productName.includes('ultra 150');
            
            // FAFF - включает все версии
            case 'faff':
                return productName.includes('faff') ||
                       productName.includes('фафф') ||
                       (productName.includes('65 мг') && productName.includes('faff')) ||
                       (productName.includes('75 мг') && productName.includes('faff')) ||
                       (productName.includes('100 мг') && productName.includes('faff')) ||
                       (productName.includes('150 мг') && productName.includes('faff'));
            
            // RANDM BY FAFF
            case 'randm':
                return productName.includes('randm') ||
                       productName.includes('рандм');
            
            // SHOOTER BY FAFF
            case 'shooter':
                return productName.includes('shooter') ||
                       productName.includes('шутер');
            
            // ZUZU BY FAFF
            case 'zuzu':
                return productName.includes('zuzu') ||
                       productName.includes('зузу');
            
            // ШВЕЦИЯ - включает несколько брендов
            case 'sweden':
                return productName.includes('швеция') ||
                       productName.includes('sweden') ||
                       productName.includes('odens') ||
                       productName.includes('lyft') ||
                       productName.includes('zyn') ||
                       productName.includes('chn');
            
            // RED - включает несколько вариантов
            case 'red':
                return productName.includes('red') ||
                       productName.includes('ред') ||
                       productName.includes('red original') ||
                       productName.includes('red ice cool') ||
                       productName.includes('red killer');
            
            // MAD
            case 'mad':
                return productName.includes('mad');
            
            // BITCOIN
            case 'bitcoin':
                return productName.includes('bitcoin');
            
            // DRYMOST
            case 'drymost':
                return productName.includes('drymost');
            
            // CORVUS
            case 'corvus':
                return productName.includes('corvus');
            
            default:
                return true;
        }
    });
}

// ======================
// ФУНКЦИЯ ОПРЕДЕЛЕНИЯ КАТЕГОРИИ ТОВАРА
// ======================

function detectProductCategory(productName) {
    const name = productName.toLowerCase();
    
    // ICEBERG
    if (name.includes('iceberg') || name.includes('айсберг') ||
        name.includes('strong 75') || name.includes('triangles 75') ||
        name.includes('extra strong 100') || name.includes('extreme 110') ||
        name.includes('ultra 150')) return 'iceberg';
    
    // ARQA
    if (name.includes('arqa') || name.includes('арка') ||
        name.includes('70mg') || name.includes('70 мг') ||
        name.includes('standart') || name.includes('standard') ||
        name.includes('slim') || name.includes('cs:go') ||
        name.includes('слово пацана')) return 'arqa';
    
    // ШОК
    if (name.includes('шок') || name.includes('shok') ||
        (name.includes('150 мг') && (name.includes('шок') || name.includes('shok'))) ||
        (name.includes('75 мг') && (name.includes('шок') || name.includes('shok'))) ||
        name.includes('shok by x')) return 'shok';
    
    // STORM
    if (name.includes('storm') || name.includes('шторм')) return 'storm';
    
    // ST
    if ((name.includes('st') && !name.includes('storm')) ||
        name.includes('стей') || name.includes('ст ') ||
        name.includes('menthol 45') || name.includes('lime delight 55') ||
        name.includes('luxury mint 65') || name.includes('freeze mint 75') ||
        name.includes('royal mint 120')) return 'st';
    
    // KASTA
    if (name.includes('kasta') || name.includes('каста') ||
        name.includes('limited edition') || name.includes('covid') ||
        name.includes('anime') || name.includes('dota') ||
        name.includes('phobia')) return 'kasta';
    
    // FERDS
    if (name.includes('ferds') || name.includes('фердс') ||
        name.includes('fedrs') || name.includes('feds') ||
        name.includes('fedrs №5') || name.includes('fedrs №8') ||
        name.includes('fedrs №9')) return 'ferds';
    
    // FAFF
    if (name.includes('faff') || name.includes('фафф') ||
        (name.includes('65 мг') && name.includes('faff')) ||
        (name.includes('75 мг') && name.includes('faff')) ||
        (name.includes('100 мг') && name.includes('faff')) ||
        (name.includes('150 мг') && name.includes('faff'))) return 'faff';
    
    // RANDM
    if (name.includes('randm') || name.includes('рандм')) return 'randm';
    
    // SHOOTER
    if (name.includes('shooter') || name.includes('шутер')) return 'shooter';
    
    // ZUZU
    if (name.includes('zuzu') || name.includes('зузу')) return 'zuzu';
    
    // ШВЕЦИЯ
    if (name.includes('швеция') || name.includes('sweden') ||
        name.includes('odens') || name.includes('lyft') ||
        name.includes('zyn') || name.includes('chn')) return 'sweden';
    
    // RED
    if (name.includes('red') || name.includes('ред') ||
        name.includes('original') || name.includes('ice cool') ||
        name.includes('killer')) return 'red';
    
    // MAD
    if (name.includes('mad')) return 'mad';
    
    // BITCOIN
    if (name.includes('bitcoin')) return 'bitcoin';
    
    // DRYMOST
    if (name.includes('drymost')) return 'drymost';
    
    // CORVUS
    if (name.includes('corvus')) return 'corvus';
    
    // Никотиновые пластинки
    if (name.includes('пластин') || name.includes('никотин') ||
        name.includes('пастил')) return 'nicotine';
    
    return 'other';
}
function createCategoriesNav() {
    const categoriesContainer = document.getElementById('categoriesNav');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = categories.map(category => `
        <button class="category-btn ${currentCategory === category.id ? 'active' : ''}" 
                onclick="switchCategory('${category.id}')"
                style="--category-color: ${category.color}">
            <i class="${category.icon}"></i>
            <span>${category.name}</span>
        </button>
    `).join('');
}

function switchCategory(categoryId) {
    currentCategory = categoryId;
    createCategoriesNav();
    renderProductsByCategory();
    
    // Прокручиваем к началу товаров
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    
    // Показываем уведомление
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        showNotification(`📂 Категория: ${category.name}`);
    }
}

function filterProductsByCategory(productsToFilter) {
    if (currentCategory === 'all') {
        return productsToFilter;
    }
    
    // Фильтруем товары по категории (на основе названия)
    return productsToFilter.filter(product => {
        const productName = product.name.toLowerCase();
        
        switch(currentCategory) {
            case 'nicotine':
                return productName.includes('пластин') || productName.includes('никотин');
            case 'arqa':
                return productName.includes('arqa');
            case 'shok':
                return productName.includes('шок');
            case 'storm':
                return productName.includes('storm') || productName.includes('шторм');
            case 'st':
                return productName.includes('st ') || productName.includes(' st') || productName.includes('фердс');
            case 'kasta':
                return productName.includes('kasta') || productName.includes('каста');
            case 'ferds':
                return productName.includes('ferds') || productName.includes('фердс');
            case 'iceberg':
                return productName.includes('iceberg') || productName.includes('айсберг');
            case 'faff':
                return productName.includes('faff');
            case 'randm':
                return productName.includes('randm');
            case 'shooter':
                return productName.includes('shooter');
            case 'zuzu':
                return productName.includes('zuzu');
            case 'sweden':
                return productName.includes('швеция');
            case 'red':
                return productName.includes('red') || productName.includes('ред');
            case 'mad':
                return productName.includes('mad');
            case 'bitcoin':
                return productName.includes('bitcoin');
            case 'drymost':
                return productName.includes('drymost');
            case 'corvus':
                return productName.includes('corvus');
            default:
                return true;
        }
    });
}

// ======================
// 3. ЗАГРУЗКА ТОВАРОВ
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
            // Добавляем поле category если его нет
            if (!product.hasOwnProperty('category')) {
                product.category = detectProductCategory(product.name);
            }
        });
        
        console.log(`✅ Загружено ${loadedProducts.length} товаров с GitHub`);
        return loadedProducts;
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров с GitHub:', error);
        return getDefaultProducts();
    }
}

function detectProductCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('iceberg') || name.includes('айсберг')) return 'iceberg';
    if (name.includes('arqa')) return 'arqa';
    if (name.includes('шок')) return 'shok';
    if (name.includes('storm') || name.includes('шторм')) return 'storm';
    if (name.includes('st ') || name.includes(' st') || name.includes('фердс')) return 'st';
    if (name.includes('kasta') || name.includes('каста')) return 'kasta';
    if (name.includes('ferds')) return 'ferds';
    if (name.includes('faff')) return 'faff';
    if (name.includes('randm')) return 'randm';
    if (name.includes('shooter')) return 'shooter';
    if (name.includes('zuzu')) return 'zuzu';
    if (name.includes('швеция')) return 'sweden';
    if (name.includes('red') || name.includes('ред')) return 'red';
    if (name.includes('mad')) return 'mad';
    if (name.includes('bitcoin')) return 'bitcoin';
    if (name.includes('drymost')) return 'drymost';
    if (name.includes('corvus')) return 'corvus';
    if (name.includes('пластин') || name.includes('никотин')) return 'nicotine';
    
    return 'other';
}

function getDefaultProducts() {
    return [
        {
            id: 1,
            name: "ICEBERG ULTRA MENTHOL",
            description: "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
            price: 500,
            quantity: 10,
            category: "iceberg",
            image: "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg",
            isNew: true
        },
        {
            id: 2,
            name: "ICEBERG ULTRA BLACK",
            description: "ICEBERG ULTRA BLACK (150 МГ) - ТУТТИ-ФРУТТИ",
            price: 500,
            quantity: 10,
            category: "iceberg",
            image: "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg",
            isNew: true
        },
        {
            id: 3,
            name: "ARQA SPECIAL MIX",
            description: "ARQA SPECIAL MIX - УНИКАЛЬНЫЙ ВКУС",
            price: 550,
            quantity: 8,
            category: "arqa",
            image: "https://example.com/arqa.jpg"
        },
        {
            id: 4,
            name: "SHOK ENERGY",
            description: "SHOK ENERGY - ЭНЕРГЕТИЧЕСКИЙ ВКУС",
            price: 480,
            quantity: 12,
            category: "shok",
            image: "https://example.com/shok.jpg"
        },
        {
            id: 5,
            name: "STORM MENTHOL",
            description: "STORM BY ШОК MENTHOL - ОХЛАЖДАЮЩИЙ",
            price: 520,
            quantity: 6,
            category: "storm",
            image: "https://example.com/storm.jpg"
        }
    ];
}

// ======================
// 4. ОТОБРАЖЕНИЕ ТОВАРОВ
// ======================

function renderProductsByCategory() {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;
    
    const filteredProducts = filterProductsByCategory(products);
    
    if (filteredProducts.length === 0) {
        catalog.innerHTML = `
            <div class="empty-category">
                <i class="fas fa-box-open fa-3x"></i>
                <h3>Товаров в этой категории пока нет</h3>
                <p>Выберите другую категорию или подождите добавления товаров</p>
            </div>
        `;
        return;
    }
    
    catalog.innerHTML = filteredProducts.map(product => {
        const qty = product.quantity || 0;
        const isAvailable = qty > 0;
        
        // Определяем цвет категории для бейджа
        const categoryInfo = categories.find(c => c.id === product.category) || categories[0];
        const categoryColor = categoryInfo.color || '#FF9800';
        
        let badge = '';
        if (product.isNew && isAvailable) {
            badge = '<div class="new-badge pulse">NEW</div>';
        } else if (!isAvailable) {
            badge = '<div class="new-badge" style="background: #F44336;">НЕТ В НАЛИЧИИ</div>';
        }
        
        // Добавляем бейдж категории
        if (product.category && product.category !== 'other') {
            badge += `<div class="category-badge" style="background: ${categoryColor};">${categoryInfo.name.split(' ')[0]}</div>`;
        }
        
        return `
            <div class="product-card">
                ${badge}
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image loading"
                     loading="lazy"
                     onload="this.classList.remove('loading')"
                     onerror="this.src='https://via.placeholder.com/300x200/${categoryColor.replace('#', '')}/FFFFFF?text=${encodeURIComponent(product.name.split(' ')[0])}'">
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
// 5. КОРЗИНА
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
    
    if (product.quantity <= 0) {
        showNotification('❌ Товар закончился');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
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
// 6. ОФОРМЛЕНИЕ ЗАКАЗА
// ======================

async function checkout() {
    if (cart.length === 0) return;
    
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
                    
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
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
// 7. АВТООБНОВЛЕНИЕ
// ======================

async function loadAndRenderProducts() {
    try {
        const newProducts = await loadProductsFromGitHub();
        
        const oldProducts = [...products];
        products = newProducts;
        
        createCategoriesNav();
        renderProductsByCategory();
        
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
// 8. ИНИЦИАЛИЗАЦИЯ
// ======================

async function initApp() {
    detectTheme();
    initTelegram();
    
    await loadAndRenderProducts();
    loadCart();
    startAutoUpdate();
    
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    themeSwitch.onclick = toggleTheme;
    document.body.appendChild(themeSwitch);
    updateThemeIcon();
    
    document.getElementById('cartButton').onclick = openCart;
    document.getElementById('closeCart').onclick = closeCart;
    document.getElementById('cartOverlay').onclick = closeCart;
    document.getElementById('checkoutButton').onclick = checkout;
    document.getElementById('clearCartButton').onclick = clearCart;
    
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.clearCart = clearCart;
    window.toggleTheme = toggleTheme;
    window.switchCategory = switchCategory;
    
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
    
    console.log('✅ ICEBERG Shop с категориями инициализирован');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.addEventListener('beforeunload', stopAutoUpdate);

