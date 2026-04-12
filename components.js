document.addEventListener("DOMContentLoaded", function() {
    loadComponent('navbar-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');
    fetchNews();
});

function loadComponent(id, file) {
    fetch(file).then(res => res.text()).then(data => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = data;
        
        if (id === 'navbar-placeholder') {
            const currentPath = window.location.pathname.split('/').pop() || "index.html";
            const navId = "nav-" + currentPath.replace(".html", "");
            const activeLink = document.getElementById(navId);
            if (activeLink) activeLink.classList.add("active");
        }
    }).catch(err => console.error(err));
}

async function fetchNews() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        let rows = parseCSV(text).slice(1);

        // 【防呆修復 1】嚴格過濾：只要「日期」或「標題」是空的，就當作是廢棄的空白列，直接剔除！
        rows = rows.filter(cols => cols.length >= 3 && cols[0].trim() !== "" && cols[2].trim() !== "");
        
        // 反轉陣列，讓最新填寫的真實活動排在最前面
        rows.reverse(); 

        // 判斷首頁
        const path = window.location.pathname;
        const isHome = path.endsWith('index.html') || path.endsWith('/') || !path.includes('.html');
        
        if (isHome) {
            rows = rows.slice(0, 6); // 首頁只抓前 6 筆真實資料
        }

        const container = document.getElementById('news-container');
        if (!container) return;
        container.innerHTML = '';

        if(rows.length === 0) {
            container.innerHTML = '<p class="text-center text-muted py-5">目前尚無活動資料。</p>';
            return;
        }

        rows.forEach(cols => {
            // 【防呆修復 2】安全賦值：如果有填就抓取，沒填就給空字串，徹底消滅 undefined！
            const date = cols[0] ? cols[0].trim() : "";
            const cat = cols[1] ? cols[1].trim() : "活動";
            const title = cols[2] ? cols[2].trim() : "未命名";
            const summary = cols[3] ? cols[3].trim() : "";
            const content = cols[4] ? cols[4].trim() : "詳細內容即將公佈...";
            let img = cols[5] ? cols[5].trim() : "";
            const link = cols[6] ? cols[6].trim() : "";

            // 【防呆修復 3】預設圖片：如果沒填圖片網址，自動套用一張高質感的醫療專業預設圖
            if (!img || !img.startsWith('http')) {
                img = 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=800&auto=format&fit=crop'; 
            }

            // 安全編碼，避免標題或內容有單引號導致彈窗失效
            const safeData = encodeURIComponent(JSON.stringify([date, cat, title, summary, content, img, link]));

            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border-0 shadow-sm overflow-hidden">
                        <div class="position-relative">
                            <img src="${img}" class="card-img-top" style="height:200px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=800&auto=format&fit=crop'">
                            <span class="position-absolute top-0 start-0 m-3 badge bg-primary">${cat}</span>
                        </div>
                        <div class="card-body">
                            <small class="text-muted d-block mb-2"><i class="far fa-calendar-alt me-1"></i> ${date}</small>
                            <h5 class="card-title fw-bold" style="color: #003366;">${title}</h5>
                            <p class="card-text text-secondary small" style="white-space: pre-wrap; line-height: 1.6;">${summary}</p>
                            <button class="btn btn-link p-0 fw-bold text-decoration-none" 
                                    onclick="openModal('${safeData}')">
                                閱讀詳情 →
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

window.openModal = function(encodedData) {
    const [date, cat, title, summary, content, img, link] = JSON.parse(decodeURIComponent(encodedData));
    const modalBody = document.getElementById('modal-body-content');
    
    const hasLink = link && link.toLowerCase().startsWith('http');
    const actionBtn = hasLink ? `<div class="mt-4"><a href="${link}" target="_blank" class="btn btn-primary btn-lg w-100 fw-bold">立即前往報名 / 連結</a></div>` : "";

    modalBody.innerHTML = `
        <img src="${img}" class="img-fluid rounded mb-4 w-100 shadow-sm" onerror="this.style.display='none'">
        <h3 class="fw-bold" style="color: #003366;">${title}</h3>
        <p class="text-muted small">${date} | ${cat}</p>
        <hr>
        <div class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">${content}</div>
        ${actionBtn}
    `;
    new bootstrap.Modal(document.getElementById('activityModal')).show();
};

function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
        const result = [];
        let cur = '', inQuote = false;
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) { result.push(cur); cur = ''; }
            else cur += char;
        }
        result.push(cur);
        return result;
    });
}