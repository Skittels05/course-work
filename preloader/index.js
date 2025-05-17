document.addEventListener('DOMContentLoaded', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '   ../preloader/preloader.css';
    document.head.appendChild(link);
    link.onerror = () => console.error('Failed to load preloader.css');
    const preloader = document.createElement('div');
    preloader.className = 'preloader';
    preloader.innerHTML = '<div class="spinner"></div>';
    document.body.prepend(preloader);
    const mainContent = document.querySelector('main');
    window.onload = () => {
        preloader.classList.add('hidden');
        if (mainContent) {
            mainContent.classList.add('loaded');
        }
        document.body.classList.add('loaded');
    };
});