const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

app.post('/save-order', (req, res) => {
    const orderData = req.body;

    // Читаем текущие заказы
    let orders = [];
    const filePath = path.join(__dirname, 'orders.json');

    if (fs.existsSync(filePath)) {
        orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Добавляем новый заказ
    orders.push({
        ...orderData,
        createdAt: new Date().toISOString()
    });

    // Сохраняем обратно
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));

    res.json({ success: true, message: 'Order saved' });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
