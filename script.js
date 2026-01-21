let currentTheme = 'light';
let tg = null;
let products = [];
let cart = [];
let favorites = [];
let autoUpdateInterval = null;
let currentCategory = 'all';
let currentSubCategory = null;
let currentFavoritesTab = 'all';
let orderHistory = [];
let showSubcategorySelection = false;
let pendingCategoryId = null;
let userPhoneNumber = null;
let pendingOrderData = null;
let isAddingToCart = false;

// Новые переменные для доставки
let deliveryMethod = 'pickup'; // 'pickup' или 'delivery'
let deliveryAddress = '';
let deliveryTime = '';
let deliveryNotes = '';

// URL Python-сервера для сохранения заказов
const PYTHON_SERVER_URL = 'http://localhost:8000';

function detectTheme() {
    try {
        tg = window.Telegram.WebApp;
        
        if (tg) {
            const isDark = tg.colorScheme === 'dark';
            currentTheme = isDark ? 'dark' : 'light';
            
            document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
            document.body.classList.add(currentTheme + '-theme');
            
            localStorage.setItem('theme', currentTheme);
            
            tg.MainButton.setParams({
                color: isDark ? '#FF9800' : '#FF9800',
                text_color: isDark ? '#FFFFFF' : '#FFFFFF'
            });
            
            return;
        }
        
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            currentTheme = savedTheme;
        } else {
            currentTheme = prefersDark ? 'dark' : 'light';
        }
        
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(currentTheme + '-theme');
        
    } catch (error) {
        document.body.classList.add('auto-theme');
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(currentTheme + '-theme');
    
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
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
        }
    } catch (error) {
        console.error('Telegram WebApp initialization error:', error);
    }
}

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
        keywords: ['пластин', 'никотин', 'пастил', 'таблет', 'plate', 'nicotine'],
        subCategories: null
    },
    { 
        id: 'arqa', 
        name: '🎨 ARQA', 
        icon: 'fas fa-palette', 
        color: '#2196F3',
        keywords: ['arqa', 'арка'],
        subCategories: [
            { id: '70mg', name: '70mg', keywords: ['70mg', '70 мг', '70mg arqa'] },
            { id: 'standart', name: 'ARQA STANDART', keywords: ['standart', 'standard', 'арка стандарт'] },
            { id: 'slim', name: 'ARQA SLIM', keywords: ['slim', 'арка slim'] },
            { id: 'csgo', name: 'ARQA CS:GO', keywords: ['cs:go', 'cs go', 'csgo'] },
            { id: 'slovo', name: 'ARQA СЛОВО ПАЦАНА', keywords: ['слово пацана', 'слово'] }
        ]
    },
    { 
        id: 'shok', 
        name: '⚡ ШОК', 
        icon: 'fas fa-bolt', 
        color: '#FF5722',
        keywords: ['шок', 'shok', 'шок 150', 'шок 75', 'шок by x'],
        subCategories: [
            { id: 'shok150', name: 'ШОК (150 МГ)', keywords: ['шок 150', 'shok 150', '150 мг', 'ШОК 150', '(150 мг)', '150мг'] },
            { id: 'shok75', name: 'ШОК (75 МГ)', keywords: ['шок 75', 'shok 75', '75 мг', 'ШОК 75', '(75 мг)', '75мг'] },
            { id: 'shokbyx', name: 'ШОК BY X', keywords: ['by x', 'шок by x', 'byx'] }
        ]
    },
    { 
        id: 'storm', 
        name: '🌪️ STORM BY ШОК', 
        icon: 'fas fa-wind', 
        color: '#9C27B0',
        keywords: ['storm', 'шторм'],
        subCategories: null
    },
    { 
        id: 'st', 
        name: '🔬 ST (АНАЛОГ FERDS)', 
        icon: 'fas fa-flask', 
        color: '#009688',
        keywords: [' st ', ' st,', ' st.', 'стей'],
        subCategories: [
            { id: 'st45', name: 'ST MENTHOL (45 МГ)', keywords: ['45 мг', '45mg', 'st 45'] },
            { id: 'st55', name: 'ST LIME DELIGHT (55 МГ)', keywords: ['55 мг', '55mg', 'st 55', 'lime'] },
            { id: 'st65', name: 'ST LUXURY MINT (65 МГ)', keywords: ['65 мг', '65mg', 'st 65', 'luxury'] },
            { id: 'st75', name: 'ST FREEZE MINT (75 МГ)', keywords: ['75 мг', '75mg', 'st 75', 'freeze'] },
            { id: 'st120', name: 'ST ROYAL MINT (120 МГ)', keywords: ['120 мг', '120mg', 'st 120', 'royal'] }
        ]
    },
    { 
        id: 'kasta', 
        name: '👑 KASTA', 
        icon: 'fas fa-crown', 
        color: '#FFC107',
        keywords: ['kasta', 'каста'],
        subCategories: [
            { id: 'k101', name: 'KASTA CLASSIC (101 МГ)', keywords: ['101 мг', '101mg', 'kasta 101'] },
            { id: 'k105', name: 'KASTA CLASSIC (105 МГ)', keywords: ['105 мг', '105mg', 'kasta 105 classic'] },
            { id: 'k105le', name: 'KASTA LIMITED EDITION (105 МГ)', keywords: ['limited', 'limited edition'] },
            { id: 'k120c', name: 'KASTA COVID (120 МГ)', keywords: ['covid', 'ковид'] },
            { id: 'k120a', name: 'KASTA ANIME (120 МГ)', keywords: ['anime 120', 'аниме 120'] },
            { id: 'k125a', name: 'КАSTA ANIME (125 МГ)', keywords: ['anime 125', 'аниме 125'] },
            { id: 'k120d', name: 'KASTA DOTA (120 МГ)', keywords: ['dota', 'дота'] },
            { id: 'k125p', name: 'KASTA PHOBIA (125 МГ)', keywords: ['phobia', 'фобия'] }
        ]
    },
    { 
        id: 'ferds', 
        name: '⚗️ FERDS', 
        icon: 'fas fa-vial', 
        color: '#3F51B5',
        keywords: ['ferds', 'фердс', 'fedrs', 'feds'],
        subCategories: [
            { id: 'f30', name: 'FEDRS №5 (30 МГ)', keywords: ['30 мг', '30mg', '№5', 'no5'] },
            { id: 'f50', name: 'FEDRS №8 (50 МГ)', keywords: ['50 мг', '50mg', '№8', 'no8'] },
            { id: 'f65', name: 'FEDRS №9 (65 МГ)', keywords: ['65 мг', '65mg', '№9', 'no9'] }
        ]
    },
    { 
        id: 'iceberg', 
        name: '❄️ ICEBERG', 
        icon: 'fas fa-snowflake', 
        color: '#03A9F4',
        keywords: ['iceberg', 'айсберг'],
        subCategories: [
            { id: 'ice75s', name: 'ICEBERG STRONG (75 МГ)', keywords: ['strong', '75 мг strong', 'iceberg strong'] },
            { 
                id: 'icepie75', 
                name: 'ICEBERG PIE (75 МГ)', 
                keywords: [
                    'pie',
                    'пирог',
                    'apple pie',
                    'banoffee',
                    'blueberry pie',
                    'cheesecake',
                    'cherry pie',
                    'key lime pie',
                    'яблочный пирог',
                    'баноффи',
                    'черничный пирог',
                    'чизкейк',
                    'вишневый пирог',
                    'лаймовый пирог'
                ]
            },
            { id: 'ice100', name: 'ICEBERG EXTRA STRONG (100 МГ)', keywords: ['extra strong', '100 мг', 'ICEBERG EXTRA'] },
            { id: 'ice110', name: 'ICEBERG EXTREME (110 МГ)', keywords: ['extreme', '110 мг', 'ICEBERG EXTREME'] },
            { id: 'ice150', name: 'ICEBERG ULTRA (150 МГ)', keywords: ['ultra', '150 мг', 'ICEBERG ULTRA'] }
        ]
    },
    { 
        id: 'faff', 
        name: '🐉 FAFF', 
        icon: 'fas fa-dragon', 
        color: '#E91E63',
        keywords: ['faff', 'фафф'],
        subCategories: [
            { id: 'faff65', name: 'FAFF (65 МГ)', keywords: ['65 мг faff', 'faff 65', 'FAFF (65 МГ)', '(65 мг)', '65мг'] },
            { id: 'faff75', name: 'FAFF (75 МГ)', keywords: ['75 мг faff', 'faff 75', 'FAFF (75 МГ)', '(75 мг)', '75мг'] },
            { id: 'faff100', name: 'FAFF (100 МГ)', keywords: ['100 мг faff', 'faff 100', 'FAFF (100 МГ)', '(100 мг)', '100мг'] },
            { id: 'faff150', name: 'FAFF (150 МГ)', keywords: ['150 мг faff', 'faff 150', 'FAFF (150 МГ)', '(150 мг)', '150мг'] }
        ]
    },
    { 
        id: 'randm', 
        name: '🎲 RANDM BY FAFF', 
        icon: 'fas fa-dice', 
        color: '#673AB7',
        keywords: ['randm', 'рандм'],
        subCategories: null
    },
    { 
        id: 'shooter', 
        name: '🎯 SHOOTER BY FAFF', 
        icon: 'fas fa-bullseye', 
        color: '#FF9800',
        keywords: ['shooter', 'шутер'],
        subCategories: null
    },
    { 
        id: 'zuzu', 
        name: '✨ ZUZU BY FAFF', 
        icon: 'fas fa-star', 
        color: '#FFEB3B',
        keywords: ['zuzu', 'зузу'],
        subCategories: null
    },
    { 
        id: 'sweden', 
        name: '🇸🇪 ШВЕЦИЯ', 
        icon: 'fas fa-flag', 
        color: '#F44336',
        keywords: ['швеция', 'sweden', 'odens', 'lyft', 'zyn', 'chn'],
        subCategories: [
            { id: 'odens', name: 'ODENS', keywords: ['odens', 'оденс'] },
            { id: 'lyft', name: 'LYFT', keywords: ['lyft', 'лифт'] },
            { id: 'zyn', name: 'ZYN', keywords: ['zyn', 'зин'] },
            { id: 'chn', name: 'CHN', keywords: ['chn'] }
        ]
    },
    { 
        id: 'red', 
        name: '🔴 RED', 
        icon: 'fas fa-circle', 
        color: '#F44336',
        keywords: ['red', 'ред'],
        subCategories: [
            { id: 'red_o', name: 'RED ORIGINAL', keywords: ['original', 'оригинал'] },
            { id: 'red_i', name: 'RED ICE COOL', keywords: ['ice cool'] },
            { id: 'red_k', name: 'RED KILLER', keywords: ['killer', 'киллер'] }
        ]
    },
    { 
        id: 'mad', 
        name: '😜 MAD', 
        icon: 'fas fa-grin-tongue-wink', 
        color: '#9C27B0',
        keywords: ['mad'],
        subCategories: null
    },
    { 
        id: 'bitcoin', 
        name: '₿ BITCOIN', 
        icon: 'fab fa-bitcoin', 
        color: '#FF9800',
        keywords: ['bitcoin', 'биткоин'],
        subCategories: null
    },
    { 
        id: 'drymost', 
        name: '💧 DRYMOST', 
        icon: 'fas fa-tint', 
        color: '#2196F3',
        keywords: ['drymost', 'драймост'],
        subCategories: null
    },
    { 
        id: 'corvus', 
        name: '🐦 CORVUS', 
        icon: 'fas fa-crow', 
        color: '#607D8B',
        keywords: ['corvus', 'корвус'],
        subCategories: null
    }
];

function debugTrianglesProducts() {
    const trianglesProducts = products.filter(function(product) {
        const searchText = (product.name + ' ' + (product.description || '')).toLowerCase();
        return searchText.includes('triangle') || searchText.includes('треугольник');
    });
    
    console.log('Найденные товары с triangles:', trianglesProducts);
    return trianglesProducts;
}

window.debugTrianglesProducts = debugTrianglesProducts;

function createCategoriesNav() {
    const categoriesArea = document.getElementById('categoriesArea');
    if (!categoriesArea) return;
    
    if (showSubcategorySelection && pendingCategoryId) {
        const category = categories.find(function(c) { return c.id === pendingCategoryId; });
        
        if (category && category.subCategories && category.subCategories.length > 0) {
            categoriesArea.innerHTML = `
                <div class="subcategory-selection">
                    <div class="subcategory-header">
                        <button class="back-to-categories" onclick="backToCategories()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3>${category.name}</h3>
                        <span class="subcategory-subtitle">Выберите подраздел:</span>
                    </div>
                    <div class="subcategory-grid-wrapper">
                        <div class="drag-hint">
                            <i class="fas fa-hand-pointer"></i>
                            <span>Проведите пальцем влево/вправо</span>
                        </div>
                        <div class="subcategory-grid" id="subcategoryGrid">
                            <button class="subcategory-option ${currentSubCategory === null ? 'active' : ''}" 
                                    onclick="selectSubCategory('${category.id}', null)">
                                <i class="fas fa-layer-group"></i>
                                <span>Все ${category.name}</span>
                                <div class="sub-arrow">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            </button>
                            ${category.subCategories.map(function(subCat) {
                                return `
                                    <button class="subcategory-option ${currentSubCategory === subCat.id ? 'active' : ''}" 
                                            onclick="selectSubCategory('${category.id}', '${subCat.id}')">
                                        <i class="fas fa-tag"></i>
                                        <span>${subCat.name}</span>
                                        <div class="sub-arrow">
                                            <i class="fas fa-arrow-right"></i>
                                        </div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            updateSelectedPath();
            initSmoothDrag('subcategoryGrid');
            return;
        } else {
            pendingCategoryId = null;
            showSubcategorySelection = false;
        }
    }
    
    categoriesArea.innerHTML = `
        <div class="categories-nav-wrapper">
            <div class="categories-nav" id="categoriesNav">
                ${categories.map(function(category) {
                    const hasSubs = category.subCategories && category.subCategories.length > 0;
                    return `
                        <button class="category-btn ${currentCategory === category.id ? 'active' : ''} ${hasSubs ? 'has-subs' : ''}" 
                                onclick="selectCategory('${category.id}')"
                                style="--category-color: ${category.color}">
                            <i class="${category.icon}"></i>
                            <span>${category.name}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
        
        ${currentCategory !== 'all' && categories.find(function(c) { return c.id === currentCategory; }) && categories.find(function(c) { return c.id === currentCategory; }).subCategories && categories.find(function(c) { return c.id === currentCategory; }).subCategories.length > 0 ? `
            <div class="subcategory-navigation" id="subCategoriesNav">
                <div class="nav-drag-hint">
                    <i class="fas fa-arrows-alt-h"></i>
                    <span>Перетащите для прокрутки</span>
                </div>
                <div class="subcategory-nav-container">
                    <button class="subcategory-nav-btn ${currentSubCategory === null ? 'active' : ''}" 
                            onclick="switchSubCategory(null)">
                        <i class="fas fa-layer-group"></i>
                        <span>Все ${categories.find(function(c) { return c.id === currentCategory; }).name}</span>
                    </button>
                    ${categories.find(function(c) { return c.id === currentCategory; }).subCategories.map(function(subCat) {
                        return `
                            <button class="subcategory-nav-btn ${currentSubCategory === subCat.id ? 'active' : ''}" 
                                    onclick="switchSubCategory('${subCat.id}')">
                                <i class="fas fa-tag"></i>
                                <span>${subCat.name}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    updateSelectedPath();
    initCategoriesScroll();
    
    if (currentCategory !== 'all') {
        initSmoothDrag('subCategoriesNav');
    }
}

function initSmoothDrag(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumID = null;

    const damping = 0.92;
    const sensitivity = 1.8;
    const maxVelocity = 25;

    function startDrag(e) {
        if (e.target.closest('.subcategory-option, .subcategory-nav-btn')) return;

        isDragging = true;
        container.classList.add('grabbing');
        cancelAnimationFrame(momentumID);

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        startX = clientX - container.getBoundingClientRect().left;
        scrollLeft = container.scrollLeft;
        velocity = 0;
        lastX = clientX;
        lastTime = Date.now();
    }

    function moveDrag(e) {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const now = Date.now();
        const deltaTime = now - lastTime;

        if (deltaTime > 0) {
            const deltaX = clientX - lastX;
            velocity = Math.max(-maxVelocity, Math.min(maxVelocity, deltaX / deltaTime * sensitivity));
            lastX = clientX;
            lastTime = now;
        }

        const x = clientX - container.getBoundingClientRect().left;
        const walk = (x - startX) * sensitivity;
        container.scrollLeft = scrollLeft - walk;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('grabbing');
        momentum();
    }

    function momentum() {
        if (Math.abs(velocity) < 0.1) return;

        container.scrollLeft -= velocity * 12;
        velocity *= damping;

        if (container.scrollLeft <= 0 || container.scrollLeft >= container.scrollWidth - container.clientWidth) {
            velocity *= 0.5;
        }

        momentumID = requestAnimationFrame(momentum);
    }

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('mouseleave', endDrag);
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mousemove', moveDrag);

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) startDrag(e);
    }, { passive: true });

    container.addEventListener('touchend', endDrag);
    container.addEventListener('touchcancel', endDrag);
    container.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) moveDrag(e);
    }, { passive: false });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 0.4;
    });

    container.addEventListener('scroll', () => {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const atStart = container.scrollLeft <= 0;
        const atEnd = container.scrollLeft >= maxScroll - 1;

        container.classList.toggle('at-start', atStart);
        container.classList.toggle('at-end', atEnd);
    });
}

function updateSelectedPath() {
    const pathElement = document.getElementById('selectedPath');
    if (!pathElement) return;
    
    if (showSubcategorySelection && pendingCategoryId) {
        const category = categories.find(function(c) { return c.id === pendingCategoryId; });
        if (category) {
            pathElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div class="path-item">Категории</div>
                <div class="path-separator">›</div>
                <div class="path-item">${category.name}</div>
                <div class="path-separator">›</div>
                <div class="path-item" style="color: var(--primary-color); font-weight: 600;">Выбор подраздела</div>
            `;
            pathElement.style.display = 'flex';
        }
    } else if (currentCategory !== 'all') {
        const category = categories.find(function(c) { return c.id === currentCategory; });
        if (category) {
            let path = `
                <i class="fas fa-map-marker-alt"></i>
                <div class="path-item" style="color: var(--primary-color); font-weight: 600;">${category.name}</div>
            `;
            
            if (currentSubCategory) {
                const subCat = category.subCategories && category.subCategories.find(function(s) { return s.id === currentSubCategory; });
                if (subCat) {
                    path += `
                        <div class="path-separator">›</div>
                        <div class="path-item">${subCat.name}</div>
                    `;
                }
            }
            
            pathElement.innerHTML = path;
            pathElement.style.display = 'flex';
        }
    } else {
        pathElement.style.display = 'none';
    }
}

function selectCategory(categoryId) {
    const category = categories.find(function(c) { return c.id === categoryId; });
    
    if (!category) return;
    
    if (category.subCategories && category.subCategories.length > 0) {
        pendingCategoryId = categoryId;
        showSubcategorySelection = true;
        createCategoriesNav();
    } else {
        switchCategory(categoryId);
    }
}

function selectSubCategory(categoryId, subCategoryId) {
    pendingCategoryId = null;
    showSubcategorySelection = false;
    currentCategory = categoryId;
    currentSubCategory = subCategoryId;
    
    createCategoriesNav();
    renderProductsByCategory();
    
    setTimeout(function() {
        const catalog = document.getElementById('catalog');
        if (catalog) {
            catalog.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

function backToCategories() {
    pendingCategoryId = null;
    showSubcategorySelection = false;
    createCategoriesNav();
}

function switchCategory(categoryId) {
    pendingCategoryId = null;
    showSubcategorySelection = false;
    currentCategory = categoryId;
    currentSubCategory = null;
    createCategoriesNav();
    renderProductsByCategory();
    
    const catalog = document.getElementById('catalog');
    if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth' });
    }
}

function switchSubCategory(subCategoryId) {
    currentSubCategory = subCategoryId;
    createCategoriesNav();
    renderProductsByCategory();
}

function filterProductsByCategory(productsToFilter) {
    if (currentCategory === 'all') {
        return productsToFilter;
    }
    
    const category = categories.find(function(c) { return c.id === currentCategory; });
    if (!category) {
        return productsToFilter;
    }
    
    let filtered = productsToFilter;
    
    if (category.keywords && category.keywords.length > 0) {
        filtered = productsToFilter.filter(function(product) {
            const searchText = (product.name + ' ' + (product.description || '')).toLowerCase();
            
            return category.keywords.some(function(keyword) {
                return searchText.includes(keyword.toLowerCase());
            });
        });
    }
    
    if (currentSubCategory && category.subCategories) {
        const subCategory = category.subCategories.find(function(s) { return s.id === currentSubCategory; });
        if (subCategory && subCategory.keywords && subCategory.keywords.length > 0) {
            filtered = filtered.filter(function(product) {
                const searchText = (product.name + ' ' + (product.description || '')).toLowerCase();
                
                return subCategory.keywords.some(function(keyword) {
                    return searchText.includes(keyword.toLowerCase());
                });
            });
        }
    }
    
    return filtered;
}

async function loadProductsFromGitHub() {
    try {
        const timestamp = new Date().getTime();
        const response = await fetch('https://raw.githubusercontent.com/sashaG7658/lavkatest/main/products.json?t=' + timestamp);
        
        if (!response.ok) {
            console.log('GitHub недоступен, использую локальную базу товаров');
            return getLocalProducts();
        }
        
        const loadedProducts = await response.json();
        
        loadedProducts.forEach(function(product) {
            if (!product.hasOwnProperty('quantity')) {
                product.quantity = 10;
            }
            product.searchText = (product.name + ' ' + (product.description || '')).toLowerCase();
        });
        
        return loadedProducts;
    } catch (error) {
        console.error('Error loading products:', error);
        return getLocalProducts();
    }
}

function getLocalProducts() {
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
            id: 1001,
            name: "ШОК СДЕЛКА С КОКОСОМ И КЛУБНИКОЙ (150 МГ)",
            description: "ЖВАЧКА С КЛУБНИКОЙ И КОКОСОМ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/7732/889290292/large_%D0%BA%D0%BB%D1%83%D0%B1%D0%BD%D0%B8%D0%BA%D0%B0__5_.png",
            isNew: false
        },
        {
            id: 1051,
            name: "ШОК BY X МЯТА",
            description: "ШОК BY X - МЯТА",
            price: 480,
            quantity: 5,
            image: "https://via.placeholder.com/300x200/FF5722/FFFFFF?text=ШОК+BY+X",
            isNew: true
        }
    ];
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
    
    catalog.innerHTML = filteredProducts.map(function(product) {
        const qty = product.quantity || 0;
        const isAvailable = qty > 0;
        const isFav = isFavorite(product.id);
        
        const categoryInfo = categories.find(function(c) { return c.id === currentCategory; }) || categories[0];
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
                <button class="favorite-btn ${isFav ? 'active' : ''}" 
                        onclick="toggleFavorite(${product.id})"
                        data-id="${product.id}">
                    <i class="${isFav ? 'fas fa-heart active' : 'far fa-heart'}"></i>
                </button>
                
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
                                onclick="addToCart(${product.id}, this)"
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

// Функции для работы с доставкой
function loadDeliveryInfo() {
    try {
        const savedMethod = localStorage.getItem('iceberg_delivery_method');
        const savedAddress = localStorage.getItem('iceberg_delivery_address');
        const savedTime = localStorage.getItem('iceberg_delivery_time');
        const savedNotes = localStorage.getItem('iceberg_delivery_notes');
        
        deliveryMethod = savedMethod || 'pickup';
        deliveryAddress = savedAddress || '';
        deliveryTime = savedTime || '';
        deliveryNotes = savedNotes || '';
        
        return true;
    } catch (error) {
        console.error('Error loading delivery info:', error);
        deliveryMethod = 'pickup';
        deliveryAddress = '';
        deliveryTime = '';
        deliveryNotes = '';
        return false;
    }
}

function saveDeliveryInfo() {
    try {
        localStorage.setItem('iceberg_delivery_method', deliveryMethod);
        localStorage.setItem('iceberg_delivery_address', deliveryAddress);
        localStorage.setItem('iceberg_delivery_time', deliveryTime);
        localStorage.setItem('iceberg_delivery_notes', deliveryNotes);
        return true;
    } catch (error) {
        console.error('Error saving delivery info:', error);
        return false;
    }
}

function changeDeliveryMethod(method) {
    deliveryMethod = method;
    saveDeliveryInfo();
    
    // Обновляем UI переключателя
    document.querySelectorAll('.delivery-method-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-method') === method) {
            btn.classList.add('active');
        }
    });
    
    // Показываем/скрываем поля для доставки
    const deliveryFields = document.getElementById('deliveryFields');
    if (deliveryFields) {
        deliveryFields.style.display = method === 'delivery' ? 'block' : 'none';
    }
    
    return method;
}

function updateDeliveryFields() {
    const addressInput = document.getElementById('deliveryAddress');
    const timeInput = document.getElementById('deliveryTime');
    const notesInput = document.getElementById('deliveryNotes');
    
    if (addressInput) addressInput.value = deliveryAddress;
    if (timeInput) timeInput.value = deliveryTime;
    if (notesInput) notesInput.value = deliveryNotes;
}

function validateDeliveryInfo() {
    if (deliveryMethod === 'pickup') {
        return { isValid: true, error: '' };
    }
    
    if (deliveryMethod === 'delivery') {
        if (!deliveryAddress.trim()) {
            return { isValid: false, error: 'Укажите адрес доставки' };
        }
        if (!deliveryTime.trim()) {
            return { isValid: false, error: 'Укажите время доставки' };
        }
        return { isValid: true, error: '' };
    }
    
    return { isValid: true, error: '' };
}

function updateDeliveryUIInCart() {
    const deliveryMethodDisplay = document.getElementById('deliveryMethodDisplay');
    const changeDeliveryBtn = document.getElementById('changeDeliveryButton');
    const deliverySection = document.querySelector('.delivery-section');
    
    // ВСЕГДА показываем секцию доставки, если есть товары в корзине
    if (deliverySection) {
        deliverySection.style.display = cart.length > 0 ? 'block' : 'none';
    }
    
    if (deliveryMethodDisplay) {
        if (deliveryMethod === 'pickup') {
            deliveryMethodDisplay.innerHTML = `
                <i class="fas fa-store"></i>
                <div class="delivery-text-content">
                    <span class="delivery-method-name">Самовывоз</span>
                    <small class="delivery-method-description">Забрать самостоятельно</small>
                </div>
            `;
        } else {
            const shortAddress = deliveryAddress ? 
                (deliveryAddress.length > 30 ? deliveryAddress.substring(0, 30) + '...' : deliveryAddress) : 
                'Адрес не указан';
            deliveryMethodDisplay.innerHTML = `
                <i class="fas fa-motorcycle"></i>
                <div class="delivery-text-content">
                    <span class="delivery-method-name">Доставка</span>
                    <small class="delivery-method-description">${shortAddress}</small>
                </div>
            `;
        }
    }
    
    if (changeDeliveryBtn) {
        changeDeliveryBtn.innerHTML = `
            <i class="fas fa-edit"></i>
            <span class="change-delivery-text">Изменить способ</span>
        `;
    }
}

function showDeliveryMethodModal() {
    const modal = document.createElement('div');
    modal.className = 'delivery-method-modal';
    modal.innerHTML = `
        <div class="delivery-method-content">
            <div class="delivery-method-header">
                <i class="fas fa-truck"></i>
                <h2 class="delivery-modal-title">Способ получения</h2>
            </div>
            <div class="delivery-method-body">
                <div class="delivery-method-selection">
                    <button class="delivery-method-btn ${deliveryMethod === 'pickup' ? 'active' : ''}" 
                            data-method="pickup"
                            onclick="changeDeliveryMethod('pickup')">
                        <i class="fas fa-store"></i>
                        <div class="method-text-content">
                            <span class="method-name">Самовывоз</span>
                            <p class="method-description">Забрать заказ самостоятельно</p>
                        </div>
                    </button>
                    <button class="delivery-method-btn ${deliveryMethod === 'delivery' ? 'active' : ''}" 
                            data-method="delivery"
                            onclick="changeDeliveryMethod('delivery')">
                        <i class="fas fa-motorcycle"></i>
                        <div class="method-text-content">
                            <span class="method-name">Доставка</span>
                            <p class="method-description">Курьерская доставка</p>
                        </div>
                    </button>
                </div>
                
                <div id="deliveryFields" class="delivery-fields" style="display: ${deliveryMethod === 'delivery' ? 'block' : 'none'};">
                    <div class="delivery-field-group">
                        <label for="deliveryAddress" class="delivery-label">
                            <i class="fas fa-map-marker-alt"></i>
                            <span class="label-text">Адрес доставки:</span>
                        </label>
                        <textarea id="deliveryAddress" 
                                  class="delivery-textarea delivery-input" 
                                  placeholder="Укажите полный адрес доставки (улица, дом, квартира, подъезд, этаж)"
                                  rows="3">${deliveryAddress}</textarea>
                    </div>
                    
                    <div class="delivery-field-group">
                        <label for="deliveryTime" class="delivery-label">
                            <i class="fas fa-clock"></i>
                            <span class="label-text">Удобное время доставки:</span>
                        </label>
                        <input type="text" 
                               id="deliveryTime" 
                               class="delivery-input delivery-input-text" 
                               placeholder="Например: 18:00-20:00 или 'после 19:00'"
                               value="${deliveryTime}">
                    </div>
                    
                    <div class="delivery-field-group">
                        <label for="deliveryNotes" class="delivery-label">
                            <i class="fas fa-sticky-note"></i>
                            <span class="label-text">Дополнительные пожелания:</span>
                        </label>
                        <textarea id="deliveryNotes" 
                                  class="delivery-textarea delivery-input" 
                                  placeholder="Комментарий для курьера, особенности доставки и т.д."
                                  rows="2">${deliveryNotes}</textarea>
                    </div>
                </div>
                
                <div id="deliveryError" class="delivery-validation-error" style="display: none;">
                    <i class="fas fa-exclamation-circle"></i>
                    <span id="deliveryErrorMessage" class="error-text"></span>
                </div>
            </div>
            <div class="delivery-method-footer">
                <button id="confirmDeliveryBtn" class="confirm-delivery-btn">
                    <i class="fas fa-check"></i> <span class="btn-text">Подтвердить</span>
                </button>
                <button id="cancelDeliveryBtn" class="cancel-delivery-btn">
                    <i class="fas fa-times"></i> <span class="btn-text">Отмена</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обновляем поля ввода для темной темы
    updateDeliveryFieldsForTheme();
    
    const deliveryAddressInput = document.getElementById('deliveryAddress');
    const deliveryTimeInput = document.getElementById('deliveryTime');
    const deliveryNotesInput = document.getElementById('deliveryNotes');
    const deliveryError = document.getElementById('deliveryError');
    
    if (deliveryAddressInput) {
        deliveryAddressInput.addEventListener('input', function(e) {
            deliveryAddress = e.target.value;
        });
    }
    
    if (deliveryTimeInput) {
        deliveryTimeInput.addEventListener('input', function(e) {
            deliveryTime = e.target.value;
        });
    }
    
    if (deliveryNotesInput) {
        deliveryNotesInput.addEventListener('input', function(e) {
            deliveryNotes = e.target.value;
        });
    }
    
    document.getElementById('confirmDeliveryBtn').addEventListener('click', function() {
        const validation = validateDeliveryInfo();
        
        if (!validation.isValid) {
            deliveryError.style.display = 'flex';
            document.getElementById('deliveryErrorMessage').textContent = validation.error;
            deliveryError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        saveDeliveryInfo();
        updateDeliveryUIInCart();
        
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }, 300);
        }
    });
}

// Функция для показа модалки доставки поверх модалки телефона
function showDeliveryMethodModalOverPhone() {
    const phoneModal = document.querySelector('.phone-confirmation-modal');
    
    // Создаем модалку доставки с более высоким z-index
    const deliveryModal = document.createElement('div');
    deliveryModal.className = 'delivery-method-modal delivery-over-phone';
    deliveryModal.style.zIndex = '10002';
    deliveryModal.innerHTML = `
        <div class="delivery-method-content" style="z-index: 10003;">
            <div class="delivery-method-header">
                <i class="fas fa-truck"></i>
                <h2 class="delivery-modal-title">Способ получения</h2>
            </div>
            <div class="delivery-method-body">
                <div class="delivery-method-selection">
                    <button class="delivery-method-btn ${deliveryMethod === 'pickup' ? 'active' : ''}" 
                            data-method="pickup"
                            onclick="changeDeliveryMethodAndUpdatePhoneModal('pickup')">
                        <i class="fas fa-store"></i>
                        <div class="method-text-content">
                            <span class="method-name">Самовывоз</span>
                            <p class="method-description">Забрать заказ самостоятельно</p>
                        </div>
                    </button>
                    <button class="delivery-method-btn ${deliveryMethod === 'delivery' ? 'active' : ''}" 
                            data-method="delivery"
                            onclick="changeDeliveryMethodAndUpdatePhoneModal('delivery')">
                        <i class="fas fa-motorcycle"></i>
                        <div class="method-text-content">
                            <span class="method-name">Доставка</span>
                            <p class="method-description">Курьерская доставка</p>
                        </div>
                    </button>
                </div>
                
                <div id="deliveryFields" class="delivery-fields" style="display: ${deliveryMethod === 'delivery' ? 'block' : 'none'};">
                    <div class="delivery-field-group">
                        <label for="deliveryAddressOverPhone" class="delivery-label">
                            <i class="fas fa-map-marker-alt"></i>
                            <span class="label-text">Адрес доставки:</span>
                        </label>
                        <textarea id="deliveryAddressOverPhone" 
                                  class="delivery-textarea delivery-input" 
                                  placeholder="Укажите полный адрес доставки (улица, дом, квартира, подъезд, этаж)"
                                  rows="3">${deliveryAddress}</textarea>
                    </div>
                    
                    <div class="delivery-field-group">
                        <label for="deliveryTimeOverPhone" class="delivery-label">
                            <i class="fas fa-clock"></i>
                            <span class="label-text">Удобное время доставки:</span>
                        </label>
                        <input type="text" 
                               id="deliveryTimeOverPhone" 
                               class="delivery-input delivery-input-text" 
                               placeholder="Например: 18:00-20:00 или 'после 19:00'"
                               value="${deliveryTime}">
                    </div>
                    
                    <div class="delivery-field-group">
                        <label for="deliveryNotesOverPhone" class="delivery-label">
                            <i class="fas fa-sticky-note"></i>
                            <span class="label-text">Дополнительные пожелания:</span>
                        </label>
                        <textarea id="deliveryNotesOverPhone" 
                                  class="delivery-textarea delivery-input" 
                                  placeholder="Комментарий для курьера, особенности доставки и т.д."
                                  rows="2">${deliveryNotes}</textarea>
                    </div>
                </div>
                
                <div id="deliveryErrorOverPhone" class="delivery-validation-error" style="display: none;">
                    <i class="fas fa-exclamation-circle"></i>
                    <span id="deliveryErrorMessageOverPhone" class="error-text"></span>
                </div>
            </div>
            <div class="delivery-method-footer">
                <button id="confirmDeliveryBtnOverPhone" class="confirm-delivery-btn">
                    <i class="fas fa-check"></i> <span class="btn-text">Подтвердить</span>
                </button>
                <button id="cancelDeliveryBtnOverPhone" class="cancel-delivery-btn">
                    <i class="fas fa-times"></i> <span class="btn-text">Назад</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(deliveryModal);
    
    // Обновляем поля ввода для темной темы
    updateDeliveryFieldsForTheme();
    
    const deliveryAddressInput = document.getElementById('deliveryAddressOverPhone');
    const deliveryTimeInput = document.getElementById('deliveryTimeOverPhone');
    const deliveryNotesInput = document.getElementById('deliveryNotesOverPhone');
    const deliveryError = document.getElementById('deliveryErrorOverPhone');
    
    if (deliveryAddressInput) {
        deliveryAddressInput.addEventListener('input', function(e) {
            deliveryAddress = e.target.value;
            updateDeliverySummaryInPhoneModal();
        });
    }
    
    if (deliveryTimeInput) {
        deliveryTimeInput.addEventListener('input', function(e) {
            deliveryTime = e.target.value;
            updateDeliverySummaryInPhoneModal();
        });
    }
    
    if (deliveryNotesInput) {
        deliveryNotesInput.addEventListener('input', function(e) {
            deliveryNotes = e.target.value;
            updateDeliverySummaryInPhoneModal();
        });
    }
    
    document.getElementById('confirmDeliveryBtnOverPhone').addEventListener('click', function() {
        const validation = validateDeliveryInfo();
        
        if (!validation.isValid) {
            deliveryError.style.display = 'flex';
            document.getElementById('deliveryErrorMessageOverPhone').textContent = validation.error;
            deliveryError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        saveDeliveryInfo();
        updateDeliverySummaryInPhoneModal();
        
        deliveryModal.style.opacity = '0';
        setTimeout(() => deliveryModal.remove(), 300);
    });
    
    document.getElementById('cancelDeliveryBtnOverPhone').addEventListener('click', function() {
        deliveryModal.style.opacity = '0';
        setTimeout(() => deliveryModal.remove(), 300);
    });
    
    deliveryModal.addEventListener('click', function(e) {
        if (e.target === deliveryModal) {
            deliveryModal.style.opacity = '0';
            setTimeout(() => deliveryModal.remove(), 300);
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            deliveryModal.style.opacity = '0';
            setTimeout(() => {
                deliveryModal.remove();
                document.removeEventListener('keydown', escapeHandler);
            }, 300);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Функция для обновления способа доставки и обновления информации в модалке телефона
function changeDeliveryMethodAndUpdatePhoneModal(method) {
    deliveryMethod = method;
    saveDeliveryInfo();
    
    // Обновляем UI переключателя в модалке доставки
    document.querySelectorAll('.delivery-method-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-method') === method) {
            btn.classList.add('active');
        }
    });
    
    // Показываем/скрываем поля для доставки
    const deliveryFields = document.getElementById('deliveryFields');
    if (deliveryFields) {
        deliveryFields.style.display = method === 'delivery' ? 'block' : 'none';
    }
    
    // Обновляем информацию в модалке телефона
    updateDeliverySummaryInPhoneModal();
}

// Функция для обновления сводки доставки в модалке телефона
function updateDeliverySummaryInPhoneModal() {
    const phoneModal = document.querySelector('.phone-confirmation-modal');
    if (!phoneModal) return;
    
    const deliverySummary = phoneModal.querySelector('.delivery-summary');
    if (deliverySummary) {
        deliverySummary.innerHTML = `
            ${deliveryMethod === 'pickup' ? `
                <div class="delivery-summary-item pickup">
                    <i class="fas fa-store"></i>
                    <div>
                        <strong class="summary-title">Самовывоз</strong>
                        <p class="summary-description">Забрать заказ самостоятельно</p>
                    </div>
                </div>
            ` : `
                <div class="delivery-summary-item delivery">
                    <i class="fas fa-motorcycle"></i>
                    <div>
                        <strong class="summary-title">Доставка</strong>
                        <p class="summary-detail"><strong class="detail-label">Адрес:</strong> <span class="detail-value">${deliveryAddress || 'Не указан'}</span></p>
                        <p class="summary-detail"><strong class="detail-label">Время:</strong> <span class="detail-value">${deliveryTime || 'Не указано'}</span></p>
                        ${deliveryNotes ? `<p class="summary-detail"><strong class="detail-label">Комментарий:</strong> <span class="detail-value">${deliveryNotes}</span></p>` : ''}
                    </div>
                </div>
            `}
            <button class="change-delivery-method-btn" onclick="showDeliveryMethodModalOverPhone()">
                <i class="fas fa-edit"></i> <span class="change-btn-text">Изменить способ</span>
            </button>
        `;
    }
}

// Функция для обновления полей ввода под тему
function updateDeliveryFieldsForTheme() {
    const inputs = document.querySelectorAll('.delivery-input');
    const labels = document.querySelectorAll('.delivery-label');
    
    if (currentTheme === 'dark') {
        inputs.forEach(input => {
            input.style.backgroundColor = '#2d2d2d';
            input.style.color = '#ffffff';
            input.style.borderColor = '#444';
        });
        labels.forEach(label => {
            label.style.color = '#ffffff';
        });
    } else {
        inputs.forEach(input => {
            input.style.backgroundColor = '';
            input.style.color = '';
            input.style.borderColor = '';
        });
        labels.forEach(label => {
            label.style.color = '';
        });
    }
}

function loadPhoneNumber() {
    try {
        const savedPhone = localStorage.getItem('iceberg_phone');
        userPhoneNumber = savedPhone || null;
    } catch (error) {
        console.error('Error loading phone number:', error);
        userPhoneNumber = null;
    }
}

function savePhoneNumber(phone) {
    try {
        userPhoneNumber = phone;
        localStorage.setItem('iceberg_phone', phone);
        return true;
    } catch (error) {
        console.error('Error saving phone number:', error);
        return false;
    }
}

function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+7') && cleaned.length === 12) {
        return cleaned;
    }
    
    if (cleaned.startsWith('8') && cleaned.length === 11) {
        return '+7' + cleaned.slice(1);
    }
    
    if (cleaned.startsWith('7') && cleaned.length === 11) {
        return '+' + cleaned;
    }
    
    if (cleaned.length >= 10 && cleaned.length <= 15) {
        return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    }
    
    return null;
}

function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+7')) {
        return '+7 (' + cleaned.slice(2, 5) + ') ' + cleaned.slice(5, 8) + '-' + cleaned.slice(8, 10) + '-' + cleaned.slice(10, 12);
    }
    
    return phone;
}

function showPhoneConfirmationModal(orderData) {
    pendingOrderData = orderData;
    
    const modal = document.createElement('div');
    modal.className = 'phone-confirmation-modal';
    modal.innerHTML = `
        <div class="phone-confirmation-content">
            <div class="phone-confirmation-header">
                <i class="fas fa-phone-alt"></i>
                <h2 class="phone-modal-title">Подтвердите номер телефона</h2>
            </div>
            <div class="phone-confirmation-body">
                <div class="delivery-method-section">
                    <h3 class="delivery-section-title"><i class="fas fa-truck"></i> Способ получения:</h3>
                    <div class="delivery-summary">
                        ${deliveryMethod === 'pickup' ? `
                            <div class="delivery-summary-item pickup">
                                <i class="fas fa-store"></i>
                                <div>
                                    <strong class="summary-title">Самовывоз</strong>
                                    <p class="summary-description">Забрать заказ самостоятельно</p>
                                </div>
                            </div>
                        ` : `
                            <div class="delivery-summary-item delivery">
                                <i class="fas fa-motorcycle"></i>
                                <div>
                                    <strong class="summary-title">Доставка</strong>
                                    <p class="summary-detail"><strong class="detail-label">Адрес:</strong> <span class="detail-value">${deliveryAddress || 'Не указан'}</span></p>
                                    <p class="summary-detail"><strong class="detail-label">Время:</strong> <span class="detail-value">${deliveryTime || 'Не указано'}</span></p>
                                    ${deliveryNotes ? `<p class="summary-detail"><strong class="detail-label">Комментарий:</strong> <span class="detail-value">${deliveryNotes}</span></p>` : ''}
                                </div>
                            </div>
                        `}
                        <button class="change-delivery-method-btn" onclick="showDeliveryMethodModalOverPhone()">
                            <i class="fas fa-edit"></i> <span class="change-btn-text">Изменить способ</span>
                        </button>
                    </div>
                </div>
                
                <div class="phone-input-group">
                    <label for="phoneInput" class="phone-label">Номер телефона для связи:</label>
                    <div class="phone-input-wrapper">
                        <div class="country-code">+7</div>
                        <input type="tel" 
                               id="phoneInput" 
                               class="phone-input" 
                               placeholder="999 123-45-67"
                               value="${userPhoneNumber ? userPhoneNumber.replace('+7', '') : ''}"
                               maxlength="15"
                               inputmode="tel">
                    </div>
                    <div class="phone-example">
                        <i class="fas fa-info-circle"></i>
                        <span class="example-text">Пример: 912 345-67-89</span>
                    </div>
                    <div id="phoneError" class="phone-validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <span class="error-text">Введите корректный номер телефона</span>
                    </div>
                </div>
                
                <div class="phone-info">
                    <p class="phone-info-text">
                        <i class="fas fa-shield-alt"></i>
                        <span>Номер нужен для связи менеджера по поводу заказа. 
                        Мы не передаём его третьим лицам и не используем для спама.</span>
                    </p>
                </div>
            </div>
            <div class="phone-confirmation-footer">
                <button id="confirmPhoneBtn" class="confirm-phone-btn">
                    <i class="fas fa-check"></i> <span class="btn-text">Подтвердить и отправить заказ</span>
                </button>
                <button id="cancelPhoneBtn" class="cancel-phone-btn">
                    <i class="fas fa-times"></i> <span class="btn-text">Отмена</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const phoneInput = document.getElementById('phoneInput');
    const phoneError = document.getElementById('phoneError');
    const phoneInputGroup = document.querySelector('.phone-input-group');
    
    setTimeout(() => phoneInput.focus(), 300);
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = value.slice(0, 3) + ' ' + value.slice(3);
            } else if (value.length <= 8) {
                value = value.slice(0, 3) + ' ' + value.slice(3, 6) + '-' + value.slice(6);
            } else {
                value = value.slice(0, 3) + ' ' + value.slice(3, 6) + '-' + value.slice(6, 8) + '-' + value.slice(8, 10);
            }
        }
        
        e.target.value = value;
        phoneError.style.display = 'none';
        phoneInputGroup.classList.remove('error');
    });
    
    document.getElementById('confirmPhoneBtn').addEventListener('click', function() {
        const rawPhone = phoneInput.value.replace(/\D/g, '');
        const fullPhone = '+7' + rawPhone;
        const validatedPhone = validatePhoneNumber(fullPhone);
        
        if (!validatedPhone || rawPhone.length < 10) {
            phoneError.style.display = 'flex';
            phoneInputGroup.classList.add('error');
            phoneInput.focus();
            return;
        }
        
        // Проверяем данные доставки
        const deliveryValidation = validateDeliveryInfo();
        if (!deliveryValidation.isValid) {
            showNotification(deliveryValidation.error, 'error');
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                showDeliveryMethodModal();
            }, 300);
            return;
        }
        
        savePhoneNumber(validatedPhone);
        
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        
        pendingOrderData.userPhone = validatedPhone;
        pendingOrderData.deliveryMethod = deliveryMethod;
        pendingOrderData.deliveryAddress = deliveryMethod === 'delivery' ? deliveryAddress : null;
        pendingOrderData.deliveryTime = deliveryMethod === 'delivery' ? deliveryTime : null;
        pendingOrderData.deliveryNotes = deliveryMethod === 'delivery' ? deliveryNotes : null;
        
        completeOrderWithPhone(pendingOrderData);
        pendingOrderData = null;
    });
    
    document.getElementById('cancelPhoneBtn').addEventListener('click', function() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            pendingOrderData = null;
        }, 300);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                pendingOrderData = null;
            }, 300);
        }
    });
    
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                pendingOrderData = null;
                document.removeEventListener('keydown', closeOnEscape);
            }, 300);
        }
    });
}

async function completeOrderWithPhone(orderData) {
    try {
        orderData.user = orderData.user || {};
        if (userPhoneNumber) {
            orderData.user.phone = userPhoneNumber;
        }
        
        // Отправляем заказ на Python-сервер
        const savedToServer = await fetch(PYTHON_SERVER_URL + '/save-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(res => res.json())
        .then(data => data.ok)
        .catch(err => {
            console.error('Ошибка отправки на Python:', err);
            return false;
        });
        
        if (!savedToServer) {
            showNotification('Ошибка сохранения заказа на сервере. Попробуйте снова.', 'error');
            return;
        }
        
        // Отправляем заказ в Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            const orderDataForBot = {
                orderNumber: orderData.orderNumber,
                products: orderData.products,
                total: orderData.total,
                items_count: orderData.items_count,
                timestamp: orderData.timestamp,
                deliveryMethod: orderData.deliveryMethod,
                deliveryAddress: orderData.deliveryAddress,
                deliveryTime: orderData.deliveryTime,
                deliveryNotes: orderData.deliveryNotes,
                userPhone: orderData.userPhone || userPhoneNumber,
                savedToServer: savedToServer
            };

            console.log("Отправка в Telegram:", orderDataForBot);
            window.Telegram.WebApp.sendData(JSON.stringify(orderDataForBot));
        } else {
            console.warn("Telegram WebApp не доступен");
        }
        
        const notified = await notifyManager(orderData);
        
        if (tg && tg.showAlert) {
            tg.showAlert(
                `✅ *Заказ оформлен успешно!*\n\n` +
                `📋 *Номер заказа:* #${orderData.orderNumber}\n` +
                `📞 *Ваш телефон:* ${formatPhoneNumber(userPhoneNumber)}\n` +
                `${orderData.deliveryMethod === 'pickup' ? '🚶 *Способ:* Самовывоз' : '🏍️ *Способ:* Доставка'}\n` +
                `${orderData.deliveryMethod === 'delivery' && orderData.deliveryAddress ? `📍 *Адрес:* ${orderData.deliveryAddress}\n` : ''}` +
                `${orderData.deliveryMethod === 'delivery' && orderData.deliveryTime ? `⏰ *Время:* ${orderData.deliveryTime}\n` : ''}` +
                `📦 Товаров: ${orderData.items_count} шт.\n` +
                `💰 Сумма: ${orderData.total} руб.\n\n` +
                `✅ *Заказ сохранен на сервере*\n` +
                `👤 *Менеджер свяжется с вами в ближайшее время*\n` +
                `🔗 @Chief_68`,
                function() {
                    cart = [];
                    saveCart(); // Очищаем корзину
                    closeCart();
                    
                    showManagerNotification(orderData.orderNumber);
                    
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
            showOrderConfirmationModal(orderData, orderData.orderNumber, savedToServer);
            
            cart = [];
            saveCart(); // Очищаем корзину
            closeCart();
        }
        
        setTimeout(() => {
            loadAndRenderProducts();
        }, 3000);
        
    } catch (error) {
        console.error('Error completing order with phone:', error);
        showNotification('Ошибка при оформлении заказа. Попробуйте снова.', 'error');
    }
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        
        // НЕ загружаем orderHistory из localStorage - заказы теперь только на сервере
        orderHistory = [];
        
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
        orderHistory = [];
    }
}

function saveCart() {
    try {
        // Сохраняем только корзину локально
        localStorage.setItem('iceberg_cart', JSON.stringify(cart));
        updateCartUI();
        updateTelegramButton();
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

function addToCart(productId, buttonElement) {
    if (isAddingToCart) return;
    
    isAddingToCart = true;
    
    const product = products.find(function(p) { return p.id === productId; });
    if (!product) {
        isAddingToCart = false;
        return;
    }
    
    if (product.quantity <= 0) {
        isAddingToCart = false;
        return;
    }
    
    const existingItem = cart.find(function(item) { return item.id === productId; });
    
    if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
            isAddingToCart = false;
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    
    if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-check"></i> Добавлено';
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.7';
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';
            isAddingToCart = false;
        }, 1000);
    } else {
        setTimeout(() => {
            isAddingToCart = false;
        }, 500);
    }
}

function removeFromCart(productId) {
    const itemIndex = cart.findIndex(function(item) { return item.id === productId; });
    if (itemIndex === -1) return;
    
    cart.splice(itemIndex, 1);
    
    saveCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(function(item) { return item.id === productId; });
    if (!item) return;
    
    const product = products.find(function(p) { return p.id === productId; });
    if (!product) return;

    const newQuantity = item.quantity + change;
    
    if (newQuantity > product.quantity) return;
    
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
            }
        });
    } else if (confirm("Очистить всю корзину?")) {
        cart = [];
        saveCart();
    }
}

function getCartTotal() {
    return cart.reduce(function(sum, item) {
        return sum + (item.price * item.quantity);
    }, 0);
}

function getCartCount() {
    return cart.reduce(function(sum, item) {
        return sum + item.quantity;
    }, 0);
}

function updateTelegramButton() {
    if (!tg) return;
    
    const count = getCartCount();
    if (count > 0) {
        tg.MainButton.setText('Корзина (' + count + ')');
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
        
        // Скрываем секцию доставки если корзина пуста
        const deliverySection = document.querySelector('.delivery-section');
        if (deliverySection) {
            deliverySection.style.display = 'none';
        }
    } else {
        cartItems.innerHTML = cart.map(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
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
        
        checkoutBtn.disabled = !cart.some(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            return product && product.quantity > 0;
        });
        
        const total = getCartTotal();
        checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Оформить заказ (' + total + ' ₽)';
        
        // Обновляем UI доставки
        updateDeliveryUIInCart();
    }

    totalPrice.textContent = getCartTotal();
}

function loadFavorites() {
    try {
        const savedFavorites = localStorage.getItem('iceberg_favorites');
        favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
        console.error('Error loading favorites:', error);
        favorites = [];
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('iceberg_favorites', JSON.stringify(favorites));
        updateFavoritesUI();
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
}

function toggleFavorite(productId) {
    const product = products.find(function(p) { return p.id === productId; });
    if (!product) return;
    
    const existingIndex = favorites.findIndex(function(item) { return item.id === productId; });
    
    if (existingIndex !== -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            quantity: product.quantity,
            isNew: product.isNew || false,
            addedDate: new Date().toISOString()
        });
        
        const heartBtn = document.querySelector('.favorite-btn[data-id="' + productId + '"] i');
        if (heartBtn) {
            heartBtn.classList.add('favorite-added');
            setTimeout(function() {
                heartBtn.classList.remove('favorite-added');
            }, 500);
        }
    }
    
    saveFavorites();
    
    const productCard = document.querySelector('.favorite-btn[data-id="' + productId + '"]');
    if (productCard) {
        const heartIcon = productCard.querySelector('i');
        if (existingIndex !== -1) {
            heartIcon.className = 'far fa-heart';
        } else {
            heartIcon.className = 'fas fa-heart active';
        }
    }
}

function removeFromFavorites(productId) {
    const itemIndex = favorites.findIndex(function(item) { return item.id === productId; });
    if (itemIndex === -1) return;
    
    favorites.splice(itemIndex, 1);
    
    saveFavorites();
}

function isFavorite(productId) {
    return favorites.some(function(item) { return item.id === productId; });
}

function getFavoritesCount() {
    return favorites.length;
}

function updateFavoritesUI() {
    const favoritesCounter = document.getElementById('favoritesCounter');
    if (favoritesCounter) {
        const count = getFavoritesCount();
        favoritesCounter.textContent = count;
        favoritesCounter.style.display = count > 0 ? 'inline-block' : 'none';
    }
    
    renderFavoritesItems();
}

function renderFavoritesItems() {
    const favoritesItems = document.getElementById('favoritesItems');
    const addAllToCartBtn = document.getElementById('addAllToCartBtn');
    
    if (!favoritesItems || !addAllToCartBtn) return;
    
    let filteredFavorites = [...favorites];
    
    switch(currentFavoritesTab) {
        case 'available':
            filteredFavorites = favorites.filter(function(item) {
                const product = products.find(function(p) { return p.id === item.id; });
                return product && product.quantity > 0;
            });
            break;
        case 'new':
            filteredFavorites = favorites.filter(function(item) { return item.isNew; });
            break;
        case 'all':
        default:
            filteredFavorites = favorites;
    }
    
    if (filteredFavorites.length === 0) {
        let emptyMessage = '';
        switch(currentFavoritesTab) {
            case 'available':
                emptyMessage = 'Нет товаров в наличии';
                break;
            case 'new':
                emptyMessage = 'Нет новинок';
                break;
            default:
                emptyMessage = 'Избранное пусто';
        }
        
        favoritesItems.innerHTML = `
            <div class="favorites-empty-msg">
                <i class="fas fa-heart fa-2x"></i>
                <p>${emptyMessage}</p>
                <p class="small">Добавляйте товары, нажимая на сердечко</p>
            </div>
        `;
        addAllToCartBtn.disabled = true;
    } else {
        favoritesItems.innerHTML = filteredFavorites.map(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            const isAvailable = product && product.quantity > 0;
            const maxAvailable = product ? product.quantity : 0;
            
            return `
                <div class="favorite-item">
                    <button class="favorite-item-remove" onclick="removeFromFavorites(${item.id})">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${item.image}" 
                         alt="${item.name}" 
                         class="favorite-item-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/100x100/FF9800/FFFFFF?text=ICEBERG'">
                    <div class="favorite-item-details">
                        <div class="favorite-item-title">${item.name}</div>
                        <div class="favorite-item-price">${item.price} руб./шт.</div>
                        ${!isAvailable ? '<div class="cart-item-warning" style="color: #F44336; font-size: 0.8rem; margin-bottom: 5px;">⚠️ Товар закончился</div>' : ''}
                        <div class="favorite-item-controls">
                            ${isAvailable ? `
                                <button class="add-to-cart" onclick="addToCart(${item.id})" style="font-size: 0.85rem;">
                                    <i class="fas fa-cart-plus"></i> В корзину
                                </button>
                            ` : ''}
                            ${item.isNew ? '<span class="new-badge" style="position: static; font-size: 0.7rem;">NEW</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        const hasAvailableItems = filteredFavorites.some(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            return product && product.quantity > 0;
        });
        
        addAllToCartBtn.disabled = !hasAvailableItems;
        addAllToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Добавить все в корзину (' + filteredFavorites.length + ')';
    }
}

function switchFavoritesTab(tabName) {
    currentFavoritesTab = tabName;
    
    document.querySelectorAll('.favorites-tab').forEach(function(tab) {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(tabName)) {
            tab.classList.add('active');
        }
    });
    
    const tabs = document.querySelectorAll('.favorites-tab');
    if (tabName === 'all') tabs[0].classList.add('active');
    if (tabName === 'available') tabs[1].classList.add('active');
    if (tabName === 'new') tabs[2].classList.add('active');
    
    renderFavoritesItems();
}

function addAllFavoritesToCart() {
    const filteredFavorites = favorites.filter(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        return product && product.quantity > 0;
    });
    
    if (filteredFavorites.length === 0) return;
    
    let addedCount = 0;
    filteredFavorites.forEach(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        if (product && product.quantity > 0) {
            const existingItem = cart.find(function(cartItem) { return cartItem.id === item.id; });
            
            if (existingItem) {
                if (existingItem.quantity < product.quantity) {
                    existingItem.quantity += 1;
                    addedCount++;
                }
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
                addedCount++;
            }
        }
    });
    
    if (addedCount > 0) {
        saveCart();
        closeFavorites();
    }
}

function clearFavorites() {
    if (favorites.length === 0) return;
    
    if (confirm("Очистить всё избранное?")) {
        favorites = [];
        saveFavorites();
    }
}

function generateOrderNumber() {
    let orderCounter = localStorage.getItem('iceberg_order_counter');
    
    if (!orderCounter) {
        orderCounter = 0;
    } else {
        orderCounter = parseInt(orderCounter);
    }
    
    orderCounter += 1;
    
    localStorage.setItem('iceberg_order_counter', orderCounter.toString());
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return 'ORD-' + year + month + day + '-' + orderCounter.toString().padStart(5, '0');
}

async function notifyManager(orderData) {
    try {
        let message = '**НОВЫЙ ЗАКАЗ #' + orderData.orderNumber + '**\n\n';
        
        message += '👤 **Покупатель:**\n';
        
        if (orderData.user && orderData.user.id) {
            message += 'ID: ' + orderData.user.id + '\n';
        } else {
            message += 'ID: Не указан\n';
        }
        
        if (orderData.user && orderData.user.username) {
            message += '@' + orderData.user.username + '\n';
        } else {
            message += '@ Не указан\n';
        }
        
        if (orderData.user && orderData.user.first_name) {
            message += '**Имя:** ' + orderData.user.first_name + '\n';
        } else {
            message += 'Имя: Не указано\n';
        }
        
        if (orderData.user && orderData.user.phone) {
            message += '📞 **Номер телефона клиента:** ' + orderData.user.phone + '\n';
        } else {
            message += '📞 **Номер телефона клиента:** Не указан\n';
        }
        
        message += '\n🚚 **Способ получения:** ' + (orderData.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка') + '\n';
        
        if (orderData.deliveryMethod === 'delivery') {
            message += '📍 **Адрес доставки:** ' + (orderData.deliveryAddress || 'Не указан') + '\n';
            message += '⏰ **Время доставки:** ' + (orderData.deliveryTime || 'Не указано') + '\n';
            if (orderData.deliveryNotes) {
                message += '📝 **Комментарий:** ' + orderData.deliveryNotes + '\n';
            }
        }
        
        message += '\n📅 **Дата:** ' + new Date(orderData.timestamp).toLocaleString('ru-RU') + '\n';
        
        message += '\n🛒 **Товары:**\n';
        orderData.products.forEach(function(item, index) {
            message += (index + 1) + '. ' + item.name + '\n';
            message += '   Кол-во: ' + item.quantity + ' шт.\n';
            message += '   Цена: ' + item.price + ' руб./шт.\n';
            message += '   Сумма: ' + (item.price * item.quantity) + ' руб.\n\n';
        });
        
        message += '💰 *ИТОГО:*\n';
        message += 'Товаров: ' + orderData.items_count + ' шт.\n';
        message += 'Сумма заказа: *' + orderData.total + ' руб.*\n\n';
        
        message += '⚡️ *Статус:* Ожидает обработки\n';
        message += '🔗 Для связи: @Chief_68\n\n';
        message += '📋 *Номер заказа:* #' + orderData.orderNumber;
        
        const managerUsername = 'Chief_68';
        
        const simpleMessage = 'Здравствуйте! У меня оформлен заказ #' + orderData.orderNumber + 
                              ' на сумму ' + orderData.total + ' руб.\n\n' +
                              'Способ получения: ' + (orderData.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка') + '\n' +
                              (orderData.deliveryMethod === 'delivery' ? 'Адрес: ' + orderData.deliveryAddress + '\n' : '') +
                              (orderData.deliveryMethod === 'delivery' ? 'Время: ' + orderData.deliveryTime + '\n' : '') +
                              'Товары:\n' + orderData.products.map((item, idx) => 
                                  `${idx+1}. ${item.name} × ${item.quantity} шт. = ${item.price * item.quantity} руб.`
                              ).join('\n') +
                              '\n\nПрошу подтвердить заказ и уточнить детали доставки.';
        
        if (window.Telegram && window.Telegram.WebApp) {
            try {
                const tg = window.Telegram.WebApp;
                
                if (tg.showPopup) {
                    tg.showPopup({
                        title: 'Заказ оформлен!',
                        message: `Номер заказа: #${orderData.orderNumber}\n\nНажмите "Написать менеджеру" для подтверждения`,
                        buttons: [{
                            type: 'default',
                            text: 'Написать менеджеру',
                            id: 'contact_manager'
                        }, {
                            type: 'cancel',
                            text: 'Закрыть',
                            id: 'close'
                        }]
                    }, function(buttonId) {
                        if (buttonId === 'contact_manager') {
                            const tgLink = 'https://t.me/' + managerUsername + '?text=' + encodeURIComponent(simpleMessage);
                            
                            if (tg.openLink) {
                                tg.openLink(tgLink);
                            } else {
                                window.open(tgLink, '_blank');
                            }
                        }
                    });
                }
                
                if (tg.sendData) {
                    tg.sendData(JSON.stringify({
                        type: 'order',
                        orderNumber: orderData.orderNumber,
                        total: orderData.total,
                        items: orderData.items_count,
                        timestamp: orderData.timestamp,
                        deliveryMethod: orderData.deliveryMethod
                    }));
                }
                
            } catch (tgError) {
                console.log('Telegram API error, using fallback:', tgError);
            }
        }
        
        try {
            const tgLink = 'https://t.me/' + managerUsername + '?text=' + encodeURIComponent(message);
            
            window.open(tgLink, '_blank');
            
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                showIOSNotification(orderData.orderNumber, tgLink);
            }
            
        } catch (linkError) {
            console.log('Link opening error:', linkError);
        }
        
        showContactButton(orderData.orderNumber);
        
        return true;
        
    } catch (error) {
        console.error('Error notifying manager:', error);
        return false;
    }
}

function showIOSNotification(orderNumber, tgLink) {
    const notification = document.createElement('div');
    notification.className = 'ios-notification';
    notification.innerHTML = `
        <div class="ios-notification-content">
            <div class="ios-notification-header">
                <i class="fas fa-mobile-alt"></i>
                <h3 class="ios-notification-title">iOS инструкция</h3>
            </div>
            <div class="ios-notification-body">
                <p class="ios-instruction-text">Для подтверждения заказа <strong>#${orderNumber}</strong>:</p>
                <ol class="ios-instruction-list">
                    <li>Нажмите кнопку "Открыть Telegram"</li>
                    <li>Нажмите "Send" в открывшемся окне</li>
                    <li>Ожидайте ответа от менеджера</li>
                </ol>
            </div>
            <div class="ios-notification-footer">
                <button class="ios-open-tg" onclick="window.open('${tgLink}', '_blank')">
                    <i class="fab fa-telegram"></i> <span class="ios-btn-text">Открыть Telegram</span>
                </button>
                <button class="ios-copy-number" onclick="navigator.clipboard.writeText('#${orderNumber}')">
                    <i class="fas fa-copy"></i> <span class="ios-btn-text">Копировать номер</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 30000);
}

function showContactButton(orderNumber) {
    const contactBtn = document.createElement('a');
    contactBtn.className = 'contact-manager-fixed';
    contactBtn.href = 'https://t.me/Chief_68?text=' + encodeURIComponent(
        `Заказ #${orderNumber} - нужна консультация`
    );
    contactBtn.target = '_blank';
    contactBtn.innerHTML = `
        <i class="fab fa-telegram"></i>
        <span class="contact-text">Написать менеджеру</span>
        <small class="order-number-text">Заказ #${orderNumber}</small>
    `;
    
    document.body.appendChild(contactBtn);
}

async function checkout() {
    if (cart.length === 0) return;
    
    const unavailableItems = cart.filter(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        return !product || product.quantity <= 0;
    });
    
    if (unavailableItems.length > 0) {
        cart = cart.filter(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            return product && product.quantity > 0;
        });
        
        saveCart();
        return;
    }
    
    const exceededItems = cart.filter(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        return product && item.quantity > product.quantity;
    });
    
    if (exceededItems.length > 0) {
        exceededItems.forEach(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            if (product) {
                item.quantity = product.quantity;
            }
        });
        saveCart();
        return;
    }

    const orderNumber = generateOrderNumber();
    
    const orderData = {
        orderNumber: orderNumber,
        products: cart.map(function(item) {
            return {
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            };
        }),
        total: getCartTotal(),
        items_count: getCartCount(),
        timestamp: new Date().toISOString(),
        deliveryMethod: deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
        deliveryTime: deliveryMethod === 'delivery' ? deliveryTime : null,
        deliveryNotes: deliveryMethod === 'delivery' ? deliveryNotes : null,
        user: tg ? {
            id: tg.initDataUnsafe.user && tg.initDataUnsafe.user.id,
            username: tg.initDataUnsafe.user && tg.initDataUnsafe.user.username,
            first_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.last_name
        } : null
    };
    
    saveCart(); // Сохраняем только корзину (очистка будет после отправки)
    
    // Проверяем данные доставки перед показом окна с телефоном
    const deliveryValidation = validateDeliveryInfo();
    if (!deliveryValidation.isValid) {
        showNotification(deliveryValidation.error, 'error');
        
        // Показываем модалку выбора способа доставки
        setTimeout(() => {
            showDeliveryMethodModal();
        }, 500);
        
        return;
    }
    
    showPhoneConfirmationModal(orderData);
}

function openFavorites() {
    document.getElementById('favoritesSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderFavoritesItems();
}

function closeFavorites() {
    document.getElementById('favoritesSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function openCart() {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Обновляем UI доставки при открытии корзины
    updateDeliveryUIInCart();
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

async function loadAndRenderProducts() {
    try {
        const newProducts = await loadProductsFromGitHub();
        
        products = newProducts;
        
        createCategoriesNav();
        renderProductsByCategory();
        
        updateFavoritesUI();
        
        let cartUpdated = false;
        cart.forEach(function(cartItem) {
            const product = products.find(function(p) { return p.id === cartItem.id; });
            if (!product || product.quantity <= 0) {
                removeFromCart(cartItem.id);
                cartUpdated = true;
            } else if (cartItem.quantity > product.quantity) {
                cartItem.quantity = product.quantity;
                cartUpdated = true;
            }
        });
        
        if (cartUpdated) {
            saveCart();
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function startAutoUpdate() {
    autoUpdateInterval = setInterval(async function() {
        await loadAndRenderProducts();
    }, 60000);
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
        autoUpdateInterval = null;
    }
}

function initCategoriesScroll() {
    const categoriesNav = document.getElementById('categoriesNav');
    if (!categoriesNav) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    
    categoriesNav.addEventListener('mousedown', (e) => {
        isDown = true;
        categoriesNav.classList.add('grabbing');
        startX = e.pageX - categoriesNav.offsetLeft;
        scrollLeft = categoriesNav.scrollLeft;
    });
    
    categoriesNav.addEventListener('mouseleave', () => {
        isDown = false;
        categoriesNav.classList.remove('grabbing');
    });
    
    categoriesNav.addEventListener('mouseup', () => {
        isDown = false;
        categoriesNav.classList.remove('grabbing');
    });
    
    categoriesNav.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - categoriesNav.offsetLeft;
        const walk = (x - startX) * 2;
        categoriesNav.scrollLeft = scrollLeft - walk;
    });
    
    categoriesNav.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - categoriesNav.offsetLeft;
        scrollLeft = categoriesNav.scrollLeft;
    });
    
    categoriesNav.addEventListener('touchend', () => {
        isDown = false;
    });
    
    categoriesNav.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - categoriesNav.offsetLeft;
        const walk = (x - startX) * 2;
        categoriesNav.scrollLeft = scrollLeft - walk;
    });
    
    categoriesNav.addEventListener('wheel', (e) => {
        e.preventDefault();
        categoriesNav.scrollLeft += e.deltaY * 0.5;
    });
    
    function updateScrollIndicator() {
        const scrollPercentage = (categoriesNav.scrollLeft / 
            (categoriesNav.scrollWidth - categoriesNav.clientWidth)) * 100;
        
        const indicator = document.querySelector('.scroll-progress');
        if (indicator) {
            indicator.style.width = scrollPercentage + '%';
        }
    }
    
    categoriesNav.addEventListener('scroll', updateScrollIndicator);
    updateScrollIndicator();
}

function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (window.innerWidth > 768 && !e.target.matches('input, textarea')) {
            const categoriesNav = document.getElementById('categoriesNav');
            if (!categoriesNav) return;
            
            if (e.key === 'ArrowLeft') {
                categoriesNav.scrollBy({ left: -200, behavior: 'smooth' });
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                categoriesNav.scrollBy({ left: 200, behavior: 'smooth' });
                e.preventDefault();
            }
        }
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchClear || !searchResults) return;
    
    let searchTimeout = null;
    
    function highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    function performSearch(query) {
        if (!query || query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner"></i> Поиск...</div>';
        searchResults.style.display = 'block';
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchQuery = query.toLowerCase().trim();
            const filteredProducts = products.filter(product => {
                const searchText = (product.name + ' ' + (product.description || '')).toLowerCase();
                return searchText.includes(searchQuery);
            });
            
            displaySearchResults(filteredProducts, searchQuery);
        }, 300);
    }
    
    function displaySearchResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить запрос</p>
                </div>
            `;
            return;
        }
        
        searchResults.innerHTML = results.slice(0, 10).map(product => {
            const isAvailable = product.quantity > 0;
            const isFav = isFavorite(product.id);
            
            return `
                <div class="search-result-item" onclick="addToCartFromSearch(${product.id})">
                    <img src="${product.image}" 
                         alt="${product.name}" 
                         class="search-result-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/50x50/FF9800/FFFFFF?text=ICEBERG'">
                    <div class="search-result-info">
                        <div class="search-result-name">${highlightText(product.name, query)}</div>
                        <div class="search-result-description">${highlightText(product.description || '', query)}</div>
                        <div class="search-result-price">${product.price} ₽</div>
                    </div>
                    <button class="search-result-add" 
                            onclick="event.stopPropagation(); addToCartFromSearch(${product.id}, this)"
                            ${!isAvailable ? 'disabled style="opacity: 0.5;"' : ''}>
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            `;
        }).join('');
    }
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        searchClear.style.display = query.length > 0 ? 'flex' : 'none';
        performSearch(query);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            performSearch(searchInput.value);
        }
    });
    
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        searchResults.style.display = 'none';
        searchInput.focus();
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            performSearch(searchInput.value);
        }
    });
}

window.addToCartFromSearch = function(productId, buttonElement) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.quantity <= 0) {
        showNotification('Товар временно отсутствует', 'error');
        return;
    }
    
    addToCart(productId);
    
    if (buttonElement) {
        const originalHTML = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-check"></i>';
        buttonElement.style.background = '#4CAF50';
        
        setTimeout(() => {
            buttonElement.innerHTML = originalHTML;
            buttonElement.style.background = '';
        }, 1000);
    } else {
        showNotification('Товар добавлен в корзину', 'success');
    }
};

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span class="notification-text">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function addDostavistaButtonForAdmin() {
    const isAdmin = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && 
                    (tg.initDataUnsafe.user.username === 'Chief_68' || 
                     tg.initDataUnsafe.user.id === 123456789);
    
    if (isAdmin) {
        const dostavistaBtn = document.createElement('button');
        dostavistaBtn.className = 'admin-dostavista-btn';
        dostavistaBtn.innerHTML = `
            <i class="fas fa-external-link-alt"></i>
            <span class="dostavista-text">Dostavista</span>
        `;
        dostavistaBtn.onclick = function() {
            window.open('https://apitest.dostavista.ru/order', '_blank');
        };
        
        const headerNav = document.querySelector('.header-nav');
        if (headerNav) {
            headerNav.appendChild(dostavistaBtn);
        } else {
            document.body.appendChild(dostavistaBtn);
        }
    }
}

async function initApp() {
    detectTheme();
    initTelegram();
    
    loadDeliveryInfo();
    await loadAndRenderProducts();
    loadCart();
    loadFavorites();
    loadPhoneNumber();
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
    
    // Добавляем секцию доставки в корзину
    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
        const oldSection = document.querySelector('.delivery-section');
        if (oldSection) oldSection.remove();
        
        const deliverySection = document.createElement('div');
        deliverySection.className = 'delivery-section';
        deliverySection.innerHTML = `
            <div class="delivery-info">
                <div class="delivery-method-display" id="deliveryMethodDisplay">
                    <i class="fas fa-store"></i>
                    <div class="delivery-text-content">
                        <span class="delivery-method-name">Самовывоз</span>
                        <small class="delivery-method-description">Забрать самостоятельно</small>
                    </div>
                </div>
                <button class="change-delivery-btn" id="changeDeliveryButton" onclick="showDeliveryMethodModal()">
                    <i class="fas fa-edit"></i>
                    <span class="change-delivery-text">Изменить способ</span>
                </button>
            </div>
        `;
        cartFooter.insertBefore(deliverySection, cartFooter.firstChild);
        
        updateDeliveryUIInCart();
    }
    
    document.getElementById('favoritesButton').onclick = openFavorites;
    document.getElementById('closeFavorites').onclick = closeFavorites;
    
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.checkout = checkout;
    window.clearCart = clearCart;
    window.toggleTheme = toggleTheme;
    window.selectCategory = selectCategory;
    window.selectSubCategory = selectSubCategory;
    window.backToCategories = backToCategories;
    window.switchCategory = switchCategory;
    window.switchSubCategory = switchSubCategory;
    window.openManagerChat = openManagerChat;
    
    window.toggleFavorite = toggleFavorite;
    window.removeFromFavorites = removeFromFavorites;
    window.openFavorites = openFavorites;
    window.closeFavorites = closeFavorites;
    window.switchFavoritesTab = switchFavoritesTab;
    window.addAllFavoritesToCart = addAllFavoritesToCart;
    window.clearFavorites = clearFavorites;
    
    window.showDeliveryMethodModal = showDeliveryMethodModal;
    window.changeDeliveryMethod = changeDeliveryMethod;
    
    // Новые функции для работы с модалками поверх друг друга
    window.showDeliveryMethodModalOverPhone = showDeliveryMethodModalOverPhone;
    window.changeDeliveryMethodAndUpdatePhoneModal = changeDeliveryMethodAndUpdatePhoneModal;
    
    initCategoriesScroll();
    initKeyboardNavigation();
    initSearch();
    
    addDostavistaButtonForAdmin();
    
    setTimeout(function() {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        if (loader && app) {
            loader.style.opacity = '0';
            setTimeout(function() {
                loader.style.display = 'none';
                app.style.display = 'block';
            }, 300);
        }
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Недостающие функции, которые вызываются в коде

function openManagerChat() {
    const managerUsername = 'Chief_68';
    const tgLink = 'https://t.me/' + managerUsername;
    window.open(tgLink, '_blank');
}

function showOrderConfirmationModal(orderData, orderNumber, savedToServer) {
    const modal = document.createElement('div');
    modal.className = 'order-confirmation-modal';
    modal.innerHTML = `
        <div class="order-confirmation-content">
            <div class="order-confirmation-header">
                <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 48px;"></i>
                <h2 class="order-modal-title">Заказ успешно оформлен!</h2>
            </div>
            <div class="order-confirmation-body">
                <div class="order-details">
                    <p><strong>Номер заказа:</strong> #${orderNumber}</p>
                    <p><strong>Сумма заказа:</strong> ${orderData.total} ₽</p>
                    <p><strong>Товаров:</strong> ${orderData.items_count} шт.</p>
                    <p><strong>Способ получения:</strong> ${orderData.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
                    ${orderData.deliveryMethod === 'delivery' && orderData.deliveryAddress ? `<p><strong>Адрес доставки:</strong> ${orderData.deliveryAddress}</p>` : ''}
                    ${orderData.deliveryMethod === 'delivery' && orderData.deliveryTime ? `<p><strong>Время доставки:</strong> ${orderData.deliveryTime}</p>` : ''}
                    <p><strong>Статус сохранения:</strong> ${savedToServer ? '✅ Сохранен на сервере' : '⚠️ Ошибка сохранения'}</p>
                </div>
                <div class="order-notification">
                    <i class="fas fa-info-circle"></i>
                    <p>Менеджер свяжется с вами в ближайшее время для подтверждения заказа.</p>
                </div>
            </div>
            <div class="order-confirmation-footer">
                <button id="closeOrderModalBtn" class="close-order-modal-btn">
                    <i class="fas fa-times"></i> <span class="btn-text">Закрыть</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeOrderModalBtn').addEventListener('click', function() {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    });
}

function showManagerNotification(orderNumber) {
    console.log(`Заказ #${orderNumber} отправлен менеджеру`);
}

// Добавьте в глобальную область видимости
window.openManagerChat = openManagerChat;
window.showOrderConfirmationModal = showOrderConfirmationModal;
window.showManagerNotification = showManagerNotification;

window.addEventListener('beforeunload', stopAutoUpdate);
