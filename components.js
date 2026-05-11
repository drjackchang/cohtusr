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
            // 載入 navbar 後，套用目前語言
            applyLang(getCurrentLang());
        }

        if (id === 'footer-placeholder') {
            // 載入 footer 後，套用目前語言
            applyLang(getCurrentLang());
        }
    }).catch(err => console.error(err));
}

// ── 語言切換核心 ──────────────────────────────────────

function getCurrentLang() {
    return localStorage.getItem('siteLang') || 'zh';
}

function toggleLang() {
    const newLang = getCurrentLang() === 'zh' ? 'en' : 'zh';
    localStorage.setItem('siteLang', newLang);
    applyLang(newLang);
}

function applyLang(lang) {
    // 更新所有 .lang-text 元素
    document.querySelectorAll('.lang-text').forEach(el => {
        const text = el.getAttribute('data-' + lang);
        if (text) el.textContent = text;
    });

    // 更新切換按鈕顯示
    const btn = document.getElementById('lang-switch-btn');
    if (btn) {
        btn.textContent = lang === 'zh' ? 'EN' : '中';
    }

    // 更新 <html lang> 屬性
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
}

// 頁面載入時套用已儲存的語言
document.addEventListener("DOMContentLoaded", function() {
    applyLang(getCurrentLang());
});

// ── 活動新聞 ──────────────────────────────────────────

async function fetchNews() {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZK3wm2tlM3T1Qy2dCf6Gb96_8MJfdmnX9wCIYUSQ5K5hC44bGnl3hZXZeiH4v5f4QBksGZXoNTolE/pub?output=csv'; 
    
    try {
        const res = await fetch(csvUrl);
        const text = await res.text();
        
        let rows = parseCSV(text).slice(1);
        rows = rows.filter(cols => cols.length >= 3 && cols[0].trim() !== "" && cols[2].trim() !== "");
        rows.reverse(); 

        const path = window.location.pathname;
        const isHome = path.endsWith('index.html') || path.endsWith('/') || !path.includes('.html');
        
        if (isHome) {
            rows = rows.slice(0, 6);
        }

        const container = document.getElementById('news-container');
        if (!container) return;
        container.innerHTML = '';

        const lang = getCurrentLang();

        if(rows.length === 0) {
            container.innerHTML = `<p class="text-center text-muted py-5">${lang === 'zh' ? '目前尚無活動資料。' : 'No events available.'}</p>`;
            return;
        }

        rows.forEach(cols => {
            const date = cols[0] ? cols[0].trim() : "";
            const cat = cols[1] ? cols[1].trim() : "活動";
            const title = cols[2] ? cols[2].trim() : "未命名";
            const summary = cols[3] ? cols[3].trim() : "";
            const content = cols[4] ? cols[4].trim() : "";
            let img = cols[5] ? cols[5].trim() : "";
            const link = cols[6] ? cols[6].trim() : "";

            if (!img || !img.startsWith('http')) {
                img = 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=800&auto=format&fit=crop'; 
            }

            const safeData = encodeURIComponent(JSON.stringify([date, cat, title, summary, content, img, link]));
            const readMore = lang === 'zh' ? '閱讀詳情 →' : 'Read More →';

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
                                ${readMore}
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
    const lang = getCurrentLang();
    
    const hasLink = link && link.toLowerCase().startsWith('http');
    const btnLabel = lang === 'zh' ? '立即前往報名 / 連結' : 'Register / Link';
    const actionBtn = hasLink ? `<div class="mt-4"><a href="${link}" target="_blank" class="btn btn-primary btn-lg w-100 fw-bold">${btnLabel}</a></div>` : "";

    modalBody.innerHTML = `
        <img src="${img}" class="img-fluid rounded mb-4 w-100 shadow-sm" style="max-height: 300px; object-fit: cover;" onerror="this.style.display='none'">
        <h3 class="fw-bold" style="color: #003366;">${title}</h3>
        <p class="text-muted small">${date} | ${cat}</p>
        <hr>
        <div class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">${content}</div>
        ${actionBtn}
    `;
    new bootstrap.Modal(document.getElementById('activityModal')).show();
};

function parseCSV(text) {
    let result = [];
    let row = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            if (inQuote && text[i+1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            row.push(cur);
            cur = '';
        } else if ((char === '\n' || char === '\r') && !inQuote) {
            if (char === '\r' && text[i+1] === '\n') i++; 
            row.push(cur);
            result.push(row);
            row = [];
            cur = '';
        } else {
            cur += char;
        }
    }
    row.push(cur);
    if (row.length > 0) result.push(row);
    return result;
}
