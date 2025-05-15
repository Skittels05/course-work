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

    // Обработчики для кнопок показа/скрытия пароля
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

    // Генерация никнейма
    document.getElementById('generateNickname').addEventListener('click', generateRandomNickname);

    // Генерация пароля
    document.getElementById('generatePassword').addEventListener('click', function() {
        const password = generatePassword();
        document.getElementById('newPassword').value = password;
        document.getElementById('confirmPassword').value = password;
    });

    // Отправка формы
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                const authUser = JSON.parse(sessionStorage.getItem('authUser'));
                const updateData = {};
                
                // Обновление никнейма
                const newNickname = document.getElementById('nickname').value.trim();
                if (newNickname && newNickname !== authUser.nickname) {
                    updateData.nickname = newNickname;
                }
                
                // Обновление пароля
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                if (newPassword && confirmPassword) {
                    if (newPassword !== confirmPassword) {
                        showError('passwordError', 'Passwords do not match');
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
                
                // Обновляем данные в sessionStorage
                if (updateData.nickname) {
                    authUser.nickname = updateData.nickname;
                    sessionStorage.setItem('authUser', JSON.stringify(authUser));
                }
                
                showSuccess('Profile updated successfully!');
                profileForm.reset();
                
            } catch (error) {
                console.error('Update error:', error);
                showError('passwordError', 'Update failed. Please check your current password.');
            }
        }
    });

    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('authUser');
        window.location.href = '../home/index.html';
    });

    function validateForm() {
        let isValid = true;

        const nickname = document.getElementById('nickname').value.trim();
        if (nickname.length < 3) {
            showError('nicknameError', 'Nickname must be at least 3 characters');
            isValid = false;
        }

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword || confirmPassword) {
            if (newPassword.length < 8) {
                showError('passwordError', 'Password must be at least 8 characters');
                isValid = false;
            }
            
            if (newPassword !== confirmPassword) {
                showError('passwordError', 'Passwords do not match');
                isValid = false;
            }
            
            if (!document.getElementById('currentPassword').value) {
                showError('passwordError', 'Please enter your current password');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function generateRandomNickname() {
        const adjectives = ['cool', 'awesome', 'super', 'mega', 'ultra'];
        const nouns = ['user', 'player', 'gamer', 'coder', 'hacker'];
        const randomNum = Math.floor(Math.random() * 1000);
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        
        document.getElementById('nickname').value = `${adjective}_${noun}${randomNum}`;
    }
    
    function generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let password = '';
        
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return password;
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
});