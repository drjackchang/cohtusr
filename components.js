document.addEventListener("DOMContentLoaded", function() {
    // 1. 載入導覽列與頁尾
    loadComponent('navbar-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');

    // 2. 抓取 Google 試算表動態內容
    fetchNews();
});

function loadComponent(id, file) {
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
            // 如果是導覽列，判斷當前頁面給予高亮
            if (id === 'navbar-placeholder') {
                const currentPath = window.location.pathname.split('/').pop() || "index.html";
                const navId = "nav-" + currentPath.replace(".html", "");
                const activeLink = document.getElementById(navId);
                if (activeLink) activeLink.classList.add("active");
            }
        });
}

async function fetchNews() {
    // 您的專屬 Google 試算表 CSV 連結
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        
        // 解析 CSV 並移除標題列
        let rows = parseCSV(text).slice(1); 
        
        // 【核心邏輯】反轉陣列：最新的填寫內容排到最前面
        rows.reverse(); 

        // 【核心邏輯】判斷是否為首頁，首頁只取前 6 筆，其餘頁面(events)顯示全部
        const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('ResilienceTogether/');
        if (isHomePage) {
            rows = rows.slice(0, 6); 
        }

        const container = document.getElementById('news-container');
        if (!container) return;
        
        container.innerHTML = ''; // 清除載入動畫

        rows.forEach(cols => {
            if (cols.length < 3) return;
            // 欄位定義：0日期, 1類別, 2標題, 3摘要, 4詳情, 5圖片, 6連結
            const [date, cat, title, summary, content, img, link] = cols.map(c => c?.trim() || "");

            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden">
                        <div class="position-relative">
                            <img src="${img || 'https://via.placeholder.com/400x250?text=NTUNHS+USR'}" class="card-img-top" style="height:200px; object-fit:cover;">
                            <span class="position-absolute top-0 start-0 m-3 badge bg-primary">${cat}</span>
                        </div>
                        <div class="card-body">
                            <small class="text-muted d-block mb-2"><i class="far fa-calendar-alt me-1"></i> ${date}</small>
                            <h5 class="card-title fw-bold">${title}</h5>
                            <p class="card-text text-secondary small" style="white-space: pre-wrap;">${summary}</p>
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
        console.error("資料載入失敗", e);
    }
}

// 彈窗邏輯
window.openModal = function(encodedData) {
    const [date, cat, title, summary, content, img, link] = JSON.parse(decodeURIComponent(encodedData));
    const modalBody = document.getElementById('modal-body-content');

    // 只有當連結欄位填寫了 http 開頭的網址時才顯示按鈕
    const hasLink = link && link.toLowerCase().startsWith('http');
    const actionBtn = hasLink 
        ? `<div class="mt-4"><a href="${link}" target="_blank" class="btn btn-primary btn-lg w-100 fw-bold">立即前往報名 / 連結</a></div>` 
        : "";

    modalBody.innerHTML = `
        <img src="${img}" class="img-fluid rounded mb-4 w-100 shadow-sm">
        <h3 class="fw-bold">${title}</h3>
        <p class="text-muted small">${date} | ${cat}</p>
        <hr>
        <div class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">${content}</div>
        ${actionBtn}
    `;

    new bootstrap.Modal(document.getElementById('activityModal')).show();
};

// CSV 解析輔助
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