document.addEventListener('DOMContentLoaded', function() {
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
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../base_css/header.css';
                document.head.appendChild(link);
                
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
            });
    }
});