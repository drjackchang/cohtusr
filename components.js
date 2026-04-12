document.addEventListener("DOMContentLoaded", function() {
    // 1. 同時載入導覽列與頁尾
    loadComponent('navbar-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');

    // 2. 執行 Google 試算表資料抓取
    fetchNews();
});

// 負責抓取 HTML 零件的函式
function loadComponent(id, file) {
    fetch(file)
        .then(res => {
            if (!res.ok) throw new Error('找不到檔案: ' + file);
            return res.text();
        })
        .then(data => {
            document.getElementById(id).innerHTML = data;
            // 載入後，如果是導覽列，執行高亮與語言切換邏輯
            if (id === 'navbar-placeholder') {
                initNavbarLogic();
            }
        })
        .catch(err => console.error(err));
}

// 導覽列邏輯：處理 EN/中文切換與 Active 樣式
function initNavbarLogic() {
    const currentPath = window.location.pathname;
    const isEnglish = currentPath.includes('/en/');
    const langBtn = document.getElementById('lang-switch');
    
    if (langBtn) {
        langBtn.innerText = isEnglish ? "中文" : "EN";
        const fileName = currentPath.split('/').pop() || "index.html";
        langBtn.href = isEnglish ? "../" + fileName : "en/" + fileName;
    }

    const fileName = currentPath.split('/').pop() || "index.html";
    const navId = "nav-" + fileName.replace(".html", "");
    const activeLink = document.getElementById(navId);
    if (activeLink) activeLink.classList.add("active");
}

// 負責抓取 Google 試算表並生成卡片的函式
async function fetchNews() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        
        // 1. 解析 CSV 並移除標題列
        let rows = parseCSV(text).slice(1); 
        
        // 2. 核心修正：將陣列順序反轉 (最新的排到最前面)
        rows.reverse(); 

        // 3. 判斷是否為首頁，如果是首頁則只取前 6 筆
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
        if (isHomePage) {
            rows = rows.slice(0, 6); 
        }

        const container = document.getElementById('news-container');
        if (!container) return;
        
        container.innerHTML = ''; 

        rows.forEach(cols => {
            if (cols.length < 3) return;
            const [date, cat, title, summary, content, img, link] = cols.map(c => c?.trim() || "");

            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden">
                        <div class="position-relative">
                            <img src="${img || 'https://via.placeholder.com/400x250'}" class="card-img-top" style="height:200px; object-fit:cover;">
                            <span class="position-absolute top-0 start-0 m-3 badge bg-primary">${cat}</span>
                        </div>
                        <div class="card-body">
                            <small class="text-muted d-block mb-2"><i class="far fa-calendar-alt me-1"></i> ${date}</small>
                            <h5 class="card-title fw-bold">${title}</h5>
                            <p class="card-text text-secondary small">${summary}</p>
                            <button class="btn btn-link p-0 fw-bold text-decoration-none" 
                                    onclick="openModal('${encodeURIComponent(JSON.stringify(cols))}')">
                                閱讀全文 →
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("資料同步失敗", e);
    }
}

// 彈窗顯示邏輯
window.openModal = function(encodedData) {
    const [date, cat, title, summary, content, img, link] = JSON.parse(decodeURIComponent(encodedData));
    const modalBody = document.getElementById('modal-body-content');

    // 關鍵要求：只有當連結欄位開頭是 http 時，才顯示按鈕
    const hasLink = link && link.toLowerCase().startsWith('http');
    const actionBtn = hasLink 
        ? `<div class="mt-4"><a href="${link}" target="_blank" class="btn btn-primary btn-lg w-100 fw-bold">立即前往報名 / 連結</a></div>` 
        : "";

    modalBody.innerHTML = `
        <img src="${img}" class="img-fluid rounded mb-4 w-100">
        <h3 class="fw-bold">${title}</h3>
        <p class="text-muted small">${date} | ${cat}</p>
        <div class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">${content}</div>
        ${actionBtn}
    `;

    new bootstrap.Modal(document.getElementById('activityModal')).show();
};

// 輔助解析 CSV
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