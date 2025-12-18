// mobile_fix.js
// Дополнительные исправления для мобильных устройств

(function() {
    'use strict';
    
    // 1. Исправляем сетку товаров
    function fixProductGrid() {
        const catalog = document.querySelector('.catalog');
        if (!catalog) return;
        
        // Всегда устанавливаем 2 колонки
        catalog.style.gridTemplateColumns = 'repeat(2, 1fr)';
        catalog.style.gap = '12px';
        
        // Проверяем ширину экрана
        const screenWidth = window.innerWidth;
        if (screenWidth < 360) {
            // Для очень маленьких экранов уменьшаем отступы
            catalog.style.gap = '8px';
        }
        
        console.log('✅ Сетка товаров исправлена: 2 колонки');
    }
    
    // 2. Оптимизируем изображения для мобильных
    function optimizeImages() {
        const images = document.querySelectorAll('.product-image');
        images.forEach(img => {
            // Устанавливаем атрибуты для ленивой загрузки
            img.loading = 'lazy';
            img.decoding = 'async';
            
            // Добавляем обработчик ошибок
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/300x200/0B5B8A/FFFFFF?text=ICEBERG';
                this.onerror = null;
            };
        });
    }
    
    // 3. Улучшаем кнопки для касаний
    function improveButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            // Увеличиваем область касания
            btn.style.minHeight = '44px';
            btn.style.minWidth = '44px';
            
            // Убираем выделение при касании
            btn.style.webkitTapHighlightColor = 'transparent';
            btn.style.webkitUserSelect = 'none';
            btn.style.userSelect = 'none';
            
            // Добавляем активное состояние
            btn.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            
            btn.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
    }
    
    // 4. Предотвращаем масштабирование
    function preventZoom() {
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    // 5. Исправляем 100vh на мобильных
    function fixViewportHeight() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }
    
    // 6. Проверка WebView Telegram
    function checkTelegramWebView() {
        const isTelegram = /Telegram/.test(navigator.userAgent) || window.Telegram?.WebApp;
        if (isTelegram) {
            console.log('✅ Запущено в Telegram WebView');
            
            // Добавляем класс для специфичных стилей
            document.body.classList.add('telegram-webview');
            
            // Исправляем высоту для Telegram WebView
            if (window.Telegram?.WebApp) {
                const tg = window.Telegram.WebApp;
                tg.expand();
                
                // Устанавливаем безопасную зону
                const safeArea = tg.viewportStableHeight || window.innerHeight;
                document.documentElement.style.setProperty('--safe-area', `${safeArea}px`);
            }
        }
    }
    
    // 7. Исправление прокрутки на iOS
    function fixIOSScroll() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Исправляем фиксированную позицию на iOS
            const fixFixedPosition = () => {
                document.querySelectorAll('.header, .cart-footer').forEach(el => {
                    el.style.position = '-webkit-sticky';
                });
            };
            
            fixFixedPosition();
            window.addEventListener('scroll', fixFixedPosition);
        }
    }
    
    // 8. Запускаем все исправления
    function applyAllFixes() {
        console.log('🛠️ Применение исправлений для мобильных...');
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyFixes);
        } else {
            applyFixes();
        }
        
        function applyFixes() {
            setTimeout(() => {
                fixProductGrid();
                optimizeImages();
                improveButtons();
                fixViewportHeight();
                checkTelegramWebView();
                fixIOSScroll();
                
                // Запускаем еще раз через секунду для уверенности
                setTimeout(fixProductGrid, 1000);
                
                console.log('✅ Все исправления применены');
            }, 100);
        }
    }
    
    // Запускаем при загрузке
    applyAllFixes();
    
    // Также запускаем при изменении размера
    window.addEventListener('resize', fixProductGrid);
    window.addEventListener('orientationchange', function() {
        setTimeout(fixProductGrid, 100);
    });
    
    // Экспортируем функцию для ручного вызова
    window.mobileFix = {
        fixProductGrid,
        optimizeImages,
        improveButtons,
        applyAllFixes
    };
    
})();
