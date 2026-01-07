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
let isAddingToCart = false; // Флаг для предотвращения двойного добавления

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
        keywords: ['шок', 'shok'],
        subCategories: [
            { id: 'shok150', name: 'ШОК (150 МГ)', keywords: ['шок 150', 'shok 150', '150 мг шок'] },
            { id: 'shok75', name: 'ШОК (75 МГ)', keywords: ['шок 75', 'shok 75', '75 мг шок'] },
            { id: 'shokbyx', name: 'ШОК BY X', keywords: ['by x', 'шок by x'] }
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
            { id: 'ice75s', name: 'ICEBERG STRONG (75 МГ)', keywords: ['strong', '75 мг strong'] },
            { id: 'ice75t', name: 'ICEBERG TRIANGLES (75 МГ)', keywords: ['triangles', 'треугольник'] },
            { id: 'ice100', name: 'ICEBERG EXTRA STRONG (100 МГ)', keywords: ['extra strong', '100 мг'] },
            { id: 'ice110', name: 'ICEBERG EXTREME (110 МГ)', keywords: ['extreme', '110 мг'] },
            { id: 'ice150', name: 'ICEBERG ULTRA (150 МГ)', keywords: ['ultra', '150 мг'] }
        ]
    },
    { 
        id: 'faff', 
        name: '🐉 FAFF', 
        icon: 'fas fa-dragon', 
        color: '#E91E63',
        keywords: ['faff', 'фафф'],
        subCategories: [
            { id: 'faff65', name: 'FAFF (65 МГ)', keywords: ['65 мг faff', 'faff 65'] },
            { id: 'faff75', name: 'FAFF (75 МГ)', keywords: ['75 мг faff', 'faff 75'] },
            { id: 'faff100', name: 'FAFF (100 МГ)', keywords: ['100 мг faff', 'faff 100'] },
            { id: 'faff150', name: 'FAFF (150 МГ)', keywords: ['150 мг faff', 'faff 150'] }
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
                    <div class="subcategory-grid">
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
            `;
            updateSelectedPath();
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
        ` : ''}
    `;
    
    updateSelectedPath();
    initCategoriesScroll();
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
    if (!category || !category.keywords) {
        return productsToFilter;
    }
    
    let filtered = productsToFilter.filter(function(product) {
        const productName = product.name.toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        const searchText = productName + ' ' + productDesc;
        
        return category.keywords.some(function(keyword) {
            return searchText.includes(keyword.toLowerCase());
        });
    });
    
    if (currentSubCategory && category.subCategories) {
        const subCategory = category.subCategories.find(function(s) { return s.id === currentSubCategory; });
        if (subCategory && subCategory.keywords) {
            filtered = filtered.filter(function(product) {
                const productName = product.name.toLowerCase();
                const productDesc = (product.description || '').toLowerCase();
                const searchText = productName + ' ' + productDesc;
                
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
            throw new Error('Ошибка загрузки: ' + response.status);
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
            name: "ШОК (150 МГ) МЕНТОЛ",
            description: "ШОК (150 МГ) - МЕНТОЛ",
            price: 450,
            quantity: 8,
            image: "https://via.placeholder.com/300x200/FF5722/FFFFFF?text=ШОК+150",
            isNew: true
        },
        {
            id: 4,
            name: "ШОК (75 МГ) ЯБЛОКО",
            description: "ШОК (75 МГ) - ЯБЛОКО",
            price: 400,
            quantity: 12,
            image: "https://via.placeholder.com/300x200/FF5722/FFFFFF?text=ШОК+75",
            isNew: false
        },
        {
            id: 5,
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
    // Защита от двойного добавления
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
    
    // Блокируем кнопку на короткое время
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
        
        // Создаем простое сообщение для открытия в Telegram
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

