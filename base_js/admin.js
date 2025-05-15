// auth-admin.js
function updateAdminLink() {
    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    const adminLink = document.querySelector('.admin-link');
    
    if (adminLink) {
        adminLink.style.display = (authUser?.role === 'admin') ? 'block' : 'none';
    }
}

// 1. Проверяем при загрузке страницы
document.addEventListener('DOMContentLoaded', updateAdminLink);

// 2. Проверяем при изменении sessionStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'authUser') updateAdminLink();
});

// 3. Даем возможность вызвать вручную из других скриптов
window.authAdmin = { updateAdminLink };