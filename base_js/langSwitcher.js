class I18nManager {
  constructor() {
    this.translations = {};
    this.currentLang = localStorage.getItem('preferredLang') || 
                      (navigator.language.startsWith('ru') ? 'ru' : 'en');
    this.currentPage = this.detectPage();
  }

  detectPage() {
    const path = window.location.pathname;
    if (path.includes('about')) return 'about';
    if (path.includes('services')) return 'services';
    if (path.includes('contact')) return 'contact';
    if (path.includes('shop')) return 'shop';
    if (path.includes('login')) return 'login';
    if (path.includes('registration')) return 'registration';
    if (path.includes('profile')) return 'profile';
    if (path.includes('admin')) return 'admin';
    if (path.includes('product')) return 'product';
    if (path.includes('cart')) return 'cart';
    if (path.includes('favourite')) return 'favourite'; 
    return 'home';
  }

  async loadTranslations(page) {
    try {
      const response = await fetch(`../locales/${this.currentLang}/${page}.json`);
      this.translations[page] = await response.json();
      return true;
    } catch (error) {
      console.error(`Error loading ${page} translations:`, error);
      return false;
    }
  }

  applyTranslations(page) {
    if (!this.translations[page]) return;

    const scope = page === 'header' ? document : document.querySelector('main');
    if (!scope) return;

    scope.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      
      if (key.startsWith('[')) {
        const [_, attr, transKey] = key.match(/\[(.*?)\](.*)/) || [];
        if (attr && transKey) {
          const value = this.getTranslation(this.translations[page], transKey);
          if (value) el.setAttribute(attr, value);
        }
      } else {
        const value = this.getTranslation(this.translations[page], key);
        if (value) el.textContent = value;
      }
    });

    if (page === this.currentPage) {
      document.documentElement.lang = this.currentLang;
      document.title = this.getTranslation(this.translations[page], 'page_title') || document.title;
    }
  }

  getTranslation(obj, key) {
    return key.split('.').reduce((o, k) => o?.[k], obj);
  }

  async switchLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    await this.loadTranslations('header');
    await this.loadTranslations(this.currentPage);
    
    this.applyTranslations('header');
    this.applyTranslations(this.currentPage);

    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    
    console.log(`Language switched to ${lang}`);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.i18n = new I18nManager();
  await i18n.loadTranslations('header');
  await i18n.loadTranslations(i18n.currentPage);
  i18n.applyTranslations('header');
  i18n.applyTranslations(i18n.currentPage);
  
  const langSwitcher = document.getElementById('lang-switcher');
  if (langSwitcher) {
    langSwitcher.addEventListener('click', () => {
      const newLang = i18n.currentLang === 'en' ? 'ru' : 'en';
      i18n.switchLanguage(newLang);
    });
  }
});