import logging
import json
import os
import requests
import base64
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from datetime import datetime, date, timedelta
from collections import defaultdict
import math
import time

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

BOT_TOKEN = "8524553480:AAHlSe0qo7kbdFMZiOFDlhe6BrVxGEJe5UM"
CONFIG_FILE = "config.json"
PRODUCTS_FILE = "products.json"
SALES_FILE = "sales_data.json"
PRODUCTS_PER_PAGE = 10

products_cache = None
products_cache_time = 0
CACHE_TIMEOUT = 5

def load_config():
    default_config = {
        "admins": [],
        "github_token": "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",
        "webapp_url": "https://raw.githack.com/sashaG7658/lavkatest/main/index.html",
        "last_product_id": 6,
        "bot_started": False
    }
    
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                logger.info(f"Конфиг загружен из {CONFIG_FILE}")
                return config
        else:
            logger.info(f"Создаю новый конфиг файл {CONFIG_FILE}")
            save_config(default_config)
            return default_config
    except Exception as e:
        logger.error(f"Ошибка загрузки конфига: {e}")
        save_config(default_config)
        return default_config

def save_config(config):
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        logger.info(f"Конфиг сохранен в {CONFIG_FILE}")
        return True
    except Exception as e:
        logger.error(f"Ошибка сохранения конфига: {e}")
        return False

config = load_config()
ADMINS = config.get("admins", [])
GITHUB_TOKEN = config.get("github_token", "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")
WEB_APP_URL = config.get("webapp_url", "https://raw.githack.com/sashaG7658/lavkatest/main/index.html")
GITHUB_REPO = "sashaG7658/lavkatest"
GITHUB_FILE_PATH = "products.json"

def add_admin(user_id, username=None):
    if user_id not in ADMINS:
        ADMINS.append(user_id)
        config["admins"] = ADMINS
        save_config(config)
        logger.info(f"Добавлен админ: ID {user_id}, @{username if username else 'без username'}")
        return True
    return False

def remove_admin(user_id):
    if user_id in ADMINS:
        ADMINS.remove(user_id)
        config["admins"] = ADMINS
        save_config(config)
        logger.info(f"Удален админ: ID {user_id}")
        return True
    return False

def is_admin(user_id, username=None):
    if user_id in ADMINS:
        return True
    
    if username and username.lower() == "chief_68":
        add_admin(user_id, username)
        return True
    
    return False

def get_next_product_id():
    products = load_products_cached()
    if products:
        return max(p['id'] for p in products) + 1
    return 1

def download_from_github():
    try:
        if GITHUB_TOKEN == "ваш_github_token_здесь":
            logger.warning("GitHub токен не настроен, пропускаю загрузку из GitHub")
            return False, "GitHub токен не настроен"
        
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_FILE_PATH}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        logger.info(f"Загружаю товары из GitHub: {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            content = response.json()
            content_b64 = content.get("content", "")
            
            if content_b64:
                content_decoded = base64.b64decode(content_b64).decode('utf-8')
                products = json.loads(content_decoded)
                
                with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(products, f, ensure_ascii=False, indent=2)
                
                logger.info(f"Загружено {len(products)} товаров из GitHub")
                
                if products:
                    last_id = max(p['id'] for p in products)
                    config["last_product_id"] = last_id
                    save_config(config)
                
                global products_cache, products_cache_time
                products_cache = products
                products_cache_time = time.time()
                
                return True, f"Загружено {len(products)} товаров из GitHub"
            else:
                logger.error("Не удалось получить содержимое файла из GitHub")
                return False, "Не удалось получить содержимое файла"
        elif response.status_code == 404:
            logger.warning("Файл не найден на GitHub, создаю начальные товары")
            initial_products = get_initial_products()
            save_products(initial_products)
            return True, "Созданы начальные товары (файл не найден на GitHub)"
        else:
            logger.error(f"Ошибка GitHub API: {response.status_code} - {response.text}")
            return False, f"GitHub API: {response.status_code}"
            
    except Exception as e:
        logger.error(f"Ошибка загрузки из GitHub: {e}")
        return False, f"Ошибка: {str(e)}"

def get_initial_products():
    return [
        {
            "id": 1,
            "name": "ICEBERG ULTRA MENTHOL",
            "description": "ICEBERG ULTRA MENTHOL (150 МГ) - МЕНТОЛ",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        },
        {
            "id": 2,
            "name": "ICEBERG ULTRA BLACK (150 МГ)",
            "description": "ICEBERG ULTRA BLACK (150 МГ) - ЖВАЧКА ТУТТИ-ФРУТТИ",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/4138/629641258/large_418EE6C0-080A-4F12-85FC-011F55E19F86.jpg",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        },
        {
            "id": 3,
            "name": "ICEBERG ULTRA CRAZY MIX",
            "description": "ICEBERG ULTRA CRAZY MIX (150 МГ) - МУЛЬТИФРУКТ, ЦИТРУС",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/4960/629642080/large_36DE056D-C798-404C-A1A4-098A258FFE2B.jpg",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        },
        {
            "id": 4,
            "name": "ICEBERG ULTRA EMERALD",
            "description": "ICEBERG ULTRA EMERALD (150 МГ) - ЗЕЛЕНОЕ ЯБЛОКО, ЛАЙМ",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/5090/629642210/large_E205F534-FC22-4962-AFE3-BB71710AF3F0.jpg",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        },
        {
            "id": 5,
            "name": "ICEBERG ULTRA DRAGONFIRE",
            "description": "ICEBERG ULTRA DRAGONFIRE - АРОМАТ ЦВЕТОВ",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/5177/629642297/large_3097AA0C-00E1-47C7-BDFC-0EA9EA9E1E75.jpg",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        },
        {
            "id": 6,
            "name": "ICEBERG ULTRA DOUBLE MINT",
            "description": "ICEBERG ULTRA DOUBLE MINT (150 МГ) - ДВОЙНАЯ МЯТА",
            "price": 500,
            "quantity": 10,
            "image": "https://static.insales-cdn.com/images/products/1/503/746127863/large_IMG_1491.JPG",
            "category": "iceberg",
            "added_by": "system",
            "added_date": "2025-12-18 00:00:00"
        }
    ]

def load_products_cached():
    global products_cache, products_cache_time
    
    current_time = time.time()
    
    if products_cache is not None and (current_time - products_cache_time) < CACHE_TIMEOUT:
        return products_cache
    
    try:
        if os.path.exists(PRODUCTS_FILE):
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                products = json.load(f)
                
                if isinstance(products, list) and products:
                    logger.info(f"Загружено {len(products)} товаров из локального файла")
                    
                    last_id = max(p['id'] for p in products)
                    config["last_product_id"] = last_id
                    save_config(config)
                    
                    for product in products:
                        if 'quantity' not in product:
                            product['quantity'] = 10
                        if 'category' not in product:
                            product['category'] = 'other'
                    
                    products_cache = products
                    products_cache_time = current_time
                    
                    return products
                else:
                    logger.warning("Локальный файл пуст или поврежден, пытаюсь загрузить из GitHub")
                    success, message = download_from_github()
                    if success:
                        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                            products = json.load(f)
                            logger.info(f"Загружено {len(products)} товаров после синхронизации с GitHub")
                            
                            products_cache = products
                            products_cache_time = current_time
                            
                            return products
                    else:
                        logger.error(f"Не удалось загрузить из GitHub: {message}")
                        initial_products = get_initial_products()
                        
                        products_cache = initial_products
                        products_cache_time = current_time
                        
                        return initial_products
        else:
            logger.info(f"Локальный файл {PRODUCTS_FILE} не найден, пытаюсь загрузить из GitHub")
            success, message = download_from_github()
            if success:
                with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                    products = json.load(f)
                    logger.info(f"Загружено {len(products)} товаров после синхронизации с GitHub")
                    
                    products_cache = products
                    products_cache_time = current_time
                    
                    return products
            else:
                logger.error(f"Не удалось загрузить из GitHub: {message}")
                logger.info("Создаю начальные товары локально")
                initial_products = get_initial_products()
                save_products(initial_products)
                
                products_cache = initial_products
                products_cache_time = current_time
                
                return initial_products
            
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        success, message = download_from_github()
        if success:
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                products = json.load(f)
                
                products_cache = products
                products_cache_time = current_time
                
                return products
        else:
            initial_products = get_initial_products()
            
            products_cache = initial_products
            products_cache_time = current_time
            
            return initial_products
    except Exception as e:
        logger.error(f"Ошибка загрузки товаров: {e}")
        initial_products = get_initial_products()
        
        products_cache = initial_products
        products_cache_time = current_time
        
        return initial_products

def load_products():
    return load_products_cached()

def save_products(products):
    try:
        sorted_products = sorted(products, key=lambda x: x['id'])
        
        if sorted_products:
            last_id = sorted_products[-1]['id']
            config["last_product_id"] = last_id
            save_config(config)
        
        with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(sorted_products, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Сохранено {len(products)} товаров в {PRODUCTS_FILE}")
        
        global products_cache, products_cache_time
        products_cache = sorted_products
        products_cache_time = time.time()
        
        return True
        
    except Exception as e:
        logger.error(f"Ошибка сохранения товаров: {e}")
        return False

def upload_to_github(products):
    try:
        if GITHUB_TOKEN == "ваш_github_token_здесь":
            return False, "GitHub токен не настроен"
        
        url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{GITHUB_FILE_PATH}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        response = requests.get(url, headers=headers)
        sha = response.json().get("sha") if response.status_code == 200 else None
        
        content = json.dumps(products, ensure_ascii=False, indent=2)
        content_b64 = base64.b64encode(content.encode('utf-8')).decode('utf-8')
        
        data = {
            "message": f"Обновление товаров (ID до {products[-1]['id'] if products else 0})",
            "content": content_b64
        }
        if sha:
            data["sha"] = sha
        
        response = requests.put(url, headers=headers, json=data)
        
        if response.status_code in [200, 201]:
            logger.info(f"Файл загружен на GitHub: {len(products)} товаров")
            return True, "Обновлено на GitHub"
        else:
            logger.error(f"GitHub API: {response.status_code}")
            return False, f"GitHub: {response.status_code}"
            
    except Exception as e:
        logger.error(f"Ошибка GitHub: {e}")
        return False, f"Ошибка: {str(e)}"

async def send_to_webapp(product):
    try:
        logger.info(f"Товар {product['id']} отправлен в WebApp")
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки в WebApp: {e}")
        return False

async def handle_webapp_data(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        if not update.message or not update.message.web_app_data:
            return
        
        data_str = update.message.web_app_data.data
        order_data = json.loads(data_str)
        
        user = update.effective_user
        logger.info(f"Заказ от пользователя {user.id} (@{user.username})")
        
        products = load_products_cached()
        order_items = order_data.get('products', [])
        updated_items = []
        
        for order_item in order_items:
            product_id = order_item.get('id')
            quantity = order_item.get('quantity', 1)
            
            for product in products:
                if product['id'] == product_id:
                    old_qty = product.get('quantity', 0)
                    new_qty = max(0, old_qty - quantity)
                    product['quantity'] = new_qty
                    
                    updated_items.append({
                        'id': product_id,
                        'name': product['name'],
                        'old_qty': old_qty,
                        'new_qty': new_qty,
                        'quantity': quantity
                    })
                    break
        
        save_products(products)

        github_message = ""
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            success, msg = upload_to_github(products)
            github_message = f"\nGitHub: {msg}"
        
        total_price = order_data.get('total', 0)
        total_items = sum(item.get('quantity', 0) for item in order_items)
        
        message = f"НОВЫЙ ЗАКАЗ!\n\n"
        message += f"Покупатель: {user.first_name}\n"
        message += f"ID: {user.id}\n"
        message += f"@{user.username if user.username else 'нет username'}\n\n"
        message += f"Товаров: {total_items} шт.\n"
        message += f"Сумма: {total_price} руб.\n\n"
        
        if updated_items:
            message += "Обновлены остатки:\n"
            for item in updated_items:
                message += f"• {item['name']}: {item['old_qty']} → {item['new_qty']} шт. (-{item['quantity']})\n"
            message += "\n"
        
        message += f"Время: {update.message.date.strftime('%Y-%m-%d %H:%M:%S')}\n"
        message += github_message
        
        for admin_id in ADMINS:
            try:
                await context.bot.send_message(
                    chat_id=admin_id,
                    text=message
                )
                logger.info(f"Уведомление отправлено админу {admin_id}")
            except Exception as e:
                logger.error(f"Ошибка отправки админу {admin_id}: {e}")
        
        await update.message.reply_text(
            f"Заказ оформлен!\n\n"
            f"Товаров: {total_items} шт.\n"
            f"Сумма: {total_price} руб.\n\n"
            f"Свяжитесь с продавцом для уточнения деталей:\n"
            f"@Chief_68\n\n"
            f"Остатки обновлены автоматически",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Продолжить покупки", callback_data="back_to_start")]])
        )
        
        logger.info(f"Заказ обработан: {total_items} товаров на {total_price} руб.")
        
    except json.JSONDecodeError as e:
        logger.error(f"Ошибка парсинга JSON: {e}")
        await update.message.reply_text("Ошибка обработки заказа")
    except Exception as e:
        logger.error(f"Ошибка обработки заказа: {e}")
        await update.message.reply_text("Произошла ошибка при обработке заказа")

async def show_products_json(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    try:
        products = load_products_cached()
        
        message = "Содержимое products.json:\n\n"
        
        for product in products:
            qty = product.get('quantity', 0)
            emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
            status = "Много" if qty > 5 else "Мало" if qty > 0 else "Нет в наличии"
            
            message += f"{emoji} ID {product['id']}\n"
            message += f"   name: {product['name']}\n"
            message += f"   category: {product.get('category', 'other')}\n"
            message += f"   price: {product['price']}\n"
            message += f"   quantity: {qty} ({status})\n"
            message += f"   description: {product['description'][:30]}...\n\n"
        
        message += f"Всего товаров: {len(products)}\n"
        message += f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n\n"
        message += "🟢 >5 шт. | 🟡 ≤5 шт. | 🔴 Нет в наличии"
        
        raw_json = json.dumps(products, ensure_ascii=False, indent=2)
        
        if len(raw_json) > 4000:
            with open(PRODUCTS_FILE, 'rb') as f:
                await query.message.reply_document(
                    document=f,
                    caption="Файл products.json"
                )
            
            keyboard = [[InlineKeyboardButton("Назад", callback_data="admin_panel")]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                "Файл products.json отправлен как документ\n\n"
                f"Товаров: {len(products)}\n"
                f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.",
                reply_markup=reply_markup,
                parse_mode='HTML'
            )
        else:
            keyboard = [
                [InlineKeyboardButton("Скачать файл", callback_data="download_products_json")],
                [InlineKeyboardButton("Назад", callback_data="admin_panel")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                message,
                reply_markup=reply_markup,
                parse_mode='HTML'
            )
        
    except Exception as e:
        logger.error(f"Ошибка показа products.json: {e}")
        await query.edit_message_text(f"Ошибка: {str(e)}")

async def download_products_json(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    try:
        with open(PRODUCTS_FILE, 'rb') as f:
            await query.message.reply_document(
                document=f,
                caption="Файл products.json"
            )
        
        await query.answer("Файл отправлен")
        
    except Exception as e:
        logger.error(f"Ошибка отправки файла: {e}")
        await query.answer("Ошибка отправки файла")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        if user.username and user.username.lower() == "chief_68":
            add_admin(user.id, user.username)
    
    keyboard = [[
        InlineKeyboardButton(
            text="Открыть LAVKA Shop",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )
    ]]
    
    if is_admin(user.id, user.username):
        products = load_products_cached()
        total_value = sum(p['price'] * p.get('quantity', 0) for p in products)
        total_qty = sum(p.get('quantity', 0) for p in products)
        
        keyboard.append([
            InlineKeyboardButton("Админ-панель", callback_data="admin_panel"),
        ])
        keyboard.append([
            InlineKeyboardButton("Товары", callback_data="list_products"),
            InlineKeyboardButton("Остатки", callback_data="manage_quantity")
        ])
        keyboard.append([
            InlineKeyboardButton("Категории", callback_data="categories_menu"),
            InlineKeyboardButton("Быстрое добавление", callback_data="quick_add")
        ])
        keyboard.append([
            InlineKeyboardButton("Помощь", callback_data="help_admin"),
            InlineKeyboardButton("О боте", callback_data="about")
        ])
        
        await update.message.reply_text(
            f"LAVKA Shop\n\n"
            f"Привет, {user.first_name}!\n"
            f"ID: {user.id}\n"
            f"@{user.username if user.username else 'нет'}\n"
            f"Админ: ✅\n\n"
            f"Товаров: {len(products)} шт.\n"
            f"Общий остаток: {total_qty} шт.\n"
            f"Категорий: {len(set(p.get('category', 'other') for p in products))}\n"
            f"Последний ID: {config.get('last_product_id', 0)}\n"
            f"Для покупок используйте кнопку ниже:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    else:
        keyboard.append([
            InlineKeyboardButton("Связь", url="https://t.me/Chief_68"),
            InlineKeyboardButton("О боте", callback_data="about")
        ])
        
        await update.message.reply_text(
            f"Добро пожаловать в LAVKA Shop!\n\n"
            f"Привет, {user.first_name}!\n\n"
            f"Для покупок используйте кнопку ниже:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    user = query.from_user
    
    if not is_admin(user.id, user.username):
        await query.edit_message_text("У вас нет прав администратора!")
        return
    
    products = load_products_cached()
    admins_count = len(ADMINS)
    total_qty = sum(p.get('quantity', 0) for p in products)
    low_qty = sum(1 for p in products if p.get('quantity', 0) <= 5 and p.get('quantity', 0) > 0)
    out_of_stock = sum(1 for p in products if p.get('quantity', 0) <= 0)
    categories_count = len(set(p.get('category', 'other') for p in products))
    
    keyboard = [
        [
            InlineKeyboardButton("Добавить товар", callback_data="add_product"),
            InlineKeyboardButton("Список товаров", callback_data="list_products")
        ],
        [
            InlineKeyboardButton("Остатки", callback_data="manage_quantity"),
            InlineKeyboardButton("Категории", callback_data="categories_menu")
        ],
        [
            InlineKeyboardButton("Продажи", callback_data="sales_stats"),
            InlineKeyboardButton("products.json", callback_data="show_products_json")
        ],
        [
            InlineKeyboardButton("Админы", callback_data="manage_admins"),
            InlineKeyboardButton("Настройки", callback_data="settings")
        ],
        [
            InlineKeyboardButton("GitHub", callback_data="sync_github"),
        ],
        [
            InlineKeyboardButton("Помощь", callback_data="help_admin")
        ],
        [
            InlineKeyboardButton("В меню", callback_data="back_to_start")
        ]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        f"АДМИН-ПАНЕЛЬ LAVKA\n\n"
        f"Админ: @{user.username or 'нет username'}\n"
        f"ID: {user.id}\n\n"
        f"Товаров: {len(products)} шт.\n"
        f"Категорий: {categories_count}\n"
        f"Общий остаток: {total_qty} шт.\n"
        f"Мало осталось (≤5): {low_qty} товаров\n"
        f"Нет в наличии: {out_of_stock} товаров\n\n"
        f"Админов: {admins_count}\n"
        f"Последний ID: {config.get('last_product_id', 0)}\n\n"
        f"Выберите действие:",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )

async def manage_admins(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    message = "Текущие админы:\n\n"
    
    if ADMINS:
        for i, admin_id in enumerate(ADMINS, 1):
            message += f"{i}. ID: {admin_id}\n"
    else:
        message += "Список админов пуст\n\n"
        message += "Добавить админа можно:\n"
        message += "1. Отправить команду /admin_add ID\n"
        message += "2. Или иметь username @chief_68"
    
    keyboard = [
        [
            InlineKeyboardButton("Добавить админа", callback_data="add_admin"),
            InlineKeyboardButton("Удалить админа", callback_data="remove_admin")
        ],
        [InlineKeyboardButton("Назад", callback_data="admin_panel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup)

async def settings(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    global config
    config = load_config()
    
    message = "Настройки LAVKA:\n\n"
    message += f"Конфиг файл: {CONFIG_FILE}\n"
    message += f"Файл товаров: {PRODUCTS_FILE}\n"
    message += f"Админов: {len(ADMINS)}\n"
    message += f"Последний ID товара: {config.get('last_product_id', 0)}\n"
    message += f"WebApp URL: {WEB_APP_URL[:50]}...\n"
    message += f"GitHub токен: {'настроен' if GITHUB_TOKEN != 'ваш_github_token_здесь' else 'не настроен'}\n\n"
    message += "Все настройки сохраняются между перезапусками!"
    
    keyboard = [
        [InlineKeyboardButton("Обновить конфиг", callback_data="refresh_config")],
        [InlineKeyboardButton("Назад", callback_data="admin_panel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup)

async def add_product_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    products = load_products_cached()
    next_id = get_next_product_id()
    
    context.user_data['adding_product'] = True
    context.user_data['product_step'] = 'name'
    context.user_data['product_data'] = {'id': next_id}
    
    await query.edit_message_text(
        f"Добавление товара\n\n"
        f"Следующий ID: {next_id}\n"
        f"Всего товаров: {len(products)}\n"
        f"Категория определяется автоматически по названию\n\n"
        "Шаг 1/5: Введите название товара:"
    )

async def handle_product_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    if not context.user_data.get('adding_product'):
        return
    
    product_name = update.message.text.strip()
    
    if len(product_name) < 2:
        await update.message.reply_text("Название слишком короткое! Минимум 2 символа:")
        return
    
    context.user_data['product_name'] = product_name
    context.user_data['product_step'] = 'price'
    
    await update.message.reply_text(
        f"Название: {product_name}\n\n"
        "Шаг 2/5: Введите цену в рублях:\n"
        "(Пример: 500)"
    )

async def handle_product_price(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    try:
        price = int(update.message.text.strip())
        if price <= 0:
            await update.message.reply_text("Цена должна быть положительной! Введите снова:")
            return
        
        context.user_data['product_price'] = price
        context.user_data['product_step'] = 'description'
        
        await update.message.reply_text(
            f"Цена: {price} руб.\n\n"
            "Шаг 3/5: Введите описание:\n"
            "(Пример: 'ICEBERG ULTRA (150 МГ) - НОВЫЙ ВКУС')"
        )
        
    except ValueError:
        await update.message.reply_text("Некорректная цена! Введите целое число (например: 500):")

async def handle_product_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    description = update.message.text.strip()
    
    if len(description) < 5:
        await update.message.reply_text("Описание слишком короткое! Минимум 5 символов:")
        return
    
    context.user_data['product_description'] = description
    context.user_data['product_step'] = 'quantity'
    
    await update.message.reply_text(
        f"Описание: {description}\n\n"
        "Шаг 4/5: Введите количество товара (остаток):\n"
        "(Пример: 10)"
    )

async def handle_product_quantity(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    try:
        quantity = int(update.message.text.strip())
        if quantity < 0:
            await update.message.reply_text("Количество не может быть отрицательным! Введите снова:")
            return
        
        context.user_data['product_quantity'] = quantity
        context.user_data['product_step'] = 'image'
        
        await update.message.reply_text(
            f"Остаток: {quantity} шт.\n\n"
            "Шаг 5/5: Введите URL изображения:\n"
            "Или отправьте 'default' для стандартного.\n"
            "Или 'skip' чтобы пропустить (будет placeholder)."
        )
        
    except ValueError:
        await update.message.reply_text("Некорректное количество! Введите целое число (например: 10):")

async def handle_product_image(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    image_url = update.message.text.strip()
    
    if image_url.lower() == 'default':
        image_url = "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg"
    elif image_url.lower() == 'skip':
        image_url = "https://via.placeholder.com/300x200/FF9800/FFFFFF?text=ICEBERG"
    
    try:
        products = load_products_cached()
        next_id = get_next_product_id()
        
        product_name = context.user_data['product_name'].lower()
        category = 'other'
        
        if 'iceberg' in product_name or 'айсберг' in product_name:
            category = 'iceberg'
        elif 'arqa' in product_name:
            category = 'arqa'
        elif 'шок' in product_name and 'storm' not in product_name:
            category = 'shok'
        elif 'storm' in product_name or 'шторм' in product_name:
            category = 'storm'
        elif ('st ' in product_name or ' st' in product_name or 'фердс' in product_name) and 'ferds' not in product_name:
            category = 'st'
        elif 'kasta' in product_name or 'каста' in product_name:
            category = 'kasta'
        elif 'ferds' in product_name or 'фердс' in product_name:
            category = 'ferds'
        elif 'faff' in product_name:
            category = 'faff'
        elif 'randm' in product_name:
            category = 'randm'
        elif 'shooter' in product_name:
            category = 'shooter'
        elif 'zuzu' in product_name:
            category = 'zuzu'
        elif 'швеция' in product_name:
            category = 'sweden'
        elif 'red' in product_name or 'ред' in product_name:
            category = 'red'
        elif 'mad' in product_name:
            category = 'mad'
        elif 'bitcoin' in product_name:
            category = 'bitcoin'
        elif 'drymost' in product_name:
            category = 'drymost'
        elif 'corvus' in product_name:
            category = 'corvus'
        elif 'пластин' in product_name or 'никотин' in product_name:
            category = 'nicotine'
        
        new_product = {
            "id": next_id,
            "name": context.user_data['product_name'],
            "price": context.user_data['product_price'],
            "quantity": context.user_data.get('product_quantity', 10),
            "description": context.user_data['product_description'],
            "image": image_url,
            "category": category,
            "added_by": user.username if user.username else str(user.id),
            "added_date": update.message.date.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        products.append(new_product)
        save_success = save_products(products)
        
        if not save_success:
            await update.message.reply_text("Ошибка сохранения товара!")
            return
        
        github_message = ""
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            success, msg = upload_to_github(products)
            github_message = f"\nGitHub: {msg}"
            
            if success:
                await send_to_webapp(new_product)
        else:
            github_message = "\nGitHub: токен не настроен"
        
        context.user_data.clear()
        
        keyboard = [
            [
                InlineKeyboardButton("В админ-панель", callback_data="admin_panel"),
                InlineKeyboardButton("Список товаров", callback_data="list_products")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"Товар успешно добавлен!\n\n"
            f"{new_product['name']}\n"
            f"{new_product['price']} руб.\n"
            f"Остаток: {new_product['quantity']} шт.\n"
            f"Категория: {category.upper()}\n"
            f"{new_product['description']}\n"
            f"ID: {new_product['id']}\n"
            f"Добавил: @{user.username if user.username else user.id}\n\n"
            f"Всего товаров в базе: {len(products)}{github_message}",
            reply_markup=reply_markup
        )
        
        logger.info(f"Товар ID {new_product['id']} добавлен, категория: {category}")
        
    except Exception as e:
        logger.error(f"Ошибка добавления товара: {e}")
        await update.message.reply_text(f"Ошибка: {str(e)}")

async def quick_add_product(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    await query.edit_message_text(
        "Быстрое добавление товара\n\n"
        "Используйте команду:\n"
        "/quick_add Название | Цена | Количество | Описание | URL_картинки\n\n"
        "Пример:\n"
        "/quick_add ICEBERG NEW | 500 | 15 | Новый вкус | https://example.com/image.jpg\n\n"
        "Можно пропустить URL картинки (будет стандартная):\n"
        "/quick_add ICEBERG NEW | 500 | 15 | Новый вкус\n\n"
        "Или использовать 'default' для стандартной картинки:\n"
        "/quick_add ICEBERG NEW | 500 | 15 | Новый вкус | default\n\n"
        "Категория определяется автоматически по названию!\n"
        "Товар сразу появится в приложении!",
        parse_mode='HTML'
    )

async def quick_add_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут добавлять товары!")
        return
    
    if not context.args:
        await update.message.reply_text(
            "Использование:\n"
            "/quick_add Название | Цена | Количество | Описание | [URL_картинки]\n\n"
            "Пример:\n"
            "/quick_add ICEBERG NEW | 500 | 15 | Новый вкус | https://example.com/image.jpg"
        )
        return
    
    try:
        full_text = ' '.join(context.args)
        parts = [part.strip() for part in full_text.split('|')]
        
        if len(parts) < 4:
            await update.message.reply_text("Недостаточно параметров! Нужно минимум 4: Название | Цена | Количество | Описание")
            return
        
        name = parts[0]
        price = int(parts[1])
        quantity = int(parts[2])
        description = parts[3]
        
        if len(parts) > 4:
            image_url = parts[4]
            if image_url.lower() == 'default':
                image_url = "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg"
        else:
            image_url = "https://static.insales-cdn.com/images/products/1/4176/629641296/large_DD5D020A-5370-4C6E-8350-BC442E83B211.jpg"
        
        product_name = name.lower()
        category = 'other'
        
        if 'iceberg' in product_name or 'айсберг' in product_name:
            category = 'iceberg'
        elif 'arqa' in product_name:
            category = 'arqa'
        elif 'шок' in product_name and 'storm' not in product_name:
            category = 'shok'
        elif 'storm' in product_name or 'шторм' in product_name:
            category = 'storm'
        elif ('st ' in product_name or ' st' in product_name or 'фердс' in product_name) and 'ferds' not in product_name:
            category = 'st'
        elif 'kasta' in product_name or 'каста' in product_name:
            category = 'kasta'
        elif 'ferds' in product_name or 'фердс' in product_name:
            category = 'ferds'
        elif 'faff' in product_name:
            category = 'faff'
        elif 'randm' in product_name:
            category = 'randm'
        elif 'shooter' in product_name:
            category = 'shooter'
        elif 'zuzu' in product_name:
            category = 'zuzu'
        elif 'швеция' in product_name:
            category = 'sweden'
        elif 'red' in product_name or 'ред' in product_name:
            category = 'red'
        elif 'mad' in product_name:
            category = 'mad'
        elif 'bitcoin' in product_name:
            category = 'bitcoin'
        elif 'drymost' in product_name:
            category = 'drymost'
        elif 'corvus' in product_name:
            category = 'corvus'
        elif 'пластин' in product_name or 'никотин' in product_name:
            category = 'nicotine'
        
        if price <= 0:
            await update.message.reply_text("Цена должна быть положительной!")
            return
        
        if quantity < 0:
            await update.message.reply_text("Количество не может быть отрицательным!")
            return
        
        products = load_products_cached()
        next_id = get_next_product_id()
        
        new_product = {
            "id": next_id,
            "name": name,
            "price": price,
            "quantity": quantity,
            "description": description,
            "image": image_url,
            "category": category,
            "added_by": user.username if user.username else str(user.id),
            "added_date": update.message.date.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        products.append(new_product)
        save_products(products)
        
        github_message = ""
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            success, msg = upload_to_github(products)
            github_message = f"\nGitHub: {msg}"
            
            if success:
                await send_to_webapp(new_product)
        else:
            github_message = "\nGitHub: токен не настроен"
        
        await update.message.reply_text(
            f"Товар быстро добавлен и обновлен в приложении!\n\n"
            f"{name}\n"
            f"{price} руб.\n"
            f"{quantity} шт.\n"
            f"Категория: {category.upper()}\n"
            f"{description}\n"
            f"ID: {next_id}\n"
            f"Добавил: @{user.username if user.username else user.id}\n\n"
            f"Всего товаров: {len(products)}{github_message}"
        )
        
        logger.info(f"Быстро добавлен товар ID {next_id}, категория: {category}")
        
    except ValueError as e:
        await update.message.reply_text(f"Ошибка в данных: {str(e)}\nПроверьте формат цены и количества!")
    except Exception as e:
        logger.error(f"Ошибка быстрого добавления: {e}")
        await update.message.reply_text(f"Ошибка: {str(e)}")

async def categories_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    products = load_products_cached()
    
    categories_dict = {}
    for product in products:
        category = product.get('category', 'other')
        if category not in categories_dict:
            categories_dict[category] = []
        categories_dict[category].append(product)
    
    keyboard = []
    
    categories_list = sorted(categories_dict.keys())
    for i in range(0, len(categories_list), 2):
        row = []
        if i < len(categories_list):
            cat1 = categories_list[i]
            count1 = len(categories_dict[cat1])
            row.append(
                InlineKeyboardButton(
                    f"{cat1.upper()} ({count1})",
                    callback_data=f"category_{cat1}_page_0"
                )
            )
        
        if i + 1 < len(categories_list):
            cat2 = categories_list[i + 1]
            count2 = len(categories_dict[cat2])
            row.append(
                InlineKeyboardButton(
                    f"{cat2.upper()} ({count2})",
                    callback_data=f"category_{cat2}_page_0"
                )
            )
        
        keyboard.append(row)
    
    keyboard.append([
        InlineKeyboardButton("Все категории", callback_data="show_all_categories")
    ])
    
    keyboard.append([
        InlineKeyboardButton("Назад", callback_data="admin_panel"),
        InlineKeyboardButton("Обновить", callback_data="categories_menu")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    total_categories = len(categories_dict)
    total_products = len(products)
    
    await query.edit_message_text(
        f"Управление категориями\n\n"
        f"Всего категорий: {total_categories}\n"
        f"Всего товаров: {total_products}\n"
        f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n\n"
        f"Выберите категорию для просмотра:\n"
        f"Цифра в скобках - количество товаров в категории",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )

async def show_category_products(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    data = query.data
    await query.answer()
    
    if not data.startswith("category_"):
        return
    
    parts = data.split("_")
    if len(parts) < 3:
        await query.answer("Ошибка формата")
        return
    
    try:
        page_index = parts.index("page")
        category = "_".join(parts[1:page_index])
        page = int(parts[page_index + 1])
    except (ValueError, IndexError):
        await query.answer("Ошибка парсинга данных")
        return
    
    products = load_products_cached()
    category_products = [p for p in products if p.get('category', 'other') == category]
    
    if not category_products:
        await query.answer("В этой категории нет товаров")
        return
    
    category_products = sorted(category_products, key=lambda x: x['id'])
    
    total_pages = (len(category_products) + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE
    if page < 0 or page >= total_pages:
        page = 0
    
    start_idx = page * PRODUCTS_PER_PAGE
    end_idx = min(start_idx + PRODUCTS_PER_PAGE, len(category_products))
    
    message = f"Категория: {category.upper()}\n"
    message += f"Товаров: {len(category_products)}\n"
    message += f"Общий остаток: {sum(p.get('quantity', 0) for p in category_products)} шт.\n"
    message += f"Страница {page + 1} из {total_pages}\n\n"
    
    for product in category_products[start_idx:end_idx]:
        qty = product.get('quantity', 0)
        emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
        status = "Много" if qty > 5 else "Мало" if qty > 0 else "Нет в наличии"
        
        message += f"{emoji} ID {product['id']}: {product['name']}\n"
        message += f"   {product['price']} руб. | {qty} шт. ({status})\n\n"
    
    keyboard = []
    
    edit_buttons = []
    for i, product in enumerate(category_products[start_idx:min(start_idx+3, end_idx)], 1):
        edit_buttons.append(
            InlineKeyboardButton(
                f"{i}. {product['name'][:12]}... ({product.get('quantity', 0)}шт)",
                callback_data=f"edit_qty_{product['id']}"
            )
        )
    
    if edit_buttons:
        keyboard.append(edit_buttons)
    
    nav_buttons = []
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("⏪ 1", callback_data=f"category_{category}_page_0"))
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("◀️", callback_data=f"category_{category}_page_{page-1}"))
    
    nav_buttons.append(InlineKeyboardButton(f"{page+1}/{total_pages}", callback_data="noop"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton("▶️", callback_data=f"category_{category}_page_{page+1}"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton(f"{total_pages} ⏩", callback_data=f"category_{category}_page_{total_pages-1}"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    if total_pages > 1:
        page_buttons = []
        for p in range(min(5, total_pages)):
            page_buttons.append(
                InlineKeyboardButton(
                    f"{p+1}" if p != page else f"•{p+1}•",
                    callback_data=f"category_{category}_page_{p}"
                )
            )
        keyboard.append(page_buttons)
    
    keyboard.append([
        InlineKeyboardButton("Назад к категориям", callback_data="categories_menu"),
        InlineKeyboardButton("Обновить", callback_data=f"category_{category}_page_{page}")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def show_all_categories(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    products = load_products_cached()
    
    categories_dict = {}
    for product in products:
        category = product.get('category', 'other')
        if category not in categories_dict:
            categories_dict[category] = []
        categories_dict[category].append(product)
    
    message = "Все категории:\n\n"
    
    sorted_categories = sorted(categories_dict.items(), key=lambda x: len(x[1]), reverse=True)
    
    for category, category_products in sorted_categories:
        category_name = category.upper()
        count = len(category_products)
        total_qty = sum(p.get('quantity', 0) for p in category_products)
        total_value = sum(p['price'] * p.get('quantity', 0) for p in category_products)
        low_qty = sum(1 for p in category_products if p.get('quantity', 0) <= 5 and p.get('quantity', 0) > 0)
        out_of_stock = sum(1 for p in category_products if p.get('quantity', 0) <= 0)
        
        message += f"{category_name}\n"
        message += f"Товаров: {count} шт.\n"
        message += f"Остаток: {total_qty} шт.\n"
        message += f"Общая стоимость: {total_value} руб.\n"
        message += f"Мало (≤5): {low_qty} товаров\n"
        message += f"Нет в наличии: {out_of_stock} товаров\n\n"
    
    message += f"Всего категорий: {len(categories_dict)}\n"
    message += f"Всего товаров: {len(products)}\n"
    message += f"Общая стоимость всех товаров: {sum(p['price'] * p.get('quantity', 0) for p in products)} руб."
    
    keyboard = [[InlineKeyboardButton("Назад", callback_data="categories_menu")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def manage_quantity(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    products = load_products_cached()
    
    page = context.user_data.get('quantity_page', 0)
    total_pages = (len(products) + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE
    
    if page < 0 or page >= total_pages:
        page = 0
    
    start_idx = page * PRODUCTS_PER_PAGE
    end_idx = min(start_idx + PRODUCTS_PER_PAGE, len(products))
    
    keyboard = []
    
    for i, product in enumerate(products[start_idx:end_idx], start_idx + 1):
        qty = product.get('quantity', 0)
        emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
        
        keyboard.append([
            InlineKeyboardButton(
                f"{emoji} {i}. {product['name'][:20]} ({qty}шт)",
                callback_data=f"edit_qty_{product['id']}"
            )
        ])
    
    nav_buttons = []
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("⏪ 1", callback_data="quantity_page_0"))
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("◀️", callback_data=f"quantity_page_{page-1}"))
    
    nav_buttons.append(InlineKeyboardButton(f"{page+1}/{total_pages}", callback_data="noop"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton("▶️", callback_data=f"quantity_page_{page+1}"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton(f"{total_pages} ⏩", callback_data=f"quantity_page_{total_pages-1}"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    if total_pages > 1:
        page_buttons = []
        for p in range(min(5, total_pages)):
            page_buttons.append(
                InlineKeyboardButton(
                    f"{p+1}" if p != page else f"•{p+1}•",
                    callback_data=f"quantity_page_{p}"
                )
            )
        keyboard.append(page_buttons)
    
    keyboard.append([
        InlineKeyboardButton("Все +5", callback_data="qty_all_inc"),
        InlineKeyboardButton("Все -5", callback_data="qty_all_dec")
    ])
    
    keyboard.append([
        InlineKeyboardButton("Ручной ввод", callback_data="qty_manual"),
        InlineKeyboardButton("Список остатков", callback_data="qty_list_page_0")
    ])
    
    keyboard.append([
        InlineKeyboardButton("Назад", callback_data="admin_panel"),
        InlineKeyboardButton("Обновить", callback_data="manage_quantity")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    total_qty = sum(p.get('quantity', 0) for p in products)
    low_qty = sum(1 for p in products if p.get('quantity', 0) <= 5 and p.get('quantity', 0) > 0)
    out_of_stock = sum(1 for p in products if p.get('quantity', 0) <= 0)
    
    await query.edit_message_text(
        f"Управление остатками\n\n"
        f"Всего товаров: {len(products)}\n"
        f"Общий остаток: {total_qty} шт.\n"
        f"Мало (≤5): {low_qty} товаров\n"
        f"Нет в наличии: {out_of_stock} товаров\n\n"
        f"Страница {page + 1} из {total_pages}\n\n"
        f"Выберите товар для редактирования:",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )

async def handle_quantity_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    data = query.data
    await query.answer()
    
    if data.startswith("edit_qty_"):
        product_id = int(data.replace("edit_qty_", ""))
        context.user_data['editing_qty'] = product_id
        context.user_data['editing_step'] = 'awaiting_qty'
        
        products = load_products_cached()
        product = next((p for p in products if p['id'] == product_id), None)
        
        if product:
            qty = product.get('quantity', 0)
            status = "🟢 Много" if qty > 5 else "🟡 Мало" if qty > 0 else "🔴 Нет в наличии"
            
            await query.edit_message_text(
                f"Редактирование остатков (ID: {product_id})\n\n"
                f"Название: {product['name']}\n"
                f"Категория: {product.get('category', 'other').upper()}\n"
                f"Цена: {product['price']} руб.\n"
                f"Текущий остаток: {qty} шт. ({status})\n\n"
                f"Введите новое количество (целое число):\n"
                f"Или отправьте 'отмена' для отмены",
                parse_mode='HTML'
            )
        else:
            await query.answer("Товар не найден")
    
    elif data.startswith("quantity_page_"):
        page = int(data.replace("quantity_page_", ""))
        context.user_data['quantity_page'] = page
        await manage_quantity(update, context)
    
    elif data.startswith("category_") and "_page_" in data:
        await show_category_products(update, context)
    
    elif data == "qty_manual":
        await query.edit_message_text(
            "Редактирование остатков\n\n"
            "Используйте команды:\n\n"
            "1. Установить точное количество:\n"
            "/set_qty [ID] [количество]\n\n"
            "2. Увеличить количество:\n"
            "/inc_qty [ID] [сколько]\n\n"
            "3. Уменьшить количество:\n"
            "/dec_qty [ID] [сколько]\n\n"
            "Примеры:\n"
            "/set_qty 1 15 - установить 15 шт для товара ID 1\n"
            "/inc_qty 2 5 - увеличить на 5 шт товар ID 2\n"
            "/dec_qty 3 3 - уменьшить на 3 шт товар ID 3\n\n"
            "Изменения сразу появятся в приложении!",
            parse_mode='HTML'
        )
    
    elif data.startswith("qty_list_page_"):
        page = int(data.replace("qty_list_page_", ""))
        context.user_data['qty_list_page'] = page
        await show_quantity_list(update, context)
    
    elif data == "qty_list":
        await show_quantity_list(update, context)
    
    elif data == "qty_all_inc":
        products = load_products_cached()
        for product in products:
            product['quantity'] = product.get('quantity', 0) + 5
        
        save_products(products)
        upload_to_github(products)
        
        await query.answer("Все остатки увеличены на 5")
        await manage_quantity(update, context)
    
    elif data == "qty_all_dec":
        products = load_products_cached()
        for product in products:
            new_qty = product.get('quantity', 0) - 5
            product['quantity'] = max(0, new_qty)
        
        save_products(products)
        upload_to_github(products)
        
        await query.answer("Все остатки уменьшены на 5")
        await manage_quantity(update, context)

async def show_quantity_list(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    products = load_products_cached()
    
    page = context.user_data.get('qty_list_page', 0)
    total_pages = (len(products) + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE
    
    if page < 0 or page >= total_pages:
        page = 0
    
    start_idx = page * PRODUCTS_PER_PAGE
    end_idx = min(start_idx + PRODUCTS_PER_PAGE, len(products))
    
    sorted_products = sorted(products, key=lambda x: x.get('quantity', 0), reverse=True)
    
    message = f"Список остатков товаров\n"
    message += f"Страница {page + 1} из {total_pages}\n\n"
    
    for i, product in enumerate(sorted_products[start_idx:end_idx], start_idx + 1):
        qty = product.get('quantity', 0)
        emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
        status = "Много" if qty > 5 else "Мало" if qty > 0 else "Нет в наличии"
        
        message += f"{emoji} {i}. ID {product['id']}: {product['name']}\n"
        message += f"   {product.get('category', 'other').upper()} | {qty} шт. ({status}) | {product['price']} руб.\n\n"
    
    message += f"Всего товаров: {len(products)}\n"
    message += f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n\n"
    message += "🟢 >5 шт. | 🟡 ≤5 шт. | 🔴 Нет в наличии"
    
    keyboard = []
    
    nav_buttons = []
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("⏪ 1", callback_data="qty_list_page_0"))
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("◀️", callback_data=f"qty_list_page_{page-1}"))
    
    nav_buttons.append(InlineKeyboardButton(f"{page+1}/{total_pages}", callback_data="noop"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton("▶️", callback_data=f"qty_list_page_{page+1}"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton(f"{total_pages} ⏩", callback_data=f"qty_list_page_{total_pages-1}"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    if total_pages > 1:
        page_buttons = []
        for p in range(min(5, total_pages)):
            page_buttons.append(
                InlineKeyboardButton(
                    f"{p+1}" if p != page else f"•{p+1}•",
                    callback_data=f"qty_list_page_{p}"
                )
            )
        keyboard.append(page_buttons)
    
    keyboard.append([
        InlineKeyboardButton("Назад", callback_data="manage_quantity"),
        InlineKeyboardButton("Обновить", callback_data=f"qty_list_page_{page}")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def list_products(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    products = load_products_cached()
    
    if not products:
        await query.edit_message_text("База товаров пуста")
        return
    
    page = context.user_data.get('products_list_page', 0)
    total_pages = (len(products) + PRODUCTS_PER_PAGE - 1) // PRODUCTS_PER_PAGE
    
    if page < 0 or page >= total_pages:
        page = 0
    
    start_idx = page * PRODUCTS_PER_PAGE
    end_idx = min(start_idx + PRODUCTS_PER_PAGE, len(products))
    
    message = f"Товары  (всего {len(products)})\n"
    message += f"Страница {page + 1} из {total_pages}\n\n"
    
    for i, product in enumerate(products[start_idx:end_idx], start_idx + 1):
        qty = product.get('quantity', 0)
        emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
        status = "Много" if qty > 5 else "Мало" if qty > 0 else "Нет в наличии"
        
        message += f"{emoji} {i}. ID {product['id']}: {product['name']}\n"
        message += f"   {product.get('category', 'other').upper()} | {product['price']} руб. | {qty} шт. ({status})\n"
        message += f"   {product.get('added_by', 'system')}\n\n"
    
    keyboard = []
    
    edit_buttons = []
    for i, product in enumerate(products[start_idx:min(start_idx+3, end_idx)], 1):
        edit_buttons.append(
            InlineKeyboardButton(
                f"{i}. {product['name'][:12]}... ({product.get('quantity', 0)}шт)",
                callback_data=f"edit_qty_{product['id']}"
            )
        )
    
    if edit_buttons:
        keyboard.append(edit_buttons)
    
    nav_buttons = []
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("⏪ 1", callback_data="list_products_page_0"))
    
    if page > 0:
        nav_buttons.append(InlineKeyboardButton("◀️", callback_data=f"list_products_page_{page-1}"))
    
    nav_buttons.append(InlineKeyboardButton(f"{page+1}/{total_pages}", callback_data="noop"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton("▶️", callback_data=f"list_products_page_{page+1}"))
    
    if page < total_pages - 1:
        nav_buttons.append(InlineKeyboardButton(f"{total_pages} ⏩", callback_data=f"list_products_page_{total_pages-1}"))
    
    if nav_buttons:
        keyboard.append(nav_buttons)
    
    if total_pages > 1:
        page_buttons = []
        for p in range(min(5, total_pages)):
            page_buttons.append(
                InlineKeyboardButton(
                    f"{p+1}" if p != page else f"•{p+1}•",
                    callback_data=f"list_products_page_{p}"
                )
            )
        keyboard.append(page_buttons)
    
    keyboard.append([
        InlineKeyboardButton("Назад", callback_data="admin_panel"),
        InlineKeyboardButton("Обновить", callback_data=f"list_products_page_{page}")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def handle_pagination(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    data = query.data
    
    if data.startswith("list_products_page_"):
        page = int(data.replace("list_products_page_", ""))
        context.user_data['products_list_page'] = page
        await list_products(update, context)
    
    elif data.startswith("quantity_page_"):
        page = int(data.replace("quantity_page_", ""))
        context.user_data['quantity_page'] = page
        await manage_quantity(update, context)
    
    elif data.startswith("qty_list_page_"):
        page = int(data.replace("qty_list_page_", ""))
        context.user_data['qty_list_page'] = page
        await show_quantity_list(update, context)

async def handle_quantity_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Нет прав!")
        return
    
    if 'editing_qty' not in context.user_data:
        return
    
    product_id = context.user_data['editing_qty']
    
    if update.message.text.lower() == 'отмена':
        context.user_data.clear()
        await update.message.reply_text("Редактирование отменено")
        return
    
    try:
        new_qty = int(update.message.text.strip())
        
        if new_qty < 0:
            await update.message.reply_text("Количество не может быть отрицательным! Введите снова:")
            return
        
        products = load_products_cached()
        product_found = False
        old_qty = 0
        
        for product in products:
            if product['id'] == product_id:
                old_qty = product.get('quantity', 0)
                product['quantity'] = new_qty
                product_found = True
                break
        
        if not product_found:
            await update.message.reply_text(f"Товар с ID {product_id} не найден!")
            context.user_data.clear()
            return
        
        save_products(products)
        
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            upload_to_github(products)
        
        context.user_data.clear()
        
        await update.message.reply_text(
            f"Остатки обновлены!\n\n"
            f"ID: {product_id}\n"
            f"Было: {old_qty} шт.\n"
            f"Стало: {new_qty} шт.\n"
            f"Изменение: {new_qty - old_qty:+d} шт.\n\n"
            f"Данные обновлены в приложении"
        )
        
    except ValueError:
        await update.message.reply_text("Некорректное количество! Введите целое число:")
    except Exception as e:
        await update.message.reply_text(f"Ошибка: {str(e)}")
        context.user_data.clear()

async def set_quantity_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут изменять остатки!")
        return
    
    if len(context.args) != 2:
        await update.message.reply_text(
            "Использование: /set_qty [ID товара] [количество]\n\n"
            "Пример: /set_qty 1 15\n\n"
            "Посмотреть ID товаров: /products"
        )
        return
    
    try:
        product_id = int(context.args[0])
        new_qty = int(context.args[1])
        
        if new_qty < 0:
            await update.message.reply_text("Количество не может быть отрицательным!")
            return
        
        products = load_products_cached()
        product_found = False
        old_qty = 0
        
        for product in products:
            if product['id'] == product_id:
                old_qty = product.get('quantity', 0)
                product['quantity'] = new_qty
                product_found = True
                break
        
        if not product_found:
            await update.message.reply_text(f"Товар с ID {product_id} не найден!")
            return
        
        save_products(products)
        
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            upload_to_github(products)
        
        await update.message.reply_text(
            f"Остатки обновлены!\n\n"
            f"ID: {product_id}\n"
            f"Было: {old_qty} шт.\n"
            f"Стало: {new_qty} шт.\n"
            f"Изменение: {new_qty - old_qty:+d} шт.\n\n"
            f"Данные обновлены в приложении"
        )
        
    except ValueError:
        await update.message.reply_text("ID и количество должны быть числами!")
    except Exception as e:
        await update.message.reply_text(f"Ошибка: {str(e)}")

async def inc_quantity_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут изменять остатки!")
        return
    
    if len(context.args) != 2:
        await update.message.reply_text(
            "Использование: /inc_qty [ID товара] [на сколько]\n\n"
            "Пример: /inc_qty 1 5\n\n"
            "Посмотреть ID товаров: /products"
        )
        return
    
    try:
        product_id = int(context.args[0])
        inc_amount = int(context.args[1])
        
        if inc_amount <= 0:
            await update.message.reply_text("Число должно быть положительным!")
            return
        
        products = load_products_cached()
        product_found = False
        old_qty = 0
        
        for product in products:
            if product['id'] == product_id:
                old_qty = product.get('quantity', 0)
                product['quantity'] = old_qty + inc_amount
                product_found = True
                break
        
        if not product_found:
            await update.message.reply_text(f"Товар с ID {product_id} не найден!")
            return
        
        save_products(products)
        
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            upload_to_github(products)
        
        await update.message.reply_text(
            f"Остатки увеличены!\n\n"
            f"ID: {product_id}\n"
            f"Было: {old_qty} шт.\n"
            f"Стало: {old_qty + inc_amount} шт.\n"
            f"Увеличено на: +{inc_amount} шт.\n\n"
            f"Данные обновлены в приложении"
        )
        
    except ValueError:
        await update.message.reply_text("ID и количество должны быть числами!")
    except Exception as e:
        await update.message.reply_text(f"Ошибка: {str(e)}")

async def dec_quantity_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут изменять остатки!")
        return
    
    if len(context.args) != 2:
        await update.message.reply_text(
            "Использование: /dec_qty [ID товара] [на сколько]\n\n"
            "Пример: /dec_qty 1 3\n\n"
            "Посмотреть ID товаров: /products"
        )
        return
    
    try:
        product_id = int(context.args[0])
        dec_amount = int(context.args[1])
        
        if dec_amount <= 0:
            await update.message.reply_text("Число должно быть положительным!")
            return
        
        products = load_products_cached()
        product_found = False
        old_qty = 0
        
        for product in products:
            if product['id'] == product_id:
                old_qty = product.get('quantity', 0)
                new_qty = max(0, old_qty - dec_amount)
                product['quantity'] = new_qty
                product_found = True
                break
        
        if not product_found:
            await update.message.reply_text(f"Товар с ID {product_id} не найден!")
            return
        
        save_products(products)
        
        if GITHUB_TOKEN != "ваш_github_token_здесь":
            upload_to_github(products)
        
        await update.message.reply_text(
            f"Остатки уменьшены!\n\n"
            f"ID: {product_id}\n"
            f"Было: {old_qty} шт.\n"
            f"Стало: {max(0, old_qty - dec_amount)} шт.\n"
            f"Уменьшено на: -{dec_amount} шт.\n\n"
            f"Данные обновлены в приложении"
        )
        
    except ValueError:
        await update.message.reply_text("ID и количество должны быть числами!")
    except Exception as e:
        await update.message.reply_text(f"Ошибка: {str(e)}")

async def products_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    products = load_products_cached()
    
    if not products:
        await update.message.reply_text("База товаров пуста")
        return
    
    message = f"Товары ICEBERG (всего {len(products)}):\n\n"
    
    for product in products[-10:]:
        qty = product.get('quantity', 0)
        emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
        status = "Много" if qty > 5 else "Мало" if qty > 0 else "Нет в наличии"
        
        message += f"{emoji} ID {product['id']}: {product['name']}\n"
        message += f"   {product.get('category', 'other').upper()} | {product['price']} руб. | {qty} шт. ({status})\n"
        message += f"   {product.get('added_by', 'system')}\n\n"
    
    if len(products) > 10:
        message += f"Показано последние 10 из {len(products)} товаров\n"
    
    message += "🟢 >5 шт. | 🟡 ≤5 шт. | 🔴 Нет в наличии"
    
    await update.message.reply_text(message, parse_mode='HTML')

async def sync_from_github_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут синхронизировать с GitHub!")
        return
    
    await update.message.reply_text("Загружаю товары из GitHub...")
    
    success, message = download_from_github()
    
    if success:
        products = load_products_cached()
        await update.message.reply_text(
            f"{message}\n\n"
            f"Товаров загружено: {len(products)} шт.\n"
            f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n"
            f"Категорий: {len(set(p.get('category', 'other') for p in products))}\n"
            f"Последний ID: {config.get('last_product_id', 0)}"
        )
    else:
        await update.message.reply_text(f"Ошибка: {message}")

async def sync_github(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    keyboard = [
        [
            InlineKeyboardButton("Загрузить из GitHub", callback_data="sync_from_github"),
            InlineKeyboardButton("Загрузить на GitHub", callback_data="sync_to_github")
        ],
        [InlineKeyboardButton("Назад", callback_data="admin_panel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "Синхронизация с GitHub\n\n"
        "Выберите действие:",
        reply_markup=reply_markup
    )

async def sync_from_github_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    await query.edit_message_text("Загружаю товары из GitHub...")
    
    success, message = download_from_github()
    
    if success:
        products = load_products_cached()
        await query.edit_message_text(
            f"{message}\n\n"
            f"Товаров загружено: {len(products)} шт.\n"
            f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n"
            f"Категорий: {len(set(p.get('category', 'other') for p in products))}\n"
            f"Последний ID: {config.get('last_product_id', 0)}\n\n"
            f"Данные сохранены локально",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="sync_github")]])
        )
    else:
        await query.edit_message_text(
            f"Ошибка: {message}",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="sync_github")]])
        )

async def sync_to_github_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    products = load_products_cached()
    
    if GITHUB_TOKEN == "ваш_github_token_здесь":
        await query.edit_message_text(
            "GitHub токен не настроен!\n\n"
            "1. Получите токен на GitHub:\n"
            "   Settings → Developer settings → Personal access tokens\n"
            "2. Выдайте права: repo\n"
            "3. Вставьте токен в config.json\n\n"
            f"Локально товаров: {len(products)}",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="sync_github")]])
        )
        return
    
    await query.edit_message_text("Загружаю на GitHub...")
    
    success, message = upload_to_github(products)
    
    await query.edit_message_text(
        f"{message}\n\n"
        f"Товаров: {len(products)} шт.\n"
        f"Категорий: {len(set(p.get('category', 'other') for p in products))}\n"
        f"Общий остаток: {sum(p.get('quantity', 0) for p in products)} шт.\n"
        f"Последний ID: {config.get('last_product_id', 0)}\n"
        f"Файл: {GITHUB_FILE_PATH}",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="sync_github")]])
    )

async def show_admin_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id, query.from_user.username):
        await query.edit_message_text("Нет прав!")
        return
    
    message = (
        f"СПРАВКА АДМИНИСТРАТОРА\n\n"
        f"ОСНОВНЫЕ КОМАНДЫ:\n"
        f"• /start - Главное меню\n"
        f"• /admin_add [ID] - Добавить админа\n"
        f"• /admin_remove [ID] - Удалить админа\n"
        f"• /products - Показать все товары\n"
        f"• /categories - Показать товары по категориям\n"
        f"• /sync_github - Синхронизировать с GitHub\n\n"
        
        f"УПРАВЛЕНИЕ ТОВАРАМИ:\n"
        f"• /quick_add [параметры] - Быстрое добавление\n"
        f"• /set_qty [ID] [кол-во] - Установить остаток\n"
        f"• /inc_qty [ID] [кол-во] - Увеличить остаток\n"
        f"• /dec_qty [ID] [кол-во] - Уменьшить остаток\n\n"
        
        f"АДМИН-ПАНЕЛЬ:\n"
        f"• Добавить товар - пошаговое создание (5 шагов)\n"
        f"• Список товаров - просмотр базы с остатками\n"
        f"• Остатки - управление количеством товаров\n"
        f"• Категории - управление и просмотр категорий\n"
        f"• products.json - просмотр файла товаров\n"
        f"• Быстрое добавление - добавление одной командой\n"
        f"• Управление админами - список прав\n"
        f"• Настройки - конфигурация бота\n"
        f"• GitHub - синхронизация с репозиторием\n"
        
        f"КАТЕГОРИИ:\n"
        f"• Категория определяется автоматически по названию\n"
        f"• Поддерживаемые категории: ICEBERG, ARQA, SHOK, STORM и др.\n"
        f"• Просмотр товаров по категориям с пагинацией\n"
        
        f"СОВЕТЫ:\n"
        f"• Все данные сохраняются в файлы\n"
        f"• Товары обновляются в реальном времени в WebApp\n"
        f"• WebApp работает через GitHub Pages\n"
        f"• При добавлении товара указывайте остатки\n"
        f"• Используйте быструю навигацию по страницам\n\n"
    )
    
    keyboard = [[InlineKeyboardButton("Назад", callback_data="admin_panel")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def about_bot(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    message = (
        f"О LAVKA\n\n"
        f"LAVKA Shop - магазин с управлением остатками и категориями\n\n"
        f"ВОЗМОЖНОСТИ:\n"
        f"• Оформление заказа прямо в Telegram\n"
        f"• Управление остатками товаров\n"
        f"• Автоматическая синхронизация с GitHub\n"
        f"• Оптимизированная навигация по страницам\n\n"
        
        f"КАТЕГОРИИ:\n"
        f"• ICEBERG, ARQA, SHOK, STORM, ST\n"
        f"• KASTA, FERDS, FAFF, RANDM\n"
        f"• SHOOTER, ZUZU, SWEDEN, RED\n"
        f"• MAD, BITCOIN, DRYMOST, CORVUS\n"
        f"• NICOTINE (никотиновые пластинки)\n\n"
    )
    
    keyboard = [[InlineKeyboardButton("Назад", callback_data="back_to_start")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode='HTML')

async def admin_add_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут добавлять других админов!")
        return
    
    if not context.args:
        await update.message.reply_text(
            "Использование: /admin_add [ID пользователя]\n\n"
            "Как получить ID пользователя?\n"
            "1. Попросите пользователя отправить /start\n"
            "2. ID будет показан в приветствии\n"
            "3. Или используйте @userinfobot"
        )
        return
    
    try:
        new_admin_id = int(context.args[0])
        
        if new_admin_id in ADMINS:
            await update.message.reply_text(f"Пользователь {new_admin_id} уже админ!")
            return
        
        add_admin(new_admin_id)
        
        await update.message.reply_text(
            f"Пользователь {new_admin_id} добавлен как админ!\n\n"
            f"Всего админов: {len(ADMINS)}\n"
            f"Список админов: {', '.join(map(str, ADMINS))}"
        )
        
    except ValueError:
        await update.message.reply_text("Некорректный ID! ID должен быть числом.")
        return

async def admin_remove_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if not is_admin(user.id, user.username):
        await update.message.reply_text("Только админы могут удалять других админов!")
        return
    
    if not context.args:
        await update.message.reply_text(
            "Использование: /admin_remove [ID пользователя]\n\n"
            f"Текущие админы: {', '.join(map(str, ADMINS)) if ADMINS else 'нет админов'}"
        )
        return
    
    try:
        admin_id = int(context.args[0])
        
        if admin_id not in ADMINS:
            await update.message.reply_text(f"Пользователь {admin_id} не является админом!")
            return
        
        if admin_id == user.id:
            await update.message.reply_text("Вы не можете удалить сами себя!")
            return
        
        remove_admin(admin_id)
        
        await update.message.reply_text(
            f"Пользователь {admin_id} удален из админов!\n\n"
            f"Осталось админов: {len(ADMINS)}\n"
            f"Список админов: {', '.join(map(str, ADMINS)) if ADMINS else 'нет админов'}"
        )
        
    except ValueError:
        await update.message.reply_text("Некорректный ID! ID должен быть числом.")

async def categories_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    products = load_products_cached()
    
    if not products:
        await update.message.reply_text("База товаров пуста")
        return
    
    categories_dict = {}
    for product in products:
        category = product.get('category', 'other')
        if category not in categories_dict:
            categories_dict[category] = []
        categories_dict[category].append(product)
    
    message = "Товары по категориям:\n\n"
    
    for category, category_products in categories_dict.items():
        category_name = category.upper()
        message += f"{category_name} ({len(category_products)} товаров):\n"
        
        for product in category_products[:3]:
            qty = product.get('quantity', 0)
            emoji = "🟢" if qty > 5 else "🟡" if qty > 0 else "🔴"
            message += f"{emoji} ID {product['id']}: {product['name']} - {product['price']} руб.\n"
        
        if len(category_products) > 3:
            message += f"... и еще {len(category_products) - 3} товаров\n"
        message += "\n"
    
    message += "🟢 >5 шт. | 🟡 ≤5 шт. | 🔴 Нет в наличии\n\n"
    message += "Для детального просмотра используйте админ-панель"
    
    await update.message.reply_text(message, parse_mode='HTML')

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    data = query.data
    await query.answer()
    
    if data == "admin_panel":
        await admin_panel(update, context)
    elif data == "add_product":
        await add_product_start(update, context)
    elif data == "quick_add":
        await quick_add_product(update, context)
    elif data == "manage_quantity":
        await manage_quantity(update, context)
    elif data == "show_products_json":
        await show_products_json(update, context)
    elif data == "download_products_json":
        await download_products_json(update, context)
    elif data == "list_products":
        await list_products(update, context)
    elif data == "manage_admins":
        await manage_admins(update, context)
    elif data == "settings":
        await settings(update, context)
    elif data == "sync_github":
        await sync_github(update, context)
    elif data == "sync_from_github":
        await sync_from_github_callback(update, context)
    elif data == "sync_to_github":
        await sync_to_github_callback(update, context)
    elif data == "back_to_start":
        await start_from_callback(update, context)
    elif data == "help_admin":
        await show_admin_help(update, context)
    elif data == "about":
        await about_bot(update, context)
    elif data == "categories_menu":
        await categories_menu(update, context)
    elif data == "show_all_categories":
        await show_all_categories(update, context)
    elif data.startswith("category_"):
        await show_category_products(update, context)
    elif data.startswith("quantity_page_") or data.startswith("list_products_page_") or data.startswith("qty_list_page_"):
        await handle_pagination(update, context)
    elif data == "add_admin":
        await query.answer("Введите команду: /admin_add [ID пользователя]")
    elif data == "remove_admin":
        await query.answer("Введите команду: /admin_remove [ID пользователя]")
    elif data == "refresh_config":
        global config
        config = load_config()
        await query.answer("Конфиг обновлен!")
        await settings(update, context)
    elif data.startswith("edit_qty_") or data in ["qty_manual", "qty_list", "qty_all_inc", "qty_all_dec"] or data.startswith("qty_list_page_"):
        await handle_quantity_callback(update, context)
    elif data == "noop":
        pass
    else:
        await query.answer("Неизвестная команда")

async def start_from_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    
    user = query.from_user
    
    keyboard = [[
        InlineKeyboardButton(
            text="Открыть LAVKA",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )
    ]]
    
    if is_admin(user.id, user.username):
        keyboard.append([
            InlineKeyboardButton("Админ-панель", callback_data="admin_panel"),
        ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        f"LAVKA\n"
        f"@{user.username if user.username else 'гость'}",
        reply_markup=reply_markup
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    
    if 'editing_qty' in context.user_data:
        await handle_quantity_input(update, context)
        return
    
    if context.user_data.get('adding_product'):
        step = context.user_data.get('product_step')
        
        if step == 'name':
            await handle_product_name(update, context)
        elif step == 'price':
            await handle_product_price(update, context)
        elif step == 'description':
            await handle_product_description(update, context)
        elif step == 'quantity':
            await handle_product_quantity(update, context)
        elif step == 'image':
            await handle_product_image(update, context)

def main() -> None:
    logger.info("=" * 50)
    logger.info("ЗАПУСК LAVKA v5.1")
    logger.info("Версия с оптимизацией и кешированием")
    logger.info("С оптимизированной пагинацией")
    logger.info("Быстрые кнопки в разделах")
    logger.info("=" * 50)
    
    global config, ADMINS, GITHUB_TOKEN, WEB_APP_URL
    config = load_config()
    ADMINS = config.get("admins", [])
    GITHUB_TOKEN = config.get("github_token", "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")
    WEB_APP_URL = config.get("webapp_url", "https://raw.githack.com/sashaG7658/lavkatest/main/index.html")
    
    logger.info(f"Конфиг загружен: {CONFIG_FILE}")
    logger.info(f"Админов: {len(ADMINS)}")
    logger.info(f"GitHub токен: {'✅' if GITHUB_TOKEN != 'ваш_github_token_здесь' else '❌'}")
    
    logger.info("Загружаю товары...")
    products = load_products_cached()
    
    total_qty = sum(p.get('quantity', 0) for p in products)
    categories_count = len(set(p.get('category', 'other') for p in products))
    logger.info(f"Товаров загружено: {len(products)}")
    logger.info(f"Категорий: {categories_count}")
    logger.info(f"Общий остаток: {total_qty} шт.")
    logger.info(f"Последний ID: {config.get('last_product_id', 0)}")
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("admin_add", admin_add_command))
    application.add_handler(CommandHandler("admin_remove", admin_remove_command))
    application.add_handler(CommandHandler("products", products_command))
    application.add_handler(CommandHandler("categories", categories_command))
    application.add_handler(CommandHandler("quick_add", quick_add_command))
    application.add_handler(CommandHandler("set_qty", set_quantity_command))
    application.add_handler(CommandHandler("inc_qty", inc_quantity_command))
    application.add_handler(CommandHandler("dec_qty", dec_quantity_command))
    application.add_handler(CommandHandler("edit_qty", set_quantity_command))
    application.add_handler(CommandHandler("sync_github", sync_from_github_command))
    
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_webapp_data))
    
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    application.add_handler(CallbackQueryHandler(handle_callback))
    
    logger.info("Бот запущен с оптимизированной навигацией")
    logger.info("Кеширование товаров: 5 секунд")
    logger.info("Быстрые кнопки: пагинация с быстрым выбором страниц")
    logger.info("Админ-панель: оптимизирована для скорости")
    logger.info("Категории: улучшенная навигация по страницам")
    logger.info("Остатки: быстрый доступ к редактированию")
    logger.info("Синхронизация: автоматическая с GitHub")
    
    application.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main()
