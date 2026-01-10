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
                <h2>Подтвердите номер телефона</h2>
            </div>
            <div class="phone-confirmation-body">
                <div class="phone-input-group">
                    <label for="phoneInput">Номер телефона для связи:</label>
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
                        Пример: 912 345-67-89
                    </div>
                    <div id="phoneError" class="phone-validation-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Введите корректный номер телефона</span>
                    </div>
                </div>
                
                <div class="phone-info">
                    <p>
                        <i class="fas fa-shield-alt"></i>
                        Номер нужен для связи менеджера по поводу заказа. 
                        Мы не передаём его третьим лицам и не используем для спама.
                    </p>
                </div>
            </div>
            <div class="phone-confirmation-footer">
                <button id="confirmPhoneBtn" class="confirm-phone-btn">
                    <i class="fas fa-check"></i> Подтвердить и отправить заказ
                </button>
                <button id="cancelPhoneBtn" class="cancel-phone-btn">
                    <i class="fas fa-times"></i> Отмена
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
        
        savePhoneNumber(validatedPhone);
        
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        
        pendingOrderData.userPhone = validatedPhone;
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
        
        const notified = await notifyManager(orderData);
        
        if (tg && tg.showAlert) {
            tg.showAlert(
                `✅ *Заказ оформлен успешно!*\n\n` +
                `📋 *Номер заказа:* #${orderData.orderNumber}\n` +
                `📞 *Ваш телефон:* ${formatPhoneNumber(userPhoneNumber)}\n` +
                `📦 Товаров: ${orderData.items_count} шт.\n` +
                `💰 Сумма: ${orderData.total} руб.\n\n` +
                `👤 *Менеджер свяжется с вами в ближайшее время*\n` +
                `🔗 @Chief_68`,
                function() {
                    cart = [];
                    saveCart();
                    closeCart();
                    
                    showManagerNotification(orderData.orderNumber);
                    
                    setTimeout(() => {
                        loadAndRenderProducts();
                    }, 2000);
                }
            );
        } else {
            showOrderConfirmationModal(orderData, orderData.orderNumber);
            
            cart = [];
            saveCart();
            closeCart();
        }
        
        setTimeout(() => {
            loadAndRenderProducts();
        }, 3000);
        
    } catch (error) {
        console.error('Error completing order with phone:', error);
    }
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem('iceberg_cart');
        cart = savedCart ? JSON.parse(savedCart) : [];
        
        const savedOrders = localStorage.getItem('iceberg_orders');
        orderHistory = savedOrders ? JSON.parse(savedOrders) : [];
        
    } catch (error) {
        console.error('Error loading cart:', error);
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
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return 'ORD-' + year + month + day + '-' + random;
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
                        timestamp: orderData.timestamp
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
                <h3>iOS инструкция</h3>
            </div>
            <div class="ios-notification-body">
                <p>Для подтверждения заказа <strong>#${orderNumber}</strong>:</p>
                <ol>
                    <li>Нажмите кнопку "Открыть Telegram"</li>
                    <li>Нажмите "Send" в открывшемся окне</li>
                    <li>Ожидайте ответа от менеджера</li>
                </ol>
            </div>
            <div class="ios-notification-footer">
                <button class="ios-open-tg" onclick="window.open('${tgLink}', '_blank')">
                    <i class="fab fa-telegram"></i> Открыть Telegram
                </button>
                <button class="ios-copy-number" onclick="navigator.clipboard.writeText('#${orderNumber}')">
                    <i class="fas fa-copy"></i> Копировать номер
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
        <span>Написать менеджеру</span>
        <small>Заказ #${orderNumber}</small>
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
                    ${userPhoneNumber ? `
                    <div class="order-summary-item">
                        <i class="fas fa-phone"></i>
                        <span>Телефон: ${formatPhoneNumber(userPhoneNumber)}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="order-products">
                    <h3>Состав заказа:</h3>
                    <ul>
                        ${orderData.products.map(function(item) {
                            return `
                                <li>${item.name} × ${item.quantity} шт. = ${item.price * item.quantity} руб.</li>
                            `;
                        }).join('')}
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
                <h3>Напишите менеджеру</h3>
                <p>Сообщите номер заказа <strong>#${orderNumber}</strong></p>
                <p class="manager-username">👤 @Chief_68</p>
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
                   '📅 *Дата:* ' + new Date().toLocaleString('ru-RU') + '\n\n' +
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
        user: tg ? {
            id: tg.initDataUnsafe.user && tg.initDataUnsafe.user.id,
            username: tg.initDataUnsafe.user && tg.initDataUnsafe.user.username,
            first_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name,
            last_name: tg.initDataUnsafe.user && tg.initDataUnsafe.user.last_name
        } : null
    };
    
    orderHistory.unshift({
        orderNumber: orderData.orderNumber,
        products: orderData.products,
        total: orderData.total,
        items_count: orderData.items_count,
        timestamp: orderData.timestamp,
        user: orderData.user,
        status: 'pending'
    });
    
    saveCart();
    
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
    
    // Функция поиска с подсветкой
    function highlightText(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    // Функция выполнения поиска
    function performSearch(query) {
        if (!query || query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        searchResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner"></i> Поиск...</div>';
        searchResults.style.display = 'block';
        
        // Задержка для оптимизации
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
    
    // Отображение результатов поиска
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
    
    // Обработчики событий
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
    
    // Закрытие результатов поиска при клике вне
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
    
    // Показать результаты при фокусе, если есть текст
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 2) {
            performSearch(searchInput.value);
        }
    });
}

// Функция добавления в корзину из поиска
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

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
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

// Обновленная функция инициализации
const originalInitApp = initApp;
initApp = async function() {
    await originalInitApp();
    initSearch();
};

async function initApp() {
    detectTheme();
    initTelegram();
    
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
    
    initCategoriesScroll();
    initKeyboardNavigation();
    
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

