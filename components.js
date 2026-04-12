document.addEventListener("DOMContentLoaded", function() {
    // 1. 載入元件
    loadComponent('navbar-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');

    // 2. 執行資料抓取
    fetchNews();
});

function loadComponent(id, file) {
    fetch(file).then(res => res.text()).then(data => {
        document.getElementById(id).innerHTML = data;
    });
}

async function fetchNews() {
    // 您提供的 Google Sheets CSV 連結
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        
        // 使用簡易 CSV 解析邏輯（處理包含逗號的引號內容）
        const rows = parseCSV(text).slice(1); 
        const container = document.getElementById('news-container');
        if (!container) return;
        
        container.innerHTML = '';

        rows.forEach(cols => {
            // 預期欄位: 0:日期, 1:類別, 2:標題, 3:摘要, 4:詳情內容, 5:圖片連結, 6:報名連結
            if (cols.length < 3) return;
            const [date, cat, title, summary, content, img, link] = cols.map(c => c?.trim() || "");

            const cardHtml = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden">
                        <div class="position-relative">
                            <img src="${img || 'https://via.placeholder.com/400x250?text=No+Image'}" class="card-img-top" style="height:200px; object-fit:cover;">
                            <span class="position-absolute top-0 start-0 m-3 badge bg-primary">${cat}</span>
                        </div>
                        <div class="card-body">
                            <small class="text-muted d-block mb-2"><i class="far fa-calendar-alt me-1"></i> ${date}</small>
                            <h5 class="card-title fw-bold">${title}</h5>
                            <p class="card-text text-secondary small">${summary}</p>
                            <button class="btn btn-link p-0 fw-bold text-decoration-none" 
                                    onclick="openActivityModal('${encodeURIComponent(JSON.stringify(cols))}')">
                                閱讀全文 →
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHtml;
        });
    } catch (e) {
        console.error("資料同步失敗：", e);
        document.getElementById('news-container').innerHTML = '<p class="text-center text-muted">目前尚無最新動態</p>';
    }
}

// 彈窗邏輯
window.openActivityModal = function(encodedData) {
    const cols = JSON.parse(decodeURIComponent(encodedData));
    const [date, cat, title, summary, content, img, link] = cols.map(c => c?.trim() || "");
    const modalBody = document.getElementById('modal-body-content');

    // 判斷連結是否有效
    const isValidLink = link && link.toLowerCase().startsWith('http');
    const actionButton = isValidLink 
        ? `<div class="mt-4"><a href="${link}" target="_blank" class="btn btn-primary btn-lg w-100 fw-bold">立即前往報名 / 連結</a></div>` 
        : "";

    modalBody.innerHTML = `
        <img src="${img || 'https://via.placeholder.com/800x450?text=No+Image'}" class="img-fluid rounded mb-4 w-100 shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-primary-light text-primary">${cat}</span>
            <small class="text-muted">${date}</small>
        </div>
        <h3 class="fw-bold mb-3">${title}</h3>
        <div class="content-area text-secondary" style="white-space: pre-wrap; line-height: 1.8;">${content}</div>
        ${actionButton}
    `;

    const modal = new bootstrap.Modal(document.getElementById('activityModal'));
    modal.show();
};

// 輔助函式：解析 CSV (處理內容中的逗號)
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
        const result = [];
        let cur = '', inQuote = false;
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                result.push(cur); cur = '';
            } else cur += char;
        }
        result.push(cur);
        return result;
    });
}