document.addEventListener('DOMContentLoaded', async () => {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '../base_css/footer.css';
    document.head.appendChild(cssLink);

    try {
        const response = await fetch('../footer/footer.html');
        if (!response.ok) throw new Error('Failed to load footer');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initFooterTranslations();
    } catch (error) {
        console.error('Footer error:', error);
        createFallbackFooter();
    }
});

function initFooterTranslations() {
    
    if (!window.i18n) {
        console.warn('Translation system not loaded');
        return;
    }

    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key.startsWith('[')) {
            const [_, attr, transKey] = key.match(/\[(.*?)\](.*)/) || [];
            if (attr && transKey) {
                const value = window.i18n.getTranslation(window.i18n.translations.footer, transKey);
                if (value) el.setAttribute(attr, value);
            }
        } 

        else {
            const value = window.i18n.getTranslation(window.i18n.translations.footer, key);
            if (value) el.textContent = value;
        }
    });
}

function createFallbackFooter() {
    document.body.insertAdjacentHTML('beforeend', `
        <footer>
            <div class="one">
                <div class="left_f">
                    <img src="../assets/logo.png" alt="Logo">
                    <p>1 Ivana Mazalova Street</p>
                </div>
                <div class="right_f">
                    <img src="../assets/phone.png" alt="Phone">
                    <p>Call us: +00 89 458 648</p>
                </div>
            </div>
            <div class="copyright">
                <p>© 2024 Brandbes. Powered by Webflow.</p>
            </div>
        </footer>
    `);
}