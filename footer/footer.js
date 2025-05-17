document.addEventListener('DOMContentLoaded', function() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '   ../base_css/footer.css';
    document.head.appendChild(link);
    if (!document.getElementById('main-footer')) {
        fetch('../footer/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load footer: ' + response.status);
                }
                return response.text();
            })
            .then(html => {
                const footerDiv = document.createElement('div');
                footerDiv.id = 'main-footer';
                footerDiv.innerHTML = html;
                document.body.appendChild(footerDiv);
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '../base_css/footer.css';
                document.head.appendChild(link);
                
                console.log('Footer loaded successfully');
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                const fallbackFooter = document.createElement('div');
                fallbackFooter.id = 'main-footer';
                fallbackFooter.innerHTML = '<p>&copy; 2023 My Site</p>';
                document.body.appendChild(fallbackFooter);
            });
    }
});