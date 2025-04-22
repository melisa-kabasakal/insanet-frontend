window.initializeForgotPasswordPage = function() {
    console.log('Initializing forgot password page...');

    // Form elemanlarını seç
    const form = document.getElementById('forgot-password-form');
    const step1Div = document.getElementById('step-1-request-code');
    const step2Div = document.getElementById('step-2-verify-code');
    const identifierInput = document.getElementById('identifier');
    const identifierLabel = document.getElementById('identifierLabel');
    const identifierHint = document.getElementById('identifierHint');
    const resetCodeInput = document.getElementById('reset-code');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordMismatchError = document.querySelector('.password-mismatch-error');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const feedbackDiv = document.getElementById('forgot-password-feedback');
    const codeSentMessage = document.querySelector('.code-sent-message');
    const emailResetBtn = document.getElementById('emailResetBtn');
    const phoneResetBtn = document.getElementById('phoneResetBtn');

    let currentIdentifier = '';
    let currentMethod = 'email';
    let verificationToken = '';

    const showFeedback = (message, isError = true) => {
        if (!feedbackDiv) return;
        feedbackDiv.textContent = message;
        feedbackDiv.className = `form-feedback ${isError ? 'error' : 'success'}`;
        feedbackDiv.style.display = 'block';
    };

    const showLoadingButton = (button) => {
        if (!button) return;
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="button-spinner"></span> İşleniyor...';
    };

    const hideLoadingButton = (button) => {
        if (!button) return;
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    };

    // Doğrulama yöntemi seçimi
    if (emailResetBtn && phoneResetBtn) {
        emailResetBtn.addEventListener('click', function() {
            currentMethod = 'email';
            this.classList.add('active');
            phoneResetBtn.classList.remove('active');
            if (identifierLabel) identifierLabel.textContent = 'E-posta Adresi:';
            if (identifierInput) {
                identifierInput.placeholder = 'ornek@mail.com';
                identifierInput.type = 'email';
            }
            if (identifierHint) identifierHint.style.display = 'none';
        });

        phoneResetBtn.addEventListener('click', function() {
            currentMethod = 'phone';
            this.classList.add('active');
            emailResetBtn.classList.remove('active');
            if (identifierLabel) identifierLabel.textContent = 'Telefon Numarası:';
            if (identifierInput) {
                identifierInput.placeholder = '5XXXXXXXXX';
                identifierInput.type = 'tel';
            }
            if (identifierHint) identifierHint.style.display = 'block';
        });
    }

    // Doğrulama kodu isteme
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!identifierInput) return;

            const identifier = identifierInput.value.trim();
            if (!identifier) {
                showFeedback('Lütfen geçerli bir ' + (currentMethod === 'email' ? 'e-posta adresi' : 'telefon numarası') + ' girin');
                return;
            }

            try {
                showLoadingButton(sendCodeBtn);
                const response = await fetch('http://localhost:8082/insanet/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailOrPhone: identifier })
                });

                const data = await response.json();

                if (response.ok) {
                    currentIdentifier = identifier;
                    showFeedback('Doğrulama kodu gönderildi', false);
                    if (step1Div) step1Div.style.display = 'none';
                    if (step2Div) {
                        step2Div.style.display = 'block';
                        if (codeSentMessage) {
                            codeSentMessage.textContent = `Doğrulama kodu ${currentMethod === 'email' ? 'e-posta adresinize' : 'telefonunuza'} gönderildi.`;
                        }
                    }
                } else {
                    throw new Error(data.message || 'Doğrulama kodu gönderilemedi');
                }
            } catch (error) {
                showFeedback(error.message);
            } finally {
                hideLoadingButton(sendCodeBtn);
            }
        });
    }

    // Şifre sıfırlama
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!resetCodeInput || !newPasswordInput || !confirmPasswordInput) return;

            const resetCode = resetCodeInput.value.trim();
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!resetCode || !newPassword || !confirmPassword) {
                showFeedback('Tüm alanları doldurun');
                return;
            }

            if (newPassword !== confirmPassword) {
                if (passwordMismatchError) passwordMismatchError.style.display = 'block';
                return;
            }
            if (passwordMismatchError) passwordMismatchError.style.display = 'none';

            try {
                showLoadingButton(resetPasswordBtn);

                // Önce OTP doğrulaması
                const verifyResponse = await fetch('http://localhost:8082/insanet/auth/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        emailOrPhone: currentIdentifier,
                        otpCode: resetCode
                    })
                });

                const verifyData = await verifyResponse.json();
                console.log('OTP doğrulama yanıtı:', verifyData);
                
                if (!verifyResponse.ok) {
                    throw new Error(verifyData.message || 'Doğrulama kodu geçersiz');
                }
                
                // Doğrulanmış OTP kodunu token olarak kullan
                verificationToken = resetCode;
                console.log('Token olarak kullanılacak OTP kodu:', verificationToken);

                // Şifre sıfırlama
                console.log('Şifre sıfırlama isteği:', {
                    emailOrPhone: currentIdentifier,
                    newPassword: newPassword,
                    token: verificationToken
                });

                const resetResponse = await fetch('http://localhost:8082/insanet/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        emailOrPhone: currentIdentifier,
                        newPassword: newPassword,
                        token: verificationToken
                    })
                });

                const resetData = await resetResponse.json();

                if (resetResponse.ok) {
                    showFeedback('Şifreniz başarıyla sıfırlandı. Yönlendiriliyorsunuz...', false);
                    setTimeout(() => {
                        window.location.href = '#/login';
                    }, 2000);
                } else {
                    throw new Error(resetData.message || 'Şifre sıfırlama başarısız');
                }
            } catch (error) {
                showFeedback(error.message);
            } finally {
                hideLoadingButton(resetPasswordBtn);
            }
        });
    }

    // Geri dönme butonu
    const backButton = document.getElementById('back-to-step-1');
    if (backButton) {
        backButton.addEventListener('click', function() {
            if (step2Div) step2Div.style.display = 'none';
            if (step1Div) step1Div.style.display = 'block';
            if (resetCodeInput) resetCodeInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            if (passwordMismatchError) passwordMismatchError.style.display = 'none';
            showFeedback('');
        });
    }

    console.log('Forgot password page initialized and event listeners attached.');
};
