// script.js
// ICEBERG Shop - Версия с кнопками навигации и автоматической статистикой
// ======================

let currentTheme = 'light';
let tg = null;
let products = [];
let cart = [];
let autoUpdateInterval = null;
let currentCategory = 'all'; // Текущая выбранная категория
let currentSubCategory = null; // Текущий подраздел
let orderHistory = []; // История заказов
let salesStats = { // Статистика продаж
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    todaySales: 0,
    todayRevenue: 0,
    categoryStats: {},
    productStats: {}
};

// Конфигурация
const CONFIG = {
    MANAGER_USERNAME: 'Chief_68',
    MANAGER_LINK: 'https://t.me/Chief_68',
    SHOP_NAME: 'LAVKA Shop',
    AUTO_UPDATE_INTERVAL: 60000,
    NOTIFICATION_DURATION: 3000
};

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
// 2. КАТЕГОРИИ ТОВАРОВ С ПОДРАЗДЕЛАМИ
// ======================

const categories = [
    { 
        id: 'all', 
        name: '🔥 ВСЕ ТОВАРЫ', 
        icon: 'fas fa-fire', 
        color: '#FF9800',
        subCategories: null
    },
    { 
        id: 'nicotine', 
        name: '🚬 НИКОТИНОВЫЕ ПЛАСТИНКИ', 
        icon: 'fas fa-tablets', 
        color: '#795548',
        subCategories: null
    },
    { 
        id: 'arqa', 
        name: '🎨 ARQA', 
        icon: 'fas fa-palette', 
        color: '#2196F3',
        subCategories: [
            { id: '70mg', name: '70mg' },
            { id: 'standart', name: 'ARQA STANDART' },
            { id: 'slim', name: 'ARQA SLIM' },
            { id: 'csgo', name: 'ARQA CS:GO' },
            { id: 'slovo', name: 'ARQA СЛОВО ПАЦАНА' }
        ]
    },
    { 
        id: 'shok', 
        name: '⚡ ШОК', 
        icon: 'fas fa-bolt', 
        color: '#FF5722',
        subCategories: [
            { id: 'shok150', name: 'ШОК (150 МГ)' },
            { id: 'shok75', name: 'ШОК (75 МГ)' },
            { id: 'shokbyx', name: 'ШОК BY X' }
        ]
    },
    { 
        id: 'storm', 
        name: '🌪️ STORM BY ШОК', 
        icon: 'fas fa-wind', 
        color: '#9C27B0',
        subCategories: null
    },
    { 
        id: 'st', 
        name: '🔬 ST (АНАЛОГ FERDS)', 
        icon: 'fas fa-flask', 
        color: '#009688',
        subCategories: [
            { id: 'st45', name: 'ST MENTHOL (45 МГ)' },
            { id: 'st55', name: 'ST LIME DELIGHT (55 МГ)' },
            { id: 'st65', name: 'ST LUXURY MINT (65 МГ)' },
            { id: 'st75', name: 'ST FREEZE MINT (75 МГ)' },
            { id: 'st120', name: 'ST ROYAL MINT (120 МГ)' }
        ]
    },
    { 
        id: 'kasta', 
        name: '👑 KASTA', 
        icon: 'fas fa-crown', 
        color: '#FFC107',
        subCategories: [
            { id: 'k101', name: 'KASTA CLASSIC (101 МГ)' },
            { id: 'k105', name: 'KASTA CLASSIC (105 МГ)' },
            { id: 'k105le', name: 'KASTA LIMITED EDITION (105 МГ)' },
            { id: 'k120c', name: 'KASTA COVID (120 МГ)' },
            { id: 'k120a', name: 'KASTA ANIME (120 МГ)' },
            { id: 'k125a', name: 'KASTA ANIME (125 МГ)' },
            { id: 'k120d', name: 'KASTA DOTA (120 МГ)' },
            { id: 'k125p', name: 'KASTA PHOBIA (125 МГ)' }
        ]
    },
    { 
        id: 'ferds', 
        name: '⚗️ FERDS', 
        icon: 'fas fa-vial', 
        color: '#3F51B5',
        subCategories: [
            { id: 'f30', name: 'FEDRS №5 (30 МГ)' },
            { id: 'f50', name: 'FEDRS №8 (50 МГ)' },
            { id: 'f65', name: 'FEDRS №9 (65 МГ)' }
        ]
    },
    { 
        id: 'iceberg', 
        name: '❄️ ICEBERG', 
        icon: 'fas fa-snowflake', 
        color: '#03A9F4',
        subCategories: [
            { id: 'ice75s', name: 'ICEBERG STRONG (75 МГ)' },
            { id: 'ice75t', name: 'ICEBERG TRIANGLES (75 МГ)' },
            { id: 'ice100', name: 'ICEBERG EXTRA STRONG (100 МГ)' },
            { id: 'ice110', name: 'ICEBERG EXTREME (110 МГ)' },
            { id: 'ice150', name: 'ICEBERG ULTRA (150 МГ)' }
        ]
    },
    { 
        id: 'faff', 
        name: '🐉 FAFF', 
        icon: 'fas fa-dragon', 
        color: '#E91E63',
        subCategories: [
            { id: 'faff65', name: 'FAFF (65 МГ)' },
            { id: 'faff75', name: 'FAFF (75 МГ)' },
            { id: 'faff100', name: 'FAFF (100 МГ)' },
            { id: 'faff150', name: 'FAFF (150 МГ)' }
        ]
    },
    { 
        id: 'randm', 
        name: '🎲 RANDM BY FAFF', 
        icon: 'fas fa-dice', 
        color: '#673AB7',
        subCategories: null
    },
    { 
        id: 'shooter', 
        name: '🎯 SHOOTER BY FAFF', 
        icon: 'fas fa-bullseye', 
        color: '#FF9800',
        subCategories: null
    },
    { 
        id: 'zuzu', 
        name: '✨ ZUZU BY FAFF', 
        icon: 'fas fa-star', 
        color: '#FFEB3B',
        subCategories: null
    },
    { 
        id: 'sweden', 
        name: '🇸🇪 ШВЕЦИЯ', 
        icon: 'fas fa-flag', 
        color: '#F44336',
        subCategories: [
            { id: 'odens', name: 'ODENS' },
            { id: 'lyft', name: 'LYFT' },
            { id: 'zyn', name: 'ZYN' },
            { id: 'chn', name: 'CHN' }
        ]
    },
    { 
        id: 'red', 
        name: '🔴 RED', 
        icon: 'fas fa-circle', 
        color: '#F44336',
        subCategories: [
            { id: 'red_o', name: 'RED ORIGINAL' },
            { id: 'red_i', name: 'RED ICE COOL' },
            { id: 'red_k', name: 'RED KILLER' }
        ]
    },
    { 
        id: 'mad', 
        name: '😜 MAD', 
        icon: 'fas fa-grin-tongue-wink', 
        color: '#9C27B0',
        subCategories: null
    },
    { 
        id: 'bitcoin', 
        name: '₿ BITCOIN', 
        icon: 'fab fa-bitcoin', 
        color: '#FF9800',
        subCategories: null
    },
    { 
        id: 'drymost', 
        name: '💧 DRYMOST', 
        icon: 'fas fa-tint', 
        color: '#2196F3',
        subCategories: null
    },
    { 
        id: 'corvus', 
        name: '🐦 CORVUS', 
        icon: 'fas fa-crow', 
        color: '#607D8B',
        subCategories: null
    }
];

function createCategoriesNav() {
    const categoriesContainer = document.getElementById('categoriesNav');
    const subCategoriesContainer = document.getElementById('subCategoriesNav');
    const categoriesScrollLeft = document.getElementById('categoriesScrollLeft');
    const categoriesScrollRight = document.getElementById('categoriesScrollRight');
    const subCategoriesScrollLeft = document.getElementById('subCategoriesScrollLeft');
    const subCategoriesScrollRight = document.getElementById('subCategoriesScrollRight');
    
    if (!categoriesContainer) return;
    
    // Создаем основные категории
    categoriesContainer.innerHTML = categories.map(category => `
        <button class="category-btn ${currentCategory === category.id ? 'active' : ''}" 
                onclick="switchCategory('${category.id}')"
                style="--category-color: ${category.color}">
            <i class="${category.icon}"></i>
            <span>${category.name}</span>
        </button>
    `).join('');
    
    // Создаем подкатегории если они есть
    if (subCategoriesContainer) {
        const category = categories.find(c => c.id === currentCategory);
        
        if (category && category.subCategories && category.subCategories.length > 0) {
            subCategoriesContainer.innerHTML = `
                <button class="subcategory-btn ${currentSubCategory === null ? 'active' : ''}" 
                        onclick="switchSubCategory(null)">
                    <i class="fas fa-layer-group"></i>
                    <span>Все ${category.name}</span>
                </button>
                ${category.subCategories.map(subCat => `
                    <button class="subcategory-btn ${currentSubCategory === subCat.id ? 'active' : ''}" 
                            onclick="switchSubCategory('${subCat.id}')">
                        <i class="fas fa-tag"></i>
                        <span>${subCat.name}</span>
                    </button>
                `).join('')}
            `;
            subCategoriesContainer.style.display = 'flex';
            
            // Показываем кнопки навигации для подкатегорий
            if (subCategoriesScrollLeft && subCategoriesScrollRight) {
                subCategoriesScrollLeft.style.display = 'flex';
                subCategoriesScrollRight.style.display = 'flex';
                updateNavButtons('subCategoriesNav', 'subCategoriesScrollLeft', 'subCategoriesScrollRight');
            }
        } else {
            subCategoriesContainer.innerHTML = '';
            subCategoriesContainer.style.display = 'none';
            
            // Скрываем кнопки навигации для подкатегорий
            if (subCategoriesScrollLeft && subCategoriesScrollRight) {
                subCategoriesScrollLeft.style.display = 'none';
                subCategoriesScrollRight.style.display = 'none';
            }
        }
    }
    
    // Обновляем видимость кнопок навигации для основных категорий
    if (categoriesScrollLeft && categoriesScrollRight) {
        updateNavButtons('categoriesNav', 'categoriesScrollLeft', 'categoriesScrollRight');
    }
}

function switchCategory(categoryId) {
    currentCategory = categoryId;
    currentSubCategory = null; // Сбрасываем подкатегорию при смене основной категории
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

function switchSubCategory(subCategoryId) {
    currentSubCategory = subCategoryId;
    createCategoriesNav();
    renderProductsByCategory();
    
    const category = categories.find(c => c.id === currentCategory);
    if (category) {
        const subCat = category.subCategories?.find(s => s.id === subCategoryId);
        if (subCat) {
            showNotification(`🏷️ Подраздел: ${subCat.name}`);
        }
    }
}

// Функция для обновления видимости кнопок навигации
function updateNavButtons(containerId, leftBtnId, rightBtnId) {
    const container = document.getElementById(containerId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);
    
    if (!container || !leftBtn || !rightBtn) return;
    
    // Проверяем, нужна ли прокрутка
    const hasScroll = container.scrollWidth > container.clientWidth;
    
    if (!hasScroll) {
        leftBtn.classList.add('hidden');
        rightBtn.classList.add('hidden');
        return;
    }
    
    // Показываем кнопки
    leftBtn.classList.remove('hidden');
    rightBtn.classList.remove('hidden');
    
    // Проверяем положение прокрутки
    const isAtStart = container.scrollLeft <= 10;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
    
    leftBtn.classList.toggle('hidden', isAtStart);
    rightBtn.classList.toggle('hidden', isAtEnd);
}

// Функции для прокрутки категорий
function scrollCategories(direction) {
    const container = document.getElementById('categoriesNav');
    if (!container) return;
    
    const scrollAmount = 200;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
    
    // Обновляем кнопки после прокрутки
    setTimeout(() => {
        updateNavButtons('categoriesNav', 'categoriesScrollLeft', 'categoriesScrollRight');
    }, 300);
}

function scrollSubCategories(direction) {
    const container = document.getElementById('subCategoriesNav');
    if (!container || container.style.display === 'none') return;
    
    const scrollAmount = 150;
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
    
    // Обновляем кнопки после прокрутки
    setTimeout(() => {
        updateNavButtons('subCategoriesNav', 'subCategoriesScrollLeft', 'subCategoriesScrollRight');
    }, 300);
}

// ======================
// 3. СТАТИСТИКА ПРОДАЖ
// ======================

function loadSalesStats() {
    try {
        const savedStats = localStorage.getItem('iceberg_sales_stats');
        if (savedStats) {
            salesStats = JSON.parse(savedStats);
            console.log(`📊 Загружена статистика продаж: ${salesStats.totalOrders} заказов`);
        } else {
            // Инициализируем пустую статистику
            salesStats = {
                totalSales: 0,
                totalRevenue: 0,
                totalOrders: 0,
                todaySales: 0,
                todayRevenue: 0,
                categoryStats: {},
                productStats: {}
            };
            console.log('📊 Инициализирована новая статистика продаж');
        }
        updateStatsUI();
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
        salesStats = {
            totalSales: 0,
            totalRevenue: 0,
            totalOrders: 0,
            todaySales: 0,
            todayRevenue: 0,
            categoryStats: {},
            productStats: {}
        };
    }
}

function saveSalesStats() {
    try {
        localStorage.setItem('iceberg_sales_stats', JSON.stringify(salesStats));
        updateStatsUI();
    } catch (error) {
        console.error('❌ Ошибка сохранения статистики:', error);
    }
}

function updateSalesStats(orderData) {
    const today = new Date().toDateString();
    
    // Обновляем общую статистику
    salesStats.totalOrders++;
    salesStats.totalSales += orderData.items_count;
    salesStats.totalRevenue += orderData.total;
    
    // Обновляем статистику за сегодня
    const orderDate = new Date(orderData.timestamp).toDateString();
    if (orderDate === today) {
        salesStats.todaySales += orderData.items_count;
        salesStats.todayRevenue += orderData.total;
    }
    
    // Обновляем статистику по категориям и товарам
    orderData.products.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            // Определяем категорию товара
            const category = detectProductCategory(product.name);
            
            // Обновляем статистику по категориям
            if (!salesStats.categoryStats[category]) {
                salesStats.categoryStats[category] = {
                    sales: 0,
                    revenue: 0
                };
            }
            salesStats.categoryStats[category].sales += item.quantity;
            salesStats.categoryStats[category].revenue += item.price * item.quantity;
            
            // Обновляем статистику по товарам
            if (!salesStats.productStats[product.id]) {
                salesStats.productStats[product.id] = {
                    name: product.name,
                    sales: 0,
                    revenue: 0
                };
            }
            salesStats.productStats[product.id].sales += item.quantity;
            salesStats.productStats[product.id].revenue += item.price * item.quantity;
        }
    });
    
    saveSalesStats();
    console.log('📊 Статистика продаж обновлена');
}

function updateStatsUI() {
    const statsPanel = document.getElementById('salesStats');
    if (!statsPanel) return;
    
    // Форматируем числа
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };
    
    statsPanel.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${formatNumber(salesStats.totalOrders)}</div>
                    <div class="stat-label">Всего заказов</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${formatNumber(salesStats.totalSales)}</div>
                    <div class="stat-label">Товаров продано</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-ruble-sign"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${formatNumber(salesStats.totalRevenue)} ₽</div>
                    <div class="stat-label">Общая выручка</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-day"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">${formatNumber(salesStats.todaySales)}</div>
                    <div class="stat-label">Продано сегодня</div>
                </div>
            </div>
        </div>
        
        <div class="stats-details">
            <button class="toggle-stats-btn" onclick="toggleStatsDetails()">
                <i class="fas fa-chart-bar"></i>
                <span>Детальная статистика</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            
            <div class="stats-details-content" id="statsDetails" style="display: none;">
                <div class="category-stats">
                    <h4><i class="fas fa-tags"></i> По категориям:</h4>
                    ${Object.entries(salesStats.categoryStats)
                        .sort((a, b) => b[1].revenue - a[1].revenue)
                        .slice(0, 5)
                        .map(([category, data]) => {
                            const catInfo = categories.find(c => c.id === category) || { name: category };
                            return `
                            <div class="category-stat-item">
                                <span class="category-name">${catInfo.name}</span>
                                <span class="category-values">
                                    <span class="sales">${data.sales} шт.</span>
                                    <span class="revenue">${formatNumber(data.revenue)} ₽</span>
                                </span>
                            </div>
                        `;
                        }).join('')}
                </div>
                
                <div class="top-products">
                    <h4><i class="fas fa-crown"></i> Топ товаров:</h4>
                    ${Object.values(salesStats.productStats)
                        .sort((a, b) => b.sales - a.sales)
                        .slice(0, 5)
                        .map((product, index) => `
                            <div class="product-stat-item">
                                <span class="product-rank">${index + 1}.</span>
                                <span class="product-name">${product.name.split(' ').slice(0, 2).join(' ')}</span>
                                <span class="product-values">
                                    <span class="sales">${product.sales} шт.</span>
                                    <span class="revenue">${formatNumber(product.revenue)} ₽</span>
                                </span>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
    `;
}

function toggleStatsDetails() {
    const details = document.getElementById('statsDetails');
    const toggleBtn = document.querySelector('.toggle-stats-btn');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        toggleBtn.querySelector('.fa-chevron-down').className = 'fas fa-chevron-up';
    } else {
        details.style.display = 'none';
        toggleBtn.querySelector('.fa-chevron-up').className = 'fas fa-chevron-down';
    }
}

function detectProductCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('iceberg') || name.includes('айсберг')) return 'iceberg';
    if (name.includes('arqa') || name.includes('арка')) return 'arqa';
    if (name.includes('шок') || name.includes('shok')) return 'shok';
    if (name.includes('storm') || name.includes('шторм')) return 'storm';
    if ((name.includes('st') && !name.includes('storm')) || name.includes('стей')) return 'st';
    if (name.includes('kasta') || name.includes('каста')) return 'kasta';
    if (name.includes('ferds') || name.includes('фердс') || name.includes('fedrs')) return 'ferds';
    if (name.includes('faff') || name.includes('фафф')) return 'faff';
    if (name.includes('randm') || name.includes('рандм')) return 'randm';
    if (name.includes('shooter') || name.includes('шутер')) return 'shooter';
    if (name.includes('zuzu') || name.includes('зузу')) return 'zuzu';
    if (name.includes('швеция') || name.includes('sweden') || name.includes('odens') || name.includes('lyft') || name.includes('zyn') || name.includes('chn')) return 'sweden';
    if (name.includes('red') || name.includes('ред')) return 'red';
    if (name.includes('mad')) return 'mad';
    if (name.includes('bitcoin')) return 'bitcoin';
    if (name.includes('drymost')) return 'drymost';
    if (name.includes('corvus')) return 'corvus';
    if (name.includes('пластин') || name.includes('никотин') || name.includes('пастил')) return 'nicotine';
    
    return 'other';
}

// ======================
// 4. ФИЛЬТРАЦИЯ ТОВАРОВ
// ======================

function filterProductsByCategory(productsToFilter) {
    if (currentCategory === 'all') {
        return productsToFilter;
    }
    
    let filtered = productsToFilter.filter(product => {
        const productName = product.name.toLowerCase();
        
        switch(currentCategory) {
            case 'nicotine':
                return productName.includes('пластин') || productName.includes('никотин');
            case 'arqa':
                return productName.includes('arqa') || productName.includes('арка');
            case 'shok':
                return productName.includes('шок') || productName.includes('shok');
            case 'storm':
                return productName.includes('storm') || productName.includes('шторм');
            case 'st':
                return (productName.includes('st') && !productName.includes('storm')) || productName.includes('стей');
            case 'kasta':
                return productName.includes('kasta') || productName.includes('каста');
            case 'ferds':
                return productName.includes('ferds') || productName.includes('фердс') || productName.includes('fedrs');
            case 'iceberg':
                return productName.includes('iceberg') || productName.includes('айсберг');
            case 'faff':
                return productName.includes('faff') || productName.includes('фафф');
            case 'randm':
                return productName.includes('randm') || productName.includes('рандм');
            case 'shooter':
                return productName.includes('shooter') || productName.includes('шутер');
            case 'zuzu':
                return productName.includes('zuzu') || productName.includes('зузу');
            case 'sweden':
                return productName.includes('швеция') || productName.includes('sweden') || productName.includes('odens') || productName.includes('lyft') || productName.includes('zyn') || productName.includes('chn');
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
    
    if (currentSubCategory) {
        const category = categories.find(c => c.id === currentCategory);
        if (category && category.subCategories) {
            filtered = filtered.filter(product => {
                const productName = product.name.toLowerCase();
                const productDesc = (product.description || '').toLowerCase();
                
                switch(currentSubCategory) {
                    case '70mg':
                        return productName.includes('70') || productDesc.includes('70');
                    case 'standart':
                        return productName.includes('standart') || productDesc.includes('standart');
                    case 'slim':
                        return productName.includes('slim') || productDesc.includes('slim');
                    case 'csgo':
                        return productName.includes('cs') || productDesc.includes('cs:go');
                    case 'slovo':
                        return productName.includes('слово') || productDesc.includes('слово пацана');
                    case 'shok150':
                        return productName.includes('150') || productDesc.includes('150 мг');
                    case 'shok75':
                        return productName.includes('75') || productDesc.includes('75 мг');
                    case 'shokbyx':
                        return productName.includes('by x') || productDesc.includes('by x');
                    case 'st45':
                        return productName.includes('45') || productDesc.includes('45 мг');
                    case 'st55':
                        return productName.includes('lime') || productDesc.includes('55 мг');
                    case 'st65':
                        return productName.includes('luxury') || productDesc.includes('65 мг');
                    case 'st75':
                        return productName.includes('freeze') || productDesc.includes('75 мг');
                    case 'st120':
                        return productName.includes('royal') || productDesc.includes('120 мг');
                    case 'k101':
                        return productName.includes('101') || productDesc.includes('101 мг');
                    case 'k105':
                        return productName.includes('classic') && (productName.includes('105') || productDesc.includes('105 мг'));
                    case 'k105le':
                        return productName.includes('limited') || productDesc.includes('limited edition');
                    case 'k120c':
                        return productName.includes('covid') || productDesc.includes('covid');
                    case 'k120a':
                        return productName.includes('anime') && (productName.includes('120') || productDesc.includes('120 мг'));
                    case 'k125a':
                        return productName.includes('anime') && (productName.includes('125') || productDesc.includes('125 мг'));
                    case 'k120d':
                        return productName.includes('dota') || productDesc.includes('dota');
                    case 'k125p':
                        return productName.includes('phobia') || productDesc.includes('phobia');
                    case 'f30':
                        return productName.includes('30') || productDesc.includes('30 мг') || productName.includes('№5');
                    case 'f50':
                        return productName.includes('50') || productDesc.includes('50 мг') || productName.includes('№8');
                    case 'f65':
                        return productName.includes('65') || productDesc.includes('65 мг') || productName.includes('№9');
                    case 'ice75s':
                        return productName.includes('strong') && (productName.includes('75') || productDesc.includes('75 мг'));
                    case 'ice75t':
                        return productName.includes('triangles') || productDesc.includes('triangles');
                    case 'ice100':
                        return productName.includes('extra') || productDesc.includes('extra strong');
                    case 'ice110':
                        return productName.includes('extreme') || productDesc.includes('extreme');
                    case 'ice150':
                        return productName.includes('ultra') || productDesc.includes('ultra');
                    case 'faff65':
                        return productName.includes('65') || productDesc.includes('65 мг');
                    case 'faff75':
                        return productName.includes('75') || productDesc.includes('75 мг');
                    case 'faff100':
                        return productName.includes('100') || productDesc.includes('100 мг');
                    case 'faff150':
                        return productName.includes('150') || productDesc.includes('150 мг');
                    case 'odens':
                        return productName.includes('odens') || productDesc.includes('odens');
                    case 'lyft':
                        return productName.includes('lyft') || productDesc.includes('lyft');
                    case 'zyn':
                        return productName.includes('zyn') || productDesc.includes('zyn');
                    case 'chn':
                        return productName.includes('chn') || productDesc.includes('chn');
                    case 'red_o':
                        return productName.includes('original') || productDesc.includes('original');
                    case 'red_i':
                        return productName.includes('ice cool') || productDesc.includes('ice cool');
                    case 'red_k':
                        return productName.includes('killer') || productDesc.includes('killer');
                    default:
                        return true;
                }
            });
        }
    }
    
    return filtered;
}

// ======================
// 5. ЗАГРУЗКА И ОТОБРАЖЕНИЕ ТОВАРОВ
// ======================

async function loadProductsFromGitHub() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json?t=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const loadedProducts = await response.json();
        
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
        
        const categoryInfo = categories.find(c => c.id === currentCategory) || categories[0];
        const categoryColor = categoryInfo.color || '#FF9800';
        
        let badge = '';
        if (product.isNew && isAvailable) {
            badge = '<div class="new-badge pulse">NEW</div>';
        } else if (!isAvailable) {
            badge = '<div class="new-badge" style="background: #F44336;">НЕТ В НАЛИЧИИ</div>';
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
// 6. КОРЗИНА И ЗАКАЗЫ
// ======================

function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        
        const savedOrders = localStorage.getItem('iceberg_orders');
        orderHistory = savedOrders ? JSON.parse(savedOrders) : [];
        
        console.log(`🛒 Загружено ${cart.length} товаров в корзину, ${orderHistory.length} заказов в истории`);
    } catch (error) {
        console.error('❌ Ошибка загрузки корзины:', error);
        cart = [];
        orderHistory = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('iceberg_cart', JSON.stringify(cart));
        localStorage.setItem('iceberg_orders', JSON.stringify(orderHistory));
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
// 7. ГЕНЕРАЦИЯ И ОФОРМЛЕНИЕ ЗАКАЗА
// ======================

function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ORD-${year}${month}${day}-${random}`;
}

async function notifyManager(orderData) {
    try {
        let message = `📦 *НОВЫЙ ЗАКАЗ #${orderData.orderNumber}*\n\n`;
        
        if (orderData.user) {
            message += `👤 *Покупатель:*\n`;
            if (orderData.user.id) message += `ID: ${orderData.user.id}\n`;
            if (orderData.user.username) message += `@${orderData.user.username}\n`;
            if (orderData.user.first_name) message += `Имя: ${orderData.user.first_name}\n`;
            if (orderData.user.last_name) message += `Фамилия: ${orderData.user.last_name}\n`;
        } else {
            message += `👤 *Анонимный покупатель*\n`;
        }
        
        message += `\n📅 *Дата:* ${new Date(orderData.timestamp).toLocaleString('ru-RU')}\n`;
        message += `\n🛒 *Товары:*\n`;
        orderData.products.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Кол-во: ${item.quantity} шт.\n`;
            message += `   Цена: ${item.price} руб./шт.\n`;
            message += `   Сумма: ${item.price * item.quantity} руб.\n\n`;
        });
        
        message += `💰 *ИТОГО:*\n`;
        message += `Товаров: ${orderData.items_count} шт.\n`;
        message += `Сумма заказа: *${orderData.total} руб.*\n\n`;
        message += `⚡ *Статус:* Ожидает обработки\n`;
        message += `🔗 Для связи: @${CONFIG.MANAGER_USERNAME}`;
        
        console.log("📤 Сообщение для менеджера:", message);
        
        if (tg && tg.initDataUnsafe?.user) {
            try {
                const managerUsername = CONFIG.MANAGER_USERNAME;
                const tgLink = `https://t.me/${managerUsername}?text=${encodeURIComponent(message)}`;
                
                if (tg.openLink) {
                    tg.openLink(tgLink);
                } else {
                    window.open(tgLink, '_blank');
                }
                
                return true;
            } catch (error) {
                console.error('❌ Ошибка открытия чата:', error);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка уведомления менеджера:', error);
        return false;
    }
}

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

    const orderNumber = generateOrderNumber();
    
    const orderData = {
        orderNumber: orderNumber,
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

    // Добавляем в историю заказов
    orderHistory.unshift({
        ...orderData,
        status: 'pending'
    });
    
    // ОБНОВЛЯЕМ СТАТИСТИКУ ПРОДАЖ
    updateSalesStats(orderData);
    
    saveCart();
    
    console.log("🛒 Отправка заказа:", orderData);
    
    try {
        const notified = await notifyManager(orderData);
        
        if (tg && tg.showAlert) {
            tg.showAlert(
                `✅ *Заказ оформлен успешно!*\n\n` +
                `📋 *Номер заказа:* #${orderNumber}\n` +
                `📦 Товаров: ${getCartCount()} шт.\n` +
                `💰 Сумма: ${getCartTotal()} руб.\n\n` +
                `👤 *Свяжитесь с менеджером:*\n` +
                `🔗 @${CONFIG.MANAGER_USERNAME}\n\n` +
                `💬 *Сообщите номер заказа менеджеру*\n` +
                `🔄 Остатки будут обновлены`,
                () => {
                    cart = [];
                    saveCart();
                    closeCart();
                    showManagerNotification(orderNumber);
                    
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
            showOrderConfirmationModal(orderData, orderNumber);
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

// Функции модальных окон и уведомлений (остаются без изменений из предыдущего кода)
function showOrderConfirmationModal(orderData, orderNumber) {
    const oldModals = document.querySelectorAll('.order-confirmation-modal, .manager-notification');
    oldModals.forEach(modal => modal.remove());
    
    const modal = document.createElement('div');
    modal.className = 'order-confirmation-modal';
    modal.innerHTML = `
        <div class="order-confirmation-content">
            <div class="order-confirmation-header">
                <i class="fas fa-check-circle"></i>
                <h2>Заказ оформлен!</h2>
            </div>
            <div class="order-confirmation-body">
                <div class="order-number">
                    <i class="fas fa-hashtag"></i>
                    <span>Номер заказа: <strong>#${orderNumber}</strong></span>
                </div>
                <div class="order-summary">
                    <div class="order-summary-item">
                        <i class="fas fa-box"></i>
                        <span>Товаров: ${orderData.items_count} шт.</span>
                    </div>
                    <div class="order-summary-item">
                        <i class="fas fa-ruble-sign"></i>
                        <span>Сумма: ${orderData.total} руб.</span>
                    </div>
                    <div class="order-summary-item">
                        <i class="fas fa-clock"></i>
                        <span>Время: ${new Date(orderData.timestamp).toLocaleTimeString('ru-RU')}</span>
                    </div>
                </div>
                <div class="order-products">
                    <h3>Состав заказа:</h3>
                    <ul>
                        ${orderData.products.map(item => `
                            <li>${item.name} × ${item.quantity} шт. = ${item.price * item.quantity} руб.</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="order-instructions">
                    <p><i class="fas fa-info-circle"></i> Сохраните номер заказа для связи с менеджером</p>
                </div>
            </div>
            <div class="order-confirmation-footer">
                <button class="close-order-modal">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        showManagerNotification(orderNumber);
    }, 1000);
    
    const closeBtn = modal.querySelector('.close-order-modal');
    closeBtn.addEventListener('click', () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    });
    
    setTimeout(() => {
        if (document.body.contains(modal)) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    }, 10000);
}

function showManagerNotification(orderNumber) {
    const oldNotifications = document.querySelectorAll('.manager-notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'manager-notification';
    notification.innerHTML = `
        <div class="manager-notification-content">
            <div class="manager-notification-icon">
                <i class="fas fa-comment-alt"></i>
            </div>
            <div class="manager-notification-text">
                <h3>Напишите менеджеру</h3>
                <p>Сообщите номер заказа <strong>#${orderNumber}</strong></p>
                <p class="manager-username">👤 @${CONFIG.MANAGER_USERNAME}</p>
            </div>
            <button class="manager-notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="manager-notification-action">
            <button class="contact-manager-btn" onclick="openManagerChat('${orderNumber}')">
                <i class="fab fa-telegram"></i> Написать менеджеру
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    const closeBtn = notification.querySelector('.manager-notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 30000);
}

function openManagerChat(orderNumber) {
    const message = `Здравствуйте! У меня оформлен заказ #${orderNumber}. Прошу подтвердить и уточнить детали.`;
    const managerUsername = CONFIG.MANAGER_USERNAME;
    
    const tgLink = `https://t.me/${managerUsername}?text=${encodeURIComponent(message)}`;
    
    if (tg && tg.openLink) {
        tg.openLink(tgLink);
    } else {
        window.open(tgLink, '_blank');
    }
    
    const notification = document.querySelector('.manager-notification');
    if (notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
        setTimeout(() => notification.remove(), 300);
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
// 8. АВТООБНОВЛЕНИЕ
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
    }, CONFIG.AUTO_UPDATE_INTERVAL);
    
    console.log('🔄 Автообновление запущено');
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
    detectTheme();
    initTelegram();
    
    await loadAndRenderProducts();
    loadCart();
    loadSalesStats(); // Загружаем статистику
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
    
    // Добавляем обработчики для кнопок навигации
    document.getElementById('categoriesScrollLeft').onclick = () => scrollCategories(-1);
    document.getElementById('categoriesScrollRight').onclick = () => scrollCategories(1);
    document.getElementById('subCategoriesScrollLeft').onclick = () => scrollSubCategories(-1);
    document.getElementById('subCategoriesScrollRight').onclick = () => scrollSubCategories(1);
    
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.clearCart = clearCart;
    window.toggleTheme = toggleTheme;
    window.switchCategory = switchCategory;
    window.switchSubCategory = switchSubCategory;
    window.openManagerChat = openManagerChat;
    window.scrollCategories = scrollCategories;
    window.scrollSubCategories = scrollSubCategories;
    window.toggleStatsDetails = toggleStatsDetails;
    
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
    
    console.log('✅ ICEBERG Shop с навигацией и статистикой инициализирован');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.addEventListener('beforeunload', stopAutoUpdate);
