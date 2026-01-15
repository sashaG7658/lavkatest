// Функция для сохранения заказа через GitHub API
async function saveOrderToGitHub(orderData) {
    const GITHUB_TOKEN = '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'; // ⚠️ НЕ храните в коде на фронтенде!
    const REPO_OWNER = 'sashaG7658';
    const REPO_NAME = 'lavkatest';
    const FILE_PATH = 'orders.json';
    
    const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    try {
        // 1. Получаем текущий файл
        const fileResponse = await fetch(API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        const fileData = await fileResponse.json();
        
        // 2. Декодируем текущий контент (base64)
        let currentOrders = [];
        if (fileData.content) {
            const decodedContent = atob(fileData.content.replace(/\n/g, ''));
            currentOrders = JSON.parse(decodedContent || '[]');
        }
        
        // 3. Добавляем новый заказ
        const newOrder = {
            id: Date.now(),
            ...orderData,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        currentOrders.unshift(newOrder); // Добавляем в начало
        
        // 4. Кодируем обратно в base64
        const updatedContent = JSON.stringify(currentOrders, null, 2);
        const encodedContent = btoa(updatedContent);
        
        // 5. Обновляем файл на GitHub
        const updateResponse = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Добавлен заказ #${orderData.orderNumber}`,
                content: encodedContent,
                sha: fileData.sha // Важно для обновления существующего файла
            })
        });
        
        const result = await updateResponse.json();
        console.log('✅ Заказ сохранен в GitHub:', result);
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения в GitHub:', error);
        return false;
    }
}
