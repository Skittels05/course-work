const preloader = document.querySelector('.preloader');
const mainContent = document.querySelector('main');
if (!preloader) {
    const fallbackPreloader = document.createElement('div');
    fallbackPreloader.className = 'preloader';
    fallbackPreloader.innerHTML = '<div class="spinner"></div>';
    document.body.prepend(fallbackPreloader);
}
if (mainContent) {
    mainContent.style.visibility = 'hidden';
    mainContent.style.opacity = '0';
}
window.addEventListener('load', () => {
    const actualPreloader = preloader || document.querySelector('.preloader');
    if (actualPreloader) {
        actualPreloader.classList.add('hidden');
    }
    if (mainContent) {
        mainContent.style.visibility = '';
        mainContent.style.opacity = '';
        mainContent.classList.add('loaded');
    }
    document.body.classList.add('loaded');
});