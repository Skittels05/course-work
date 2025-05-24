// header.js - только загрузка хедера
document.addEventListener('DOMContentLoaded', function() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../base_css/header.css';
    document.head.appendChild(link);
    
    if (!document.getElementById('main-header')) {
        fetch('../header/header.html')
            .then(response => {
                if (!response.ok) throw new Error('Header load error: ' + response.status);
                return response.text();
            })
            .then(html => {
                const headerDiv = document.createElement('div');
                headerDiv.id = 'main-header';
                headerDiv.innerHTML = html;
                document.body.insertBefore(headerDiv, document.body.firstChild);
                
                initThemeSwitcher();
                dispatchEvent(new Event('headerLoaded')); // Генерируем событие
                
                console.log('Header loaded');
                if (window.authAdmin?.updateAdminLink) {
                    window.authAdmin.updateAdminLink();
                }
            })
            .catch(error => {
                console.error('Header load failed:', error);
                const fallbackHeader = document.createElement('div');
                fallbackHeader.id = 'main-header';
                fallbackHeader.innerHTML = '<h1>Site Header</h1>';
                document.body.insertBefore(fallbackHeader, document.body.firstChild);
                initThemeSwitcher();
                dispatchEvent(new Event('headerLoaded')); // Событие даже при ошибке
            });
    } else {
        initThemeSwitcher();
    }
});

function initThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeSwitcher.checked = true;
    }
    
    themeSwitcher.addEventListener('change', function() {
        document.body.classList.toggle('dark-theme', this.checked);
        localStorage.setItem('theme', this.checked ? 'dark' : 'light');
    });
}