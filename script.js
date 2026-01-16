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
        
        document.body.classList.remove('light-theme', 'dark-theme', 'auto-theme');
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
    }, { passive: false });

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
            id: 1002,
            name: "ШОК МЯТНО-ХОЛОДНОЕ ПОХИЩЕНИЕ (150 МГ)",
            description: "ЖВАЧКА С МЯТОЙ",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/7754/889290314/large_%D0%BC%D1%8F%D1%82%D0%B0__6_.png",
            isNew: false
        },
        {
            id: 1003,
            name: "ШОК МАНГОВО-ЧЕРНАЯ БУХГАЛТЕРИЯ (150 МГ)",
            description: "ЖВАЧКА С МАНГО",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/8106/889290666/large_%D0%BC%D0%B0%D0%BD%D0%B3%D0%BE__5_.png",
            isNew: false
        },
        {
            id: 1004,
            name: "ШОК АЗАРТ ЙОГУРТА ПЕРСИКА И БАНАНА (150 МГ)",
            description: "ЖВАЧКА С ЙОГУРТОМ БАНАНОМ И ПЕРСИКОМ",
            price: 500,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/773/889291525/large_%D0%B0%D0%B7%D0%B0%D1%80%D1%82__3_.png",
            isNew: false
        },
        {
            id: 1005,
            name: "ШОК ЯБЛОЧНО-ЗЕЛЕНОЕ ОГРАБЛЕНИЕ (150 МГ)",
            description: "ЖВАЧКА С ЗЕЛЕНЫМ ЯБЛОКОМ",
            price: 500,
            quantity: 7,
            image: "https://static.insales-cdn.com/images/products/1/804/889291556/large_%D1%8F%D0%B1%D0%BB%D0%BE%D0%BA%D0%BE.png",
            isNew: false
        },
        {
            id: 1006,
            name: "ШОК ОБЛАВА НА ЧЕРНУЮ СМОРОДИНУ И ХВОЮ (150 МГ)",
            description: "ЖВАЧКА С ЧЕРНОЙ СМОРОДИНОЙ И ХВОЕЙ",
            price: 500,
            quantity: 9,
            image: "https://static.insales-cdn.com/images/products/1/824/889291576/large_%D1%87%D0%B5%D1%80%D0%BD%D0%B0%D1%8F_%D1%81%D0%BC%D0%BE%D1%80%D0%BE%D0%B4%D0%B8%D0%BD%D0%B0_%D0%B8_%D1%85%D0%B2%D0%BE%D1%8F.png",
            isNew: false
        },
        {
            id: 1007,
            name: "ШОК БАБЛ-БОСС (150 МГ)",
            description: "ЖВАЧКА БАБЛ ГАМ",
            price: 500,
            quantity: 6,
            image: "https://static.insales-cdn.com/images/products/1/840/889291592/large_%D0%B1%D0%B0%D0%B1%D0%BB%D0%B1%D0%BE%D1%81%D1%81__4_.png",
            isNew: false
        },
        {
            id: 1008,
            name: "ШОК ГРАНЧЕР (75 МГ)",
            description: "ЭНЕРГЕТИК С ГОЛУБИКОЙ И ГРАНАТОМ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/7505/889290065/large_%D0%BF%D0%BB%D0%BE%D1%82%D0%BE%D1%8F%D0%B7__6_.png",
            isNew: false
        },
        {
            id: 1009,
            name: "ШОК ДЕМОНИКС (75 МГ)",
            description: "ЭНЕРГЕТИК С МИНДАЛЕМ И ЛИМОННЫМ КРЕМОМ",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/7526/889290086/large_%D0%B4%D0%B5%D0%BC%D0%BE%D0%BD%D0%B8%D0%BA%D1%81___2_.png",
            isNew: false
        },
        {
            id: 1010,
            name: "ШОК ЗЛОКС (75 МГ)",
            description: "ЭНЕРГЕТИК С ВИШНЕЙ КИВИ И ЛАЙМОМ",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/7573/889290133/large_%D0%B7%D0%BB%D0%BE%D0%BA%D1%81__3_.png",
            isNew: false
        },
        {
            id: 1011,
            name: "ШОК КРАКСТЕР (75 МГ)",
            description: "ЭНЕРГЕТИК С ДЫНЕЙ И КРЫЖОВНИКОМ",
            price: 500,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/7595/889290155/large_%D0%BA%D1%80%D0%B0%D0%BA%D1%81%D1%82%D0%B5%D1%80_.png",
            isNew: false
        },
        {
            id: 1012,
            name: "ICEBERG APPLE PIE (75 МГ)",
            description: "ЯБЛОЧНЫЙ ПИРОГ",
            price: 700,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/1089/2396644417/large_Apple_Pie_1.png",
            isNew: false
        },
        {
            id: 1013,
            name: "ICEBERG BANOFFEE (75 МГ)",
            description: "ПИРОГ БАНОФФИ",
            price: 700,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/7785/2396667497/large_Banoffee_1.png",
            isNew: false
        },
        {
            id: 1014,
            name: "ICEBERG BLUEBERRY PIE (75 МГ)",
            description: "ЧЕРНИЧНЫЙ ПИРОГ",
            price: 700,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/6873/2396748505/large_Blueberry_Pie_1.png",
            isNew: false
        },
        {
            id: 1015,
            name: "ICEBERG CHEESECAKE (75 МГ)",
            description: "ЧИЗКЕЙК",
            price: 700,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/2657/2396768865/large_Cheesecake_1.png",
            isNew: false
        },
        {
            id: 1016,
            name: "ICEBERG CHERRY PIE (75 МГ)",
            description: "ВИШНЕВЫЙ ПИРОГ",
            price: 700,
            quantity: 7,
            image: "https://static.insales-cdn.com/images/products/1/6065/2396772273/large_Cherry_Pie_1.png",
            isNew: false
        },
        {
            id: 1017,
            name: "ICEBERG KEY LIME PIE (75 МГ)",
            description: "ЛАЙМОВЫЙ ПИРОГ",
            price: 700,
            quantity: 9,
            image: "https://static.insales-cdn.com/images/products/1/2273/2396784865/large_Key_Lime_1.png",
            isNew: false
        },
        {
            id: 1018,
            name: "FAFF SPEARMINT (65 МГ)",
            description: "МЯТА",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/r/3L_rHm50iO8/rs:fit:1000:0:1/q:100/plain/images/products/1/3833/748211961/%D0%9C%D0%AF%D0%A2%D0%90_%D0%A8%D0%90%D0%99%D0%91%D0%90.png@webp",
            isNew: false
        },
        {
            id: 1019,
            name: "FAFF RASPBERRY JINGLE (75 МГ)",
            description: "МАЛИНА",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/3834/748211962/large_%D0%9C%D0%90%D0%9B%D0%98%D0%9D%D0%9E%D0%92%D0%AB%D0%99_%D0%97%D0%92%D0%9E%D0%9D.png",
            isNew: false
        },
        {
            id: 1020,
            name: "FAFF CITRON (75 МГ)",
            description: "СПРАЙТ",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/3839/748211967/large_%D0%A1%D0%9F%D0%A0%D0%90%D0%99%D0%A2.png",
            isNew: false
        },
        {
            id: 1021,
            name: "FAFF COLA (75 МГ)",
            description: "КОЛА",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/3842/748211970/large_%D0%9A%D0%9E%D0%9A%D0%90_%D0%92%D0%9A%D0%A3%D0%A1_%D0%9A%D0%9E%D0%9B%D0%AB.png",
            isNew: false
        },
        {
            id: 1022,
            name: "FAFF DOUBLE APPLE (75 МГ)",
            description: "ДВОЙНОЕ ЯБЛОКО",
            price: 500,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/3853/748211981/large_%D0%AF%D0%91%D0%9B%D0%9E%D0%9A%D0%9E.png",
            isNew: false
        },
        {
            id: 1023,
            name: "FAFF PINA COLADA (75 МГ)",
            description: "ПИНА КОЛАДА",
            price: 500,
            quantity: 7,
            image: "https://static.insales-cdn.com/images/products/1/3856/748211984/large_%D0%9F%D0%98%D0%9D%D0%90_%D0%BA.png",
            isNew: false
        },
        {
            id: 1024,
            name: "FAFF STRAWBERRY GUM (75 МГ)",
            description: "КЛУБНИЧНАЯ ЖВАЧКА",
            price: 500,
            quantity: 9,
            image: "https://static.insales-cdn.com/images/products/1/3858/748211986/large_%D0%9A%D0%9B%D0%A3%D0%91%D0%9D%D0%98%D0%A7%D0%9D%D0%90%D0%AF_%D0%96%D0%92%D0%90%D0%A7%D0%9A%D0%90.png",
            isNew: false
        },
        {
            id: 1025,
            name: "FAFF MELON CHILL (75 МГ)",
            description: "ДЫНЯ",
            price: 500,
            quantity: 6,
            image: "https://static.insales-cdn.com/images/products/1/3865/748211993/large_%D0%94%D0%AB%D0%9D%D0%AF.png",
            isNew: false
        },
        {
            id: 1026,
            name: "FAFF STRAWBERRY CHEESECAKE (75 МГ)",
            description: "КЛУБНИЧНЫЙ ЧИЗКЕЙК",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/3874/748212002/large_%D0%A7%D0%98%D0%97%D0%9A%D0%95%D0%99%D0%9A.png",
            isNew: false
        },
        {
            id: 1027,
            name: "FAFF IZABELLA (75 МГ)",
            description: "ВИНОГРАД ИЗАБЕЛЛА",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/3890/748212018/large_%D0%92%D0%98%D0%9D%D0%9E%D0%93%D0%A0%D0%90%D0%94_%D0%98%D0%97%D0%90%D0%91%D0%95%D0%9B%D0%9B%D0%90.png",
            isNew: false
        },
        {
            id: 1028,
            name: "FAFF ENERGY (75 МГ)",
            description: "РЕД БУЛЛ",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/3895/748212023/large_%D0%AD%D0%9D%D0%95%D0%A0%D0%93%D0%95%D0%A2%D0%98%D0%9A_%D0%A0%D0%95%D0%94%D0%91%D0%A3%D0%9B.png",
            isNew: false
        },
        {
            id: 1029,
            name: "FAFF TROPIC STORM (100 МГ)",
            description: "МАНГО, АПЕЛЬСИН",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/3896/748212024/large_%D0%A2%D0%A0%D0%9E%D0%9F%D0%98%D0%9A%D0%98.png",
            isNew: false
        },
        {
            id: 1030,
            name: "FAFF DARK NIGHT (100 МГ)",
            description: "ЧЕРНАЯ СМОРОДИНА",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/3905/748212033/large_%D0%A7%D0%81%D0%A0%D0%9D%D0%90%D0%AF_%D0%A1%D0%9C%D0%9E%D0%A0%D0%9E%D0%94%D0%98%D0%9D%D0%90.png",
            isNew: false
        },
        {
            id: 1031,
            name: "FAFF COCOS (100 МГ)",
            description: "КОКОС",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/3953/748212081/large_%D0%9A%D0%9E%D0%9A%D0%9E%D0%A1_%D0%A8%D0%90%D0%99%D0%91%D0%90.png",
            isNew: false
        },
        {
            id: 1032,
            name: "FAFF CHERRY COLA (150 МГ)",
            description: "КОЛА, ВИШНЯ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4072/748212200/large_%D0%9A%D0%9E%D0%9B%D0%90_%D0%A1_%D0%92%D0%98%D0%A8%D0%9D%D0%95%D0%99_1.png",
            isNew: false
        },
        {
            id: 1033,
            name: "FAFF PINK LEMONADE (150 МГ)",
            description: "РОЗОВЫЙ ЛИМОНАД",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/3991/748212119/large_%D0%A4%D0%A0%D0%A3%D0%9A%D0%A2%D0%9E%D0%92%D0%AB%D0%99_%D0%9B%D0%98%D0%9C%D0%9E%D0%9D%D0%90%D0%94.png",
            isNew: false
        },
        {
            id: 1034,
            name: "FAFF ENERGY COLA (150 МГ)",
            description: "КОЛА, ЭНЕРГЕТИК",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/4018/748212146/large_%D0%9A%D0%9E%D0%9B%D0%90_%D0%A1_%D0%AD%D0%9D%D0%95%D0%A0%D0%9D%D0%93%D0%95%D0%A2%D0%98%D0%9A%D0%9E%D0%9C.png",
            isNew: false
        },
        {
            id: 1035,
            name: "FAFF GUMMY BEARS (150 МГ)",
            description: "МАРМЕЛАДНЫЕ МИШКИ",
            price: 500,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/4032/748212160/large_%D0%9C%D0%98%D0%A8%D0%9A%D0%98.png",
            isNew: false
        },
        {
            id: 1036,
            name: "FAFF ORANGE SODA (150 МГ)",
            description: "ФАНТА",
            price: 500,
            quantity: 7,
            image: "https://static.insales-cdn.com/images/products/1/4037/748212165/large_%D0%A4%D0%90%D0%9D%D0%A2%D0%90.png",
            isNew: false
        },
        {
            id: 1037,
            name: "ФАФФ 150 МГ - СЛИВОЧНЫЕ ВАФЛИ",
            description: "СЛИВОЧНЫЕ ВАФЛИ",
            price: 500,
            quantity: 9,
            image: "https://static.insales-cdn.com/images/products/1/4039/748212167/large_%D0%92%D0%90%D0%A4%D0%9B%D0%98_%D0%A1%D0%9B%D0%98%D0%92%D0%9E%D0%A7%D0%9D%D0%AB%D0%95.png",
            isNew: false
        },
        {
            id: 1038,
            name: "FAFF TOP GUM (150 МГ)",
            description: "ЖВАЧКА, КЛУБНИКА, КИВИ",
            price: 500,
            quantity: 6,
            image: "https://static.insales-cdn.com/images/products/1/4048/748212176/large_%D0%A2%D0%9E%D0%9F%D0%93%D0%90%D0%9C.png",
            isNew: false
        },
        {
            id: 1039,
            name: "FAFF MULBERRY (150 МГ)",
            description: "ШЕЛКОВИЦА",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4049/748212177/large_%D1%88%D0%B5%D0%BB%D0%BA%D0%BE%D0%B2%D0%B8%D1%86%D0%B0.png",
            isNew: false
        },
        {
            id: 1040,
            name: "FAFF PEACH TEA (150 МГ)",
            description: "ПЕРСИКОВЫЙ ЧАЙ",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/4050/748212178/large_%D0%A7%D0%90%D0%99.png",
            isNew: false
        },
        {
            id: 1041,
            name: "FAFF FRUIT-TELLA (150 МГ)",
            description: "ФРУТЕЛЛА",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/4054/748212182/large_%D0%A4%D0%A0%D0%A3%D0%A2%D0%95%D0%9B%D0%9B%D0%90.png",
            isNew: false
        },
        {
            id: 1042,
            name: "FAFF BE QUEEN (150 МГ)",
            description: "МАЛИНА, ЗЕМЛЯНИКА, ПОЛЕВЫЕ ЦВЕТЫ",
            price: 500,
            quantity: 5,
            image: "https://static.insales-cdn.com/images/products/1/4059/748212187/large_%D0%9C%D0%90%D0%9B%D0%98%D0%9D%D0%90_%D0%97%D0%95%D0%9C%D0%9B%D0%AF%D0%9D%D0%98%D0%9A%D0%90_%D0%9F%D0%9E%D0%9B%D0%95%D0%92%D0%AB%D0%95_%D0%A6%D0%92%D0%95%D0%A2%D0%AB.png",
            isNew: false
        },
        {
            id: 1043,
            name: "FAFF CACTUS (150 МГ)",
            description: "КИВИ, КАКТУС, ЯБЛОКО",
            price: 500,
            quantity: 7,
            image: "https://static.insales-cdn.com/images/products/1/4062/748212190/large_%D0%9A%D0%90%D0%9A%D0%A2%D0%A3%D0%A1.png",
            isNew: false
        },
        {
            id: 1044,
            name: "FAFF COCOBERRY (150 МГ)",
            description: "КОКОС, КЛУБНИКА",
            price: 500,
            quantity: 9,
            image: "https://static.insales-cdn.com/images/products/1/4064/748212192/large_%D0%9A%D0%9E%D0%9A%D0%9E%D0%A1_%D0%A1_%D0%9A%D0%9B%D0%A3%D0%91%D0%9D%D0%98%D0%9A%D0%9E%D0%99.png",
            isNew: false
        },
        {
            id: 1045,
            name: "FAFF RED MOJITO (150 МГ)",
            description: "КЛУБНИЧНЫЙ МОХИТО",
            price: 500,
            quantity: 6,
            image: "https://static.insales-cdn.com/images/products/1/4067/748212195/large_%D0%9A%D0%9B%D0%A3%D0%91%D0%9D%D0%98%D0%A7%D0%9D%D0%AB%D0%99_%D0%9C%D0%9E%D0%A5%D0%98%D0%A2%D0%9E.png",
            isNew: false
        },
        {
            id: 1046,
            name: "FAFF TEQUILA SUNRISE (150 МГ)",
            description: "ТЕКИЛА САНРАЙЗ",
            price: 500,
            quantity: 10,
            image: "https://static.insales-cdn.com/images/products/1/4069/748212197/large_%D0%A2%D0%95%D0%9A%D0%98%D0%9B%D0%90.png",
            isNew: false
        },
        {
            id: 1047,
            name: "FAFF TOP MINT (150 МГ)",
            description: "МЯТА",
            price: 500,
            quantity: 8,
            image: "https://static.insales-cdn.com/images/products/1/2013/764078045/large_%D0%A2%D0%9E%D0%9F%D0%9E%D0%92%D0%90%D0%AF_%D0%9C%D0%AF%D0%A2%D0%90_1.png",
            isNew: false
        },
        {
            id: 1048,
            name: "FAFF CRANBERRY ICE (150 МГ)",
            description: "ЛЕДЯНАЯ КЛЮКВА",
            price: 500,
            quantity: 12,
            image: "https://static.insales-cdn.com/images/products/1/4430/980922702/large_Cranberry_Ice.png",
            isNew: false
        },
        {
            id: 1049,
            name: "ШОК (150 МГ) МЕНТОЛ",
            description: "ШОК (150 МГ) - МЕНТОЛ",
            price: 450,
            quantity: 8,
            image: "https://via.placeholder.com/300x200/FF5722/FFFFFF?text=ШОК+150",
            isNew: true
        },
        {
            id: 1050,
            name: "ШОК (75 МГ) ЯБЛОКО",
            description: "ШОК (75 МГ) - ЯБЛОКО",
            price: 400,
            quantity: 12,
            image: "https://via.placeholder.com/300x200/FF5722/FFFFFF?text=ШОК+75",
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
    
    document.getElementById('cancelDeliveryBtn').addEventListener('click', function() {
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

// Новая функция для показа модалки доставки поверх модалки телефона
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

// Новая функция для обновления полей ввода под тему
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

// Функция для сохранения в Google Sheets
async function saveOrderToGoogleSheets(orderData) {
    try {
        // URL вашего Google Apps Script веб-приложения
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbxEj9S2dEsu-Kpj1fO4z1gCEoNFLoeAm5C0hw1rAELttIJiJIpuLHDPorCKHVchWt-6/exec';
        
        // Добавляем секретный ключ для безопасности
        const dataToSend = {
            ...orderData,
            secret: 'iceberg2024_secure_key' // Должен совпадать с ключом в Google Apps Script
        };
        
        console.log('📤 Отправка заказа в Google Sheets:', {
            orderNumber: orderData.orderNumber,
            total: orderData.total,
            items: orderData.items_count
        });
        
        // Отправляем запрос
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Важно для Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });
        
        // При mode: 'no-cors' мы не получим ответ, но запрос будет отправлен
        console.log('✅ Заказ отправлен в Google Sheets');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Google Sheets:', error);
        
        // Альтернативный метод с использованием CORS-прокси
        try {
            console.log('🔄 Пробуем альтернативный метод отправки...');
            await saveOrderToGoogleSheetsAlternative(orderData);
            return true;
        } catch (altError) {
            console.error('❌ Альтернативный метод также не сработал:', altError);
            return false;
        }
    }
}

// Альтернативная функция на случай проблем с CORS
async function saveOrderToGoogleSheetsAlternative(orderData) {
    try {
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbxEj9S2dEsu-Kpj1fO4z1gCEoNFLoeAm5C0hw1rAELttIJiJIpuLHDPorCKHVchWt-6/exec';
        
        // Используем FormData для обхода CORS
        const formData = new FormData();
        formData.append('data', JSON.stringify({
            ...orderData,
            secret: 'iceberg2024_secure_key'
        }));
        
        const response = await fetch(scriptUrl, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            console.log('✅ Заказ сохранен (альтернативный метод)');
            return true;
        }
        throw new Error('Network response was not ok');
        
    } catch (error) {
        throw error;
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
    console.log('showPhoneConfirmationModal вызвана с orderData:', orderData);
    
    if (!orderData) {
        console.error('❌ orderData равен null или undefined');
        showNotification('Ошибка при оформлении заказа', 'error');
        return;
    }
    
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

// Функция для показа подтверждения с сохраненным номером
function showPhoneConfirmationWithSavedNumber(orderData) {
    console.log('showPhoneConfirmationWithSavedNumber вызвана с orderData:', orderData);
    
    if (!orderData) {
        console.error('❌ orderData равен null или undefined');
        showNotification('Ошибка при оформлении заказа', 'error');
        return;
    }
    
    pendingOrderData = orderData; // Сохраняем данные заказа
    
    const modal = document.createElement('div');
    modal.className = 'phone-confirmation-modal';
    modal.innerHTML = `
        <div class="phone-confirmation-content">
            <div class="phone-confirmation-header">
                <i class="fas fa-phone-alt"></i>
                <h2 class="phone-modal-title">Подтвердите заказ</h2>
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
                
                <div class="phone-confirmed-section">
                    <div class="confirmed-phone-display">
                        <i class="fas fa-check-circle"></i>
                        <div class="confirmed-phone-text">
                            <p class="confirmed-title">Ваш номер телефона:</p>
                            <p class="confirmed-number">${formatPhoneNumber(userPhoneNumber)}</p>
                            <p class="confirmed-note">Этот номер будет использован для связи по заказу</p>
                        </div>
                    </div>
                    <button class="change-phone-btn" onclick="showPhoneConfirmationModal(${JSON.stringify(orderData).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Изменить номер
                    </button>
                </div>
                
                <div class="order-summary-section">
                    <h3 class="order-summary-title"><i class="fas fa-receipt"></i> Итог заказа:</h3>
                    <div class="order-summary-details">
                        <div class="summary-detail-item">
                            <span class="detail-label">Номер заказа:</span>
                            <span class="detail-value">#${orderData.orderNumber}</span>
                        </div>
                        <div class="summary-detail-item">
                            <span class="detail-label">Товаров:</span>
                            <span class="detail-value">${orderData.items_count} шт.</span>
                        </div>
                        <div class="summary-detail-item">
                            <span class="detail-label">Сумма:</span>
                            <span class="detail-value">${orderData.total} ₽</span>
                        </div>
                    </div>
                </div>
                
                <div class="confirmation-info">
                    <p class="confirmation-info-text">
                        <i class="fas fa-shield-alt"></i>
                        <span>Нажимая "Подтвердить", вы соглашаетесь с обработкой ваших данных для выполнения заказа</span>
                    </p>
                </div>
            </div>
            <div class="phone-confirmation-footer">
                <button id="confirmWithSavedPhoneBtn" class="confirm-phone-btn">
                    <i class="fas fa-check"></i> <span class="btn-text">Подтвердить заказ</span>
                </button>
                <button id="cancelPhoneBtn" class="cancel-phone-btn">
                    <i class="fas fa-times"></i> <span class="btn-text">Отмена</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmWithSavedPhoneBtn').addEventListener('click', function() {
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
        
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        
        // Добавляем телефон к данным заказа
        orderData.userPhone = userPhoneNumber;
        if (orderData.user) {
            orderData.user.phone = userPhoneNumber;
        } else {
            orderData.user = { phone: userPhoneNumber };
        }
        
        // Завершаем оформление заказа
        completeOrderWithPhone(orderData);
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
    console.log('completeOrderWithPhone вызвана с orderData:', orderData);
    
    if (!orderData || !orderData.orderNumber) {
        console.error('❌ orderData не содержит orderNumber');
        showNotification('Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.', 'error');
        
        // Пытаемся восстановить данные заказа
        try {
            const lastOrder = orderHistory[0];
            if (lastOrder && lastOrder.orderNumber) {
                console.log('Пытаемся восстановить данные из последнего заказа:', lastOrder);
                orderData = lastOrder;
            } else {
                // Генерируем новый номер заказа
                const orderNumber = generateOrderNumber();
                orderData = {
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
                    deliveryMethod: deliveryMethod,
                    deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : null,
                    deliveryTime: deliveryMethod === 'delivery' ? deliveryTime : null,
                    deliveryNotes: deliveryMethod === 'delivery' ? deliveryNotes : null,
                    user: tg ? {
                        id: tg.initDataUnsafe.user && tg.initDataUnsafe.user.id,
                        username: tg.initDataUnsafe.user && tg.initDataUnsafe.user.username,
                        first_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name,
                        last_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.last_name
                    } : null,
                    userPhone: userPhoneNumber
                };
            }
        } catch (error) {
            console.error('❌ Не удалось восстановить данные заказа:', error);
            showNotification('Не удалось оформить заказ. Пожалуйста, свяжитесь с менеджером.', 'error');
            return;
        }
    }
    
    try {
        // Убеждаемся, что у нас есть все необходимые данные
        orderData.user = orderData.user || {};
        if (userPhoneNumber && !orderData.userPhone) {
            orderData.userPhone = userPhoneNumber;
            orderData.user.phone = userPhoneNumber;
        }
        
        if (!orderData.timestamp) {
            orderData.timestamp = new Date().toISOString();
        }
        
        // Логируем данные перед отправкой
        console.log('📤 Отправка заказа с данными:', {
            orderNumber: orderData.orderNumber,
            user: orderData.user,
            total: orderData.total,
            items: orderData.items_count,
            deliveryMethod: orderData.deliveryMethod
        });
        
        // ✅ Отправляем заказ в Telegram (если доступно)
        if (window.Telegram && window.Telegram.WebApp && orderData.orderNumber) {
            try {
                const orderDataForBot = {
                    orderNumber: orderData.orderNumber,
                    products: orderData.products || [],
                    total: orderData.total || 0,
                    items_count: orderData.items_count || 0,
                    timestamp: orderData.timestamp,
                    deliveryMethod: orderData.deliveryMethod || 'pickup',
                    deliveryAddress: orderData.deliveryAddress,
                    deliveryTime: orderData.deliveryTime,
                    deliveryNotes: orderData.deliveryNotes,
                    userPhone: orderData.userPhone
                };

                console.log("📤 Отправка в Telegram:", orderDataForBot);
                window.Telegram.WebApp.sendData(JSON.stringify(orderDataForBot));
            } catch (tgError) {
                console.warn("❌ Ошибка отправки в Telegram:", tgError);
            }
        }
        
        // Уведомляем менеджера
        const notified = await notifyManager(orderData);
        
        if (tg && tg.showAlert) {
            tg.showAlert(
                `✅ *Заказ оформлен успешно!*\n\n` +
                `📋 *Номер заказа:* #${orderData.orderNumber}\n` +
                `${userPhoneNumber ? `📞 *Ваш телефон:* ${formatPhoneNumber(userPhoneNumber)}\n` : ''}` +
                `${orderData.deliveryMethod === 'pickup' ? '🚶 *Способ:* Самовывоз' : '🏍️ *Способ:* Доставка'}\n` +
                `${orderData.deliveryMethod === 'delivery' && orderData.deliveryAddress ? `📍 *Адрес:* ${orderData.deliveryAddress}\n` : ''}` +
                `${orderData.deliveryMethod === 'delivery' && orderData.deliveryTime ? `⏰ *Время:* ${orderData.deliveryTime}\n` : ''}` +
                `📦 Товаров: ${orderData.items_count} шт.\n` +
                `💰 Сумма: ${orderData.total} руб.\n\n` +
                `👤 *Менеджер свяжется с вами в ближайшее время*\n` +
                `🔗 @Chief_68`,
                function() {
                    // Очищаем корзину
                    cart = [];
                    saveCart();
                    closeCart();
                    
                    // Показываем уведомление о менеджере
                    showManagerNotification(orderData.orderNumber);
                    
                    // Обновляем товары
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
            // Показываем модалку подтверждения заказа
            showOrderConfirmationModal(orderData, orderData.orderNumber);
            
            // Очищаем корзину
            cart = [];
            saveCart();
            closeCart();
        }
        
        // Добавляем заказ в историю
        if (orderData.orderNumber && !orderHistory.some(order => order.orderNumber === orderData.orderNumber)) {
            orderHistory.unshift({
                orderNumber: orderData.orderNumber,
                products: orderData.products || [],
                total: orderData.total || 0,
                items_count: orderData.items_count || 0,
                timestamp: orderData.timestamp,
                deliveryMethod: orderData.deliveryMethod || 'pickup',
                deliveryAddress: orderData.deliveryAddress,
                deliveryTime: orderData.deliveryTime,
                deliveryNotes: orderData.deliveryNotes,
                user: orderData.user,
                userPhone: orderData.userPhone,
                status: 'pending'
            });
            
            saveCart();
        }
        
        // Обновляем товары через некоторое время
        setTimeout(() => {
            loadAndRenderProducts();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Ошибка при завершении заказа:', error);
        showNotification('Произошла ошибка при оформлении заказа. Пожалуйста, свяжитесь с менеджером.', 'error');
    }
}

async function checkout() {
    console.log('checkout() вызвана, товаров в корзине:', cart.length);
    
    if (cart.length === 0) {
        console.log('Корзина пуста');
        return;
    }
    
    // Проверяем наличие товаров
    const unavailableItems = cart.filter(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        return !product || product.quantity <= 0;
    });
    
    if (unavailableItems.length > 0) {
        console.log('Найдены недоступные товары:', unavailableItems);
        cart = cart.filter(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            return product && product.quantity > 0;
        });
        
        saveCart();
        showNotification('Некоторые товары недоступны и были удалены из корзины', 'warning');
        return;
    }
    
    // Проверяем количество товаров
    const exceededItems = cart.filter(function(item) {
        const product = products.find(function(p) { return p.id === item.id; });
        return product && item.quantity > product.quantity;
    });
    
    if (exceededItems.length > 0) {
        console.log('Количество товаров превышает доступное:', exceededItems);
        exceededItems.forEach(function(item) {
            const product = products.find(function(p) { return p.id === item.id; });
            if (product) {
                item.quantity = product.quantity;
            }
        });
        saveCart();
        showNotification('Количество некоторых товаров было уменьшено до доступного', 'warning');
        return;
    }

    // Генерируем номер заказа
    const orderNumber = generateOrderNumber();
    console.log('Создан номер заказа:', orderNumber);
    
    // Подготавливаем данные заказа
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
        } : null,
        secret: 'iceberg2024_secure_key' // Секретный ключ для защиты
    };
    
    // Добавляем телефон пользователя, если есть
    if (userPhoneNumber) {
        orderData.userPhone = userPhoneNumber;
        if (orderData.user) {
            orderData.user.phone = userPhoneNumber;
        } else {
            orderData.user = { phone: userPhoneNumber };
        }
    }
    
    console.log('Данные заказа подготовлены:', {
        orderNumber: orderData.orderNumber,
        total: orderData.total,
        items: orderData.items_count,
        deliveryMethod: orderData.deliveryMethod
    });
    
    // Сохраняем историю заказов локально
    orderHistory.unshift({
        orderNumber: orderData.orderNumber,
        products: orderData.products,
        total: orderData.total,
        items_count: orderData.items_count,
        timestamp: orderData.timestamp,
        deliveryMethod: orderData.deliveryMethod,
        deliveryAddress: orderData.deliveryAddress,
        deliveryTime: orderData.deliveryTime,
        deliveryNotes: orderData.deliveryNotes,
        user: orderData.user,
        status: 'pending'
    });
    
    saveCart();
    
    // ✅ Сохраняем заказ в Google Sheets
    try {
        console.log('Сохранение заказа в Google Sheets...');
        const savedToSheets = await saveOrderToGoogleSheets(orderData);
        
        if (!savedToSheets) {
            console.warn('⚠️ Заказ создан, но не сохранен в Google Sheets');
            // Не показываем ошибку пользователю, чтобы не прерывать процесс
        } else {
            console.log('✅ Заказ успешно сохранен в Google Sheets');
        }
    } catch (sheetsError) {
        console.error('❌ Ошибка при сохранении в Google Sheets:', sheetsError);
        // Не прерываем процесс оформления заказа из-за ошибки сохранения
    }
    
    // Проверяем данные доставки
    const deliveryValidation = validateDeliveryInfo();
    if (!deliveryValidation.isValid) {
        console.log('Ошибка валидации доставки:', deliveryValidation.error);
        showNotification(deliveryValidation.error, 'error');
        
        // Показываем модалку выбора способа доставки
        setTimeout(() => {
            showDeliveryMethodModal();
        }, 500);
        
        return;
    }
    
    console.log('Данные доставки валидны, проверяем наличие телефона...');
    
    // Если у пользователя уже есть сохраненный номер телефона, оформляем заказ сразу
    if (userPhoneNumber) {
        console.log('У пользователя есть сохраненный телефон:', userPhoneNumber);
        // Проверяем валидность номера
        const validatedPhone = validatePhoneNumber(userPhoneNumber);
        if (validatedPhone) {
            // Показываем подтверждение с сохраненным номером
            console.log('Телефон валиден, показываем подтверждение с сохраненным номером');
            showPhoneConfirmationWithSavedNumber(orderData);
        } else {
            // Если номер невалидный, показываем форму ввода
            console.log('Телефон невалиден, показываем форму ввода');
            showPhoneConfirmationModal(orderData);
        }
    } else {
        // Если номера нет, показываем форму ввода
        console.log('Телефона нет, показываем форму ввода');
        showPhoneConfirmationModal(orderData);
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
                         onerror="this.src='https://via.placeholder.com/100x100/FF9800/FFFFFF?text=ICEBERG'}">
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
                         onerror="this.src='https://via.placeholder.com/100x100/FF9800/FFFFFF?text=ICEBERG'}">
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

// ИСПРАВЛЕННАЯ ФУНКЦИЯ - теперь нумерация начинается с 0 и увеличивается последовательно
function generateOrderNumber() {
    // Загружаем счетчик из localStorage
    let orderCounter = localStorage.getItem('iceberg_order_counter');
    
    // Если счетчика нет, начинаем с 0
    if (!orderCounter) {
        orderCounter = 0;
    } else {
        orderCounter = parseInt(orderCounter);
    }
    
    // Увеличиваем счетчик на 1
    orderCounter += 1;
    
    // Сохраняем обновленный счетчик
    localStorage.setItem('iceberg_order_counter', orderCounter.toString());
    
    // Форматируем номер заказа
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Создаем номер заказа в формате ORD-YYMMDD-XXXXX
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

function showOrderConfirmationModal(orderData, orderNumber) {
    const oldModals = document.querySelectorAll('.order-confirmation-modal, .manager-notification');
    oldModals.forEach(function(modal) { modal.remove(); });
    
    const modal = document.createElement('div');
    modal.className = 'order-confirmation-modal';
    modal.innerHTML = `
        <div class="order-confirmation-content">
            <div class="order-confirmation-header">
                <i class="fas fa-check-circle"></i>
                <h2 class="confirmation-title">Заказ оформлен!</h2>
            </div>
            <div class="order-confirmation-body">
                <div class="order-number">
                    <i class="fas fa-hashtag"></i>
                    <span class="order-number-text">Номер заказа: <strong>#${orderNumber}</strong></span>
                </div>
                <div class="order-summary">
                    <div class="order-summary-item">
                        <i class="fas fa-box"></i>
                        <span class="summary-text">Товаров: ${orderData.items_count} шт.</span>
                    </div>
                    <div class="order-summary-item">
                        <i class="fas fa-ruble-sign"></i>
                        <span class="summary-text">Сумма: ${orderData.total} руб.</span>
                    </div>
                    <div class="order-summary-item">
                        <i class="fas fa-clock"></i>
                        <span class="summary-text">Время: ${new Date(orderData.timestamp).toLocaleTimeString('ru-RU')}</span>
                    </div>
                    <div class="order-summary-item">
                        <i class="${orderData.deliveryMethod === 'pickup' ? 'fas fa-store' : 'fas fa-motorcycle'}"></i>
                        <span class="summary-text">Способ: ${orderData.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</span>
                    </div>
                    ${userPhoneNumber ? `
                    <div class="order-summary-item">
                        <i class="fas fa-phone"></i>
                        <span class="summary-text">Телефон: ${formatPhoneNumber(userPhoneNumber)}</span>
                    </div>
                    ` : ''}
                </div>
                ${orderData.deliveryMethod === 'delivery' ? `
                <div class="delivery-details">
                    <h3 class="delivery-details-title">Детали доставки:</h3>
                    <div class="delivery-info">
                        <p class="delivery-info-item"><strong class="delivery-label">Адрес:</strong> <span class="delivery-value">${orderData.deliveryAddress || 'Не указан'}</span></p>
                        <p class="delivery-info-item"><strong class="delivery-label">Время:</strong> <span class="delivery-value">${orderData.deliveryTime || 'Не указано'}</span></p>
                        ${orderData.deliveryNotes ? `<p class="delivery-info-item"><strong class="delivery-label">Комментарий:</strong> <span class="delivery-value">${orderData.deliveryNotes}</span></p>` : ''}
                    </div>
                </div>
                ` : ''}
                <div class="order-products">
                    <h3 class="products-title">Состав заказа:</h3>
                    <ul class="products-list">
                        ${orderData.products.map(function(item) {
                            return `
                                <li class="product-item">${item.name} × ${item.quantity} шт. = ${item.price * item.quantity} руб.</li>
                            `;
                        }).join('')}
                    </ul>
                </div>
                <div class="order-instructions">
                    <p class="instruction-item"><i class="fas fa-info-circle"></i> <span class="instruction-text">Сохраните номер заказа для связи с менеджером</span></p>
                    <p class="instruction-item"><i class="fas fa-truck"></i> <span class="instruction-text">${orderData.deliveryMethod === 'pickup' ? 'Самовывоз - забирайте заказ самостоятельно' : 'Доставка - курьер свяжется с вами'}</span></p>
                </div>
            </div>
            <div class="order-confirmation-footer">
                <button class="close-order-modal">
                    <i class="fas fa-times"></i> <span class="close-btn-text">Закрыть</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(function() {
        showManagerNotification(orderNumber);
    }, 1000);
    
    const closeBtn = modal.querySelector('.close-order-modal');
    closeBtn.addEventListener('click', function() {
        modal.style.opacity = '0';
        setTimeout(function() { modal.remove(); }, 300);
    });
    
    setTimeout(function() {
        if (document.body.contains(modal)) {
            modal.style.opacity = '0';
            setTimeout(function() { modal.remove(); }, 300);
        }
    }, 10000);
}

function showManagerNotification(orderNumber) {
    const oldNotifications = document.querySelectorAll('.manager-notification');
    oldNotifications.forEach(function(n) { n.remove(); });
    
    const notification = document.createElement('div');
    notification.className = 'manager-notification';
    notification.innerHTML = `
        <div class="manager-notification-content">
            <div class="manager-notification-icon">
                <i class="fas fa-comment-alt"></i>
            </div>
            <div class="manager-notification-text">
                <h3 class="notification-title">Напишите менеджеру</h3>
                <p class="notification-message">Сообщите номер заказа <strong>#${orderNumber}</strong></p>
                <p class="manager-username">👤 @Chief_68</p>
            </div>
            <button class="manager-notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="manager-notification-action">
            <button class="contact-manager-btn" onclick="openManagerChat('${orderNumber}')">
                <i class="fab fa-telegram"></i> <span class="contact-btn-text">Написать менеджеру</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    const closeBtn = notification.querySelector('.manager-notification-close');
    closeBtn.addEventListener('click', function() {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
        setTimeout(function() { notification.remove(); }, 300);
    });
    
    setTimeout(function() {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(100%)';
            setTimeout(function() { notification.remove(); }, 300);
        }
    }, 30000);
}

function openManagerChat(orderNumber) {
    const message = '*НОВЫЙ ЗАКАЗ #' + orderNumber + '*\n\n' +
                   '👤 *Покупатель:*\n' +
                   'ID: \n' +
                   '@ \n' +
                   'Имя: \n' +
                   'Фамилия: \n' +
                   '📞 *Номер телефона клиента:* ' + (userPhoneNumber || 'Не указан') + '\n\n' +
                   '🚚 *Способ получения:* ' + (deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка') + '\n' +
                   (deliveryMethod === 'delivery' ? '📍 *Адрес доставки:* ' + (deliveryAddress || 'Не указан') + '\n' : '') +
                   (deliveryMethod === 'delivery' ? '⏰ *Время доставки:* ' + (deliveryTime || 'Не указано') + '\n' : '') +
                   '\n📅 *Дата:* ' + new Date().toLocaleString('ru-RU') + '\n\n' +
                   '🛒 *Товары:*\n' +
                   'Заказ #' + orderNumber + '\n\n' +
                   '⚡️ *Статус:* Ожидает обработки\n' +
                   '🔗 Для связи: @Chief_68\n\n' +
                   '📋 *Номер заказа:* #' + orderNumber;
    
    const managerUsername = 'Chief_68';
    
    const tgLink = 'https://t.me/' + managerUsername + '?text=' + encodeURIComponent(message);
    
    if (tg && tg.openLink) {
        tg.openLink(tgLink);
    } else {
        window.open(tgLink, '_blank');
    }
    
    const notification = document.querySelector('.manager-notification');
    if (notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(100%)';
        setTimeout(function() { notification.remove(); }, 300);
    }
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
                         onerror="this.src='https://via.placeholder.com/50x50/FF9800/FFFFFF?text=ICEBERG'}">
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

window.addEventListener('beforeunload', stopAutoUpdate);

