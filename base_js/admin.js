function updateAdminLink() {
    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    const adminLink = document.querySelector('.admin-link');
    if (adminLink) {
        adminLink.style.display = (authUser?.role === 'admin') ? 'block' : 'none';
    }
}
document.addEventListener('DOMContentLoaded', updateAdminLink);
window.addEventListener('storage', (e) => {
    if (e.key === 'authUser') updateAdminLink();
});
window.authAdmin = { updateAdminLink };