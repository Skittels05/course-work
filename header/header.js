document.addEventListener('DOMContentLoaded', function() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../base_css/header.css';
    document.head.appendChild(link);
    
    if (!document.getElementById('main-header')) {
        fetch('../header/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load header: ' + response.status);
                }
                return response.text();
            })
            .then(html => {
                const headerDiv = document.createElement('div');
                headerDiv.id = 'main-header';
                headerDiv.innerHTML = html;
                document.body.insertBefore(headerDiv, document.body.firstChild);
                
                // Инициализация темы ПОСЛЕ загрузки header'а
                initThemeSwitcher();
                
                console.log('Header loaded successfully');
                if (window.authAdmin?.updateAdminLink) {
                    window.authAdmin.updateAdminLink();
                }
            })
            .catch(error => {
                console.error('Error loading header:', error);
                const fallbackHeader = document.createElement('div');
                fallbackHeader.id = 'main-header';
                fallbackHeader.innerHTML = '<h1>Site Header</h1>';
                document.body.insertBefore(fallbackHeader, document.body.firstChild);
                initThemeSwitcher(); // Инициализация даже для fallback
            });
    } else {
        initThemeSwitcher(); // Если header уже есть
    }
});

function initThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) {
        console.warn('Theme switcher not found!');
        return;
    }
    
    // Проверяем сохраненную тему
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeSwitcher.checked = true;
    }
    
    // Обработчик переключения темы
    themeSwitcher.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            console.log('Dark theme activated');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
            console.log('Light theme activated');
        }
    });
    
    console.log('Theme switcher initialized');
}