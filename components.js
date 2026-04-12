document.addEventListener("DOMContentLoaded", function() {
    // 1. 載入零件
    loadComponent('navbar-placeholder', 'navbar.html');
    loadComponent('footer-placeholder', 'footer.html');

    // 2. 執行資料抓取
    fetchNews();
});

function loadComponent(id, file) {
    fetch(file).then(res => res.text()).then(data => {
        document.getElementById(id).innerHTML = data;
        if (id === 'navbar-placeholder') {
            const currentPath = window.location.pathname.split('/').pop() || "index.html";
            const navId = "nav-" + currentPath.replace(".html", "");
            const activeLink = document.getElementById(navId);
            if (activeLink) activeLink.classList.add("active");
        }
    });
}

async function fetchNews() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        let rows = parseCSV(text).slice(1); // 略過標題
        
        rows.reverse(); // 最新填寫的排前面

        // 加強版首頁判斷邏輯
        const path = window.location.pathname;
        const isHome = path.endsWith('index.html') || path.endsWith('/') || !path.includes('.html');
        
        if (isHome) {
            rows = rows.slice(0, 6); // 首頁只顯示 6 筆
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
                            <img src="${img || 'https://via.placeholder.com/400x250?text=NTUNHS+USR'}" class="card-img-top" style="height:200px; object-fit:cover;">
                            <span class="position-absolute top-0 start-0 m-3 badge bg-primary">${cat}</span>
                        </div>
                        <div class="card-body">
                            <small class="text-muted d-block mb-2"><i class="far fa-calendar-alt me-1"></i> ${date}</small>
                            <h5 class="card-title fw-bold" style="color: #003366;">${title}</h5>
                            <p class="card-text text-secondary small" style="white-space: pre-wrap; line-height: 1.6;">${summary}</p>
                            <button class="btn btn-link p-0 fw-bold text-decoration-none" 
                                    onclick="openModal('${encodeURIComponent(JSON.stringify(cols))}')">
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
        <img src="${img || 'https://via.placeholder.com/800x450'}" class="img-fluid rounded mb-4 w-100 shadow-sm">
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