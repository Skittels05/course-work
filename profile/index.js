document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'http://localhost:3000';
    const authOnlyContent = document.getElementById('authOnlyContent');
    const notAuthContent = document.getElementById('notAuthContent');
    const profileForm = document.getElementById('profileForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const successMessage = document.getElementById('successMessage');

    checkAuthStatus();

    async function checkAuthStatus() {
        const authUser = JSON.parse(sessionStorage.getItem('authUser'));
        
        if (!authUser) {
            showNotAuthContent();
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/users/${authUser.id}`);
            
            if (response.ok) {
                const userData = await response.json();
                displayUserData(userData);
                showAuthContent();
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            showNotAuthContent();
        }
    }

    function showAuthContent() {
        authOnlyContent.style.display = 'block';
        notAuthContent.style.display = 'none';
    }

    function showNotAuthContent() {
        authOnlyContent.style.display = 'none';
        notAuthContent.style.display = 'block';
    }

    function displayUserData(userData) {
        document.getElementById('userFullName').textContent = 
            `${userData.firstName} ${userData.lastName}`;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userPhone').textContent = userData.phone;
        document.getElementById('userRegDate').textContent = 
            new Date(userData.registrationDate).toLocaleDateString();
        document.getElementById('nickname').value = userData.nickname || '';
    }

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    document.getElementById('generateNickname').addEventListener('click', generateRandomNickname);

    function generateRandomNickname() {
        const adjectives = i18n.currentLang === 'ru' ? 
            ['крутой', 'классный', 'супер', 'мега', 'ультра'] : 
            ['cool', 'awesome', 'super', 'mega', 'ultra'];
        const nouns = i18n.currentLang === 'ru' ? 
            ['игрок', 'пользователь', 'программист', 'хакер'] : 
            ['user', 'player', 'gamer', 'coder', 'hacker'];
        const randomNum = Math.floor(Math.random() * 1000);
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        document.getElementById('nickname').value = `${adjective}_${noun}${randomNum}`;
    }

    document.getElementById('generatePassword').addEventListener('click', function() {
        const password = generatePassword();
        document.getElementById('newPassword').value = password;
        document.getElementById('confirmPassword').value = password;
    });

    function generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let password = '';
        
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return password;
    }

    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                const authUser = JSON.parse(sessionStorage.getItem('authUser'));
                const updateData = {};
                const translations = window.i18n.translations.profile?.form;

                const newNickname = document.getElementById('nickname').value.trim();
                if (newNickname && newNickname !== authUser.nickname) {
                    updateData.nickname = newNickname;
                }

                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword && confirmPassword) {
                    if (newPassword !== confirmPassword) {
                        showError('passwordError', translations?.errors?.passwords_mismatch || 'Passwords do not match');
                        return;
                    }
                    updateData.currentPassword = currentPassword;
                    updateData.newPassword = newPassword;
                }
                
                const response = await fetch(`${apiUrl}/users/${authUser.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (!response.ok) {
                    throw new Error('Update failed');
                }
                
                if (updateData.nickname) {
                    authUser.nickname = updateData.nickname;
                    sessionStorage.setItem('authUser', JSON.stringify(authUser));
                }
                
                showSuccess(translations?.success?.profile_updated || 'Profile updated successfully!');
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                
            } catch (error) {
                console.error('Update error:', error);
                const translations = window.i18n.translations.profile?.form?.errors;
                showError('passwordError', translations?.update_failed || 'Update failed. Please check your current password.');
            }
        }
    });

    function validateForm() {
        let isValid = true;
        const translations = window.i18n.translations.profile?.form?.errors;

        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });

        const nickname = document.getElementById('nickname').value.trim();
        if (nickname.length < 3) {
            showError('nicknameError', translations?.nickname_too_short || 'Nickname must be at least 3 characters');
            isValid = false;
        }

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword || confirmPassword) {
            if (newPassword.length < 8) {
                showError('passwordError', translations?.password_too_short || 'Password must be at least 8 characters');
                isValid = false;
            }
            
            if (newPassword !== confirmPassword) {
                showError('passwordError', translations?.passwords_mismatch || 'Passwords do not match');
                isValid = false;
            }
            
            if (!document.getElementById('currentPassword').value) {
                showError('passwordError', translations?.current_password_required || 'Please enter your current password');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }

    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('authUser');
        window.location.href = '../home/index.html';
    });

    window.addEventListener('languageChanged', function() {

        if (window.i18n) {
            window.i18n.applyTranslations('profile');
        }

        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
        successMessage.style.display = 'none';

        const nicknameInput = document.getElementById('nickname');
        if (nicknameInput.value.includes('_') && 
            (nicknameInput.value.includes('cool') || nicknameInput.value.includes('крутой'))) {
            generateRandomNickname();
        }
    });
    document.getElementById('clearStorageBtn').addEventListener('click', function() {
    if (confirm(i18n.getTranslation(i18n.translations.profile, 'clear_storage_confirm') || 
                'Are you sure you want to reset all settings?')) {
        localStorage.clear();
        location.reload();
    }
});
});