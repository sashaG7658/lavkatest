/***********************************************************
 * НАСТРОЙКИ
 ***********************************************************/
const GITHUB_OWNER = "sashaG7658";
const GITHUB_REPO = "lavkatest";
const GITHUB_FILE_PATH = "orders.json";
const GITHUB_BRANCH = "main";
const TOKEN_STORAGE_KEY = "iceberg_github_token";

/***********************************************************
 * УТИЛИТЫ
 ***********************************************************/
function showNotification(text, type = "info") {
  console.log(`[${type.toUpperCase()}]`, text);
}

function getGitHubToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

async function promptForGitHubToken() {
  const token = prompt("Введите GitHub token (PAT):");
  if (!token) return null;
  localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  return token.trim();
}

/***********************************************************
 * ОСНОВНАЯ ФУНКЦИЯ С RETRY (ФИКС 409)
 ***********************************************************/
async function upsertOrdersJsonWithRetry({
  owner,
  repo,
  path,
  branch,
  token,
  newOrder,
  maxRetries = 3,
}) {
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // --- GET ---
    const getRes = await fetch(getUrl, { headers });
    if (!getRes.ok) {
      const t = await getRes.text();
      throw new Error(`GET failed ${getRes.status}: ${t}`);
    }

    const file = await getRes.json();
    const raw = file.content
      ? atob(file.content.replace(/\s/g, "")).trim()
      : "";

    let orders;
    try {
      orders = raw ? JSON.parse(raw) : [];
    } catch {
      orders = [];
    }
    if (!Array.isArray(orders)) orders = [];

    orders.push(newOrder);

    const content = btoa(
      unescape(encodeURIComponent(JSON.stringify(orders, null, 2)))
    );

    // --- PUT ---
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Add order ${new Date().toISOString()}`,
        content,
        sha: file.sha,
        branch,
      }),
    });

    if (putRes.ok) {
      return await putRes.json();
    }

    if (putRes.status === 409 && attempt < maxRetries) {
      console.warn(`⚠️ 409 конфликт, повтор ${attempt}/${maxRetries}`);
      continue;
    }

    const t = await putRes.text();
    throw new Error(`PUT failed ${putRes.status}: ${t}`);
  }
}

/***********************************************************
 * СОХРАНЕНИЕ ЗАКАЗА
 ***********************************************************/
async function saveOrderToGitHub(order) {
  let token = getGitHubToken();

  if (!token) {
    token = await promptForGitHubToken();
    if (!token) return false;
  }

  try {
    await upsertOrdersJsonWithRetry({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE_PATH,
      branch: GITHUB_BRANCH,
      token,
      newOrder: {
        id: crypto.randomUUID(),
        ...order,
        createdAt: new Date().toISOString(),
      },
      maxRetries: 3,
    });

    showNotification("✅ Заказ сохранён", "success");
    return true;
  } catch (err) {
    console.error("❌ Ошибка при сохранении в GitHub:", err);
    showNotification("❌ Ошибка сохранения заказа", "error");
    return false;
  }
}

/***********************************************************
 * ОБРАБОТЧИК КНОПКИ (ЗАЩИТА ОТ ДВОЙНОГО КЛИКА)
 ***********************************************************/
let isSavingOrder = false;

async function completeOrderWithPhone() {
  if (isSavingOrder) return;
  isSavingOrder = true;

  try {
    const order = {
      phone: "+7-999-123-45-67",
      items: [{ name: "Товар", price: 100 }],
      total: 100,
    };

    await saveOrderToGitHub(order);
  } finally {
    isSavingOrder = false;
  }
}

/***********************************************************
 * ПРИМЕР: ПРИВЯЗКА К КНОПКЕ
 ***********************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submitOrder");
  if (btn) {
    btn.addEventListener("click", completeOrderWithPhone);
  }
});
