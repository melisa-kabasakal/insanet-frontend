// js/forgot-password.js - Şifremi Unuttum sayfası için istemci taraflı mantık

// Router'dan önce çağrılabilir, bu yüzden global scope'da tanımlıyoruz.
window.initializeForgotPasswordPage = function() {
    console.log("Initializing forgot password page...");
    const form = document.getElementById('forgot-password-form');
    const step1Div = document.getElementById('step-1-request-code');
    const step2Div = document.getElementById('step-2-verify-code');
    const identifierInput = document.getElementById('identifier');
    const identifierLabel = document.getElementById('identifierLabel');
    const identifierHint = document.getElementById('identifierHint');
    const resetCodeInput = document.getElementById('reset-code');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordMismatchError = form.querySelector('.password-mismatch-error');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const backButton = document.getElementById('back-to-step-1');
    const feedbackDiv = document.getElementById('forgot-password-feedback');
    const codeSentMessage = step2Div.querySelector('.code-sent-message');

    // Yeni eklenen E-posta/Telefon butonları
    const emailResetBtn = document.getElementById('emailResetBtn');
    const phoneResetBtn = document.getElementById('phoneResetBtn');

    // Form elemanlarının varlığını kontrol et
    if (!form || !step1Div || !step2Div || !identifierInput || !identifierLabel || !identifierHint ||
        !resetCodeInput || !newPasswordInput || !confirmPasswordInput || !passwordMismatchError ||
        !sendCodeBtn || !resetPasswordBtn || !feedbackDiv || !backButton || !codeSentMessage ||
        !emailResetBtn || !phoneResetBtn) {
        console.error("Forgot password page elements not found! Initialization aborted.");
        return;
    }

    let currentIdentifier = ''; // Kodu doğrularken kullanmak için
    let currentMethod = 'email'; // Başlangıçta e-posta seçili

    // Yardımcı Fonksiyonlar
    const showFeedback = (message, isError = true) => {
        feedbackDiv.textContent = message;
        feedbackDiv.className = `form-feedback ${isError ? 'error' : 'success'}`;
        feedbackDiv.style.display = 'block';
    };

    const clearFeedback = () => {
        feedbackDiv.textContent = '';
        feedbackDiv.style.display = 'none';
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

    // Adım geçişleri ve 'required' yönetimi
    const goToStep1 = () => {
        step1Div.style.display = 'block';
        step2Div.style.display = 'none';
        clearFeedback();
        // Adım 1 inputlarını 'required' yap, Adım 2 inputlarını değil
        identifierInput.required = true;
        resetCodeInput.required = false;
        newPasswordInput.required = false;
        confirmPasswordInput.required = false;

        identifierInput.value = ''; // Adım 1'e dönünce input'u temizle
        resetCodeInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        passwordMismatchError.style.display = 'none';
        // Aktif metoda göre input'u tekrar ayarla (placeholder vb.)
        updateIdentifierInput(currentMethod);
    };

    const goToStep2 = (message) => {
        step1Div.style.display = 'none';
        step2Div.style.display = 'block';
        // Adım 1 inputlarını 'required' yapma, Adım 2 inputlarını yap
        identifierInput.required = false;
        resetCodeInput.required = true;
        newPasswordInput.required = true;
        confirmPasswordInput.required = true;

        codeSentMessage.textContent = message;
        clearFeedback();
        resetCodeInput.focus(); // Kod inputuna odaklan
    };

    // Seçilen metoda göre identifier inputunu güncelle
    const updateIdentifierInput = (method) => {
        identifierInput.value = ''; // Değeri temizle
        if (method === 'email') {
            identifierLabel.textContent = 'E-posta Adresi:';
            identifierInput.type = 'email';
            identifierInput.placeholder = 'ornek@mail.com';
            identifierInput.removeAttribute('pattern');
            identifierHint.style.display = 'none';
        } else { // phone
            identifierLabel.textContent = 'Telefon Numarası:';
            identifierInput.type = 'tel';
            identifierInput.placeholder = '5XXXXXXXXX';
            identifierInput.pattern = '5[0-9]{9}'; // 10 haneli, 5 ile başlayan
            identifierHint.style.display = 'block';
        }
        identifierInput.focus();
        clearFeedback();
    };

    // E-posta/Telefon Butonları için Olay Dinleyicileri
    emailResetBtn.addEventListener('click', () => {
        if (currentMethod === 'email') return; // Zaten aktifse bir şey yapma
        currentMethod = 'email';
        emailResetBtn.classList.add('active');
        phoneResetBtn.classList.remove('active');
        updateIdentifierInput('email');
    });

    phoneResetBtn.addEventListener('click', () => {
        if (currentMethod === 'phone') return; // Zaten aktifse bir şey yapma
        currentMethod = 'phone';
        phoneResetBtn.classList.add('active');
        emailResetBtn.classList.remove('active');
        updateIdentifierInput('phone');
    });

    // Form Gönderme İşlemi
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Tarayıcının varsayılan gönderme işlemini engelle
        clearFeedback();

        // Adım 1: Kod Gönderme İsteği
        if (step1Div.style.display !== 'none') {
            const identifier = identifierInput.value.trim();
            let isValid = false;

            // Seçilen metoda göre doğrulama yap
            if (currentMethod === 'email') {
                // Basit e-posta formatı kontrolü
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
                if (!isValid) {
                    showFeedback("Lütfen geçerli bir e-posta adresi girin.");
                    identifierInput.focus();
                    return;
                }
            } else { // phone
                // Telefon formatı kontrolü (input pattern ile aynı)
                isValid = /^5[0-9]{9}$/.test(identifier);
                if (!isValid) {
                    showFeedback("Lütfen geçerli bir telefon numarası girin (5XXXXXXXXX).");
                    identifierInput.focus();
                    return;
                }
            }

            currentIdentifier = identifier; // Daha sonra kullanmak üzere sakla
            showLoadingButton(sendCodeBtn);

            try {
                // API çağrısı (artık identifier'ı doğrudan gönderiyoruz)
                const response = await apiService.requestPasswordResetCode(identifier);
                if (response.success) {
                    goToStep2(response.message); // Adım 2'ye geç ve API'den gelen mesajı göster
                } else {
                    // API'den gelen hatayı göster
                    showFeedback(response.message || "Kod gönderilirken bir sunucu hatası oluştu.");
                }
            } catch (error) {
                console.error("Error requesting reset code:", error);
                // Yakalanan hatayı göster
                showFeedback(error.message || "Doğrulama kodu gönderilirken bir hata oluştu. Ağ bağlantınızı kontrol edin.");
            } finally {
                hideLoadingButton(sendCodeBtn);
            }
        }
        // Adım 2: Şifre Sıfırlama İsteği
        else {
            const resetCode = resetCodeInput.value.trim();
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Doğrulama Kodu Kontrolü
            if (!resetCode) {
                showFeedback("Lütfen doğrulama kodunu girin.");
                resetCodeInput.focus();
                return;
            }
            // Pattern'e göre 6 haneli sayı kontrolü
            if (!/^[0-9]{6}$/.test(resetCode)) {
                 showFeedback("Doğrulama kodu 6 haneli bir sayı olmalıdır.");
                 resetCodeInput.focus();
                 return;
            }

            // Yeni Şifre Kontrolleri
            if (!newPassword) {
                 showFeedback("Lütfen yeni şifrenizi girin.");
                 newPasswordInput.focus();
                 return;
            }
            if (newPassword.length < 8) {
                showFeedback("Yeni şifre en az 8 karakter olmalıdır.");
                newPasswordInput.focus();
                return;
            }
            if (!confirmPassword) {
                showFeedback("Lütfen yeni şifrenizi tekrar girin.");
                confirmPasswordInput.focus();
                return;
            }

            // Şifre Eşleşme Kontrolü
            if (newPassword !== confirmPassword) {
                showFeedback("Yeni şifreler eşleşmiyor.");
                passwordMismatchError.style.display = 'block';
                confirmPasswordInput.focus();
                return;
            }
            passwordMismatchError.style.display = 'none'; // Eşleşiyorsa hatayı gizle

            showLoadingButton(resetPasswordBtn);
            try {
                const response = await apiService.resetPassword(currentIdentifier, resetCode, newPassword);
                if (response.success) {
                    showFeedback(response.message, false); // Başarı mesajı
                    alert(response.message); // Ek olarak alert göster (kullanıcı görmesi için)
                    // Başarılı sıfırlama sonrası formu temizle ve giriş sayfasına yönlendir
                    form.reset();
                    setTimeout(() => {
                        router.navigateTo('/login');
                    }, 2000); // 2 saniye bekle
                } else {
                    // API'den gelen hatayı göster
                    showFeedback(response.message || "Şifre sıfırlanırken bir sunucu hatası oluştu.");
                }
            } catch (error) {
                console.error("Error resetting password:", error);
                // Yakalanan hatayı göster
                showFeedback(error.message || "Şifre sıfırlanırken bir hata oluştu. Ağ bağlantınızı kontrol edin veya kodu tekrar isteyin.");
            } finally {
                hideLoadingButton(resetPasswordBtn);
            }
        }
    });

    // Şifre Tekrarı Girilirken Eşleşme Kontrolü
    confirmPasswordInput.addEventListener('input', () => {
        if (newPasswordInput.value && confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value) {
            passwordMismatchError.style.display = 'block';
        } else {
            passwordMismatchError.style.display = 'none';
        }
    });
    // Yeni Şifre Girilirken Eşleşme Kontrolü (eğer tekrar alanı doluysa)
    newPasswordInput.addEventListener('input', () => {
         if (confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value) {
            passwordMismatchError.style.display = 'block';
        } else {
            passwordMismatchError.style.display = 'none';
        }
    });

    // Geri Butonu
    backButton.addEventListener('click', goToStep1);

    // Sayfa yüklendiğinde başlangıç durumu
    goToStep1(); // Varsayılan olarak Adım 1'i göster ve ayarla
    console.log("Forgot password page initialized and event listeners attached.");
};

// Eski global tanım varsa üzerine yaz (güvenlik önlemi)
if (window.initializeForgotPasswordPage) {
     console.log("Overwriting existing initializeForgotPasswordPage function.");
}

// Router'ın çağırması için global scope'a ekle
window.initializeForgotPasswordPage = window.initializeForgotPasswordPage; 