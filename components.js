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
            applyLang(getCurrentLang());
        }

        if (id === 'footer-placeholder') {
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
    renderNewsCards(newLang); // 切換語言時重新 render 動態卡片
}

function applyLang(lang) {
    document.querySelectorAll('.lang-text').forEach(el => {
        const text = el.getAttribute('data-' + lang);
        if (text) el.textContent = text;
    });

    const btn = document.getElementById('lang-switch-btn');
    if (btn) btn.textContent = lang === 'zh' ? 'EN' : '中';

    document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
}

document.addEventListener("DOMContentLoaded", function() {
    applyLang(getCurrentLang());
});

// ── 活動新聞 ──────────────────────────────────────────

let _cachedRows = null; // 快取資料，切換語言時重新 render 而不用重新 fetch

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
        if (isHome) rows = rows.slice(0, 6);

        _cachedRows = rows;
        renderNewsCards(getCurrentLang());
    } catch (e) {
        console.error("資料載入失敗", e);
    }
}

function renderNewsCards(lang) {
    const container = document.getElementById('news-container');
    if (!container || !_cachedRows) return;

    container.innerHTML = '';

    if (_cachedRows.length === 0) {
        container.innerHTML = `<p class="text-center text-muted py-5">${lang === 'zh' ? '目前尚無活動資料。' : 'No events available.'}</p>`;
        return;
    }

    _cachedRows.forEach(cols => {
        const date    = cols[0] ? cols[0].trim() : "";
        const cat     = cols[1] ? cols[1].trim() : (lang === 'zh' ? "活動" : "Event");
        const title   = cols[2] ? cols[2].trim() : (lang === 'zh' ? "未命名" : "Untitled");
        const summary = cols[3] ? cols[3].trim() : "";
        const content = cols[4] ? cols[4].trim() : "";
        let img       = cols[5] ? cols[5].trim() : "";
        const link    = cols[6] ? cols[6].trim() : "";

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
                        <button class="btn btn-link p-0 fw-bold text-decoration-none" onclick="openModal('${safeData}')">
                            ${readMore}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
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
            if (inQuote && text[i+1] === '"') { cur += '"'; i++; }
            else inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            row.push(cur); cur = '';
        } else if ((char === '\n' || char === '\r') && !inQuote) {
            if (char === '\r' && text[i+1] === '\n') i++; 
            row.push(cur); result.push(row); row = []; cur = '';
        } else {
            cur += char;
        }
    }
    row.push(cur);
    if (row.length > 0) result.push(row);
    return result;
}
