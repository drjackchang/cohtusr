document.addEventListener("DOMContentLoaded", function() {
    // 載入 Navbar
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
            // 自動幫目前的頁面加上 'active' 樣式
            const currentPage = window.location.pathname.split("/").pop() || "index.html";
            const navId = "nav-" + currentPage.replace(".html", "");
            const activeLink = document.getElementById(navId);
            if (activeLink) activeLink.classList.add("active");
        });

    // 載入 Footer
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        });
});