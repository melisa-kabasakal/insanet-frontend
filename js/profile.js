// js/profile.js - Profil sayfası için istemci taraflı mantık

document.addEventListener('DOMContentLoaded', () => {
    // Bu kod doğrudan çalıştırılmayacak, router tarafından tetiklenecek
    // initializeProfilePage fonksiyonu router.loadPage içinde çağrılacak
});

async function initializeProfilePage() {
    console.log("Initializing profile page...");
    
    // Oturum kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token bulunamadı, login sayfasına yönlendiriliyor...');
        window.location.href = '#/login';
        return;
    }

    // Token geçerliliğini kontrol et
    try {
        const isValid = await apiService.validateToken();
        if (!isValid) {
            throw new Error('Geçersiz token');
        }
    } catch (error) {
        console.error('Token doğrulama hatası:', error);
        localStorage.removeItem('token');
        window.location.href = '#/login';
        return;
    }

    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) {
        console.error("Profile container not found!");
        return;
    }

    const menuItems = profileContainer.querySelectorAll('.profile-menu-item');
    const contentArea = profileContainer.querySelector('#profile-section-content');
    const messageBadge = profileContainer.querySelector('.message-count-badge');

    // Kullanıcı rolü kontrolü ve menü düzenlemesi
    try {
        const userInfo = await apiService.getUserProfile();
        
        // Siparişlerim menüsünü sadece müteahhit rolündeki kullanıcılara göster
        const ordersMenuItem = profileContainer.querySelector('.profile-menu-item[data-section="orders"]');
        if (ordersMenuItem) {
            const parentLi = ordersMenuItem.parentElement;
            
            // Kullanıcı müteahhit değilse siparişlerim menüsünü gizle
            if (userInfo && userInfo.role !== 'contractor') {
                parentLi.style.display = 'none';
            } else {
                parentLi.style.display = 'list-item';
            }
        }
    } catch (error) {
        console.error("Error checking user role:", error);
    }

    // --- Bölüm Yükleme Fonksiyonu ---
    const loadSection = async (sectionId) => {
        console.log(`Loading section: ${sectionId}`);
        // Önce mevcut içeriği temizle
        contentArea.innerHTML = '<div class="loading-spinner-small"></div>'; // Küçük bir yükleme göstergesi

        // Aktif menü öğesini güncelle
        menuItems.forEach(item => item.classList.remove('active'));
        const activeMenuItem = profileContainer.querySelector(`.profile-menu-item[data-section="${sectionId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // İlgili şablonu bul ve içeriği yükle
        const template = document.getElementById(`profile-${sectionId}-template`);
        if (template) {
            contentArea.innerHTML = ''; // Yükleme göstergesini kaldır
            contentArea.appendChild(template.content.cloneNode(true));
            
            // Bölüme özel başlatma fonksiyonlarını çağır
            switch (sectionId) {
                case 'account':
                    await initializeAccountSection();
                    break;
                case 'messages':
                    await initializeMessagesSection();
                    break;
                case 'orders':
                    // Kullanıcı rolünü kontrol et ve sadece müteahhitse siparişleri yükle
                    try {
                        const userInfo = await apiService.getUserProfile();
                        if (userInfo && userInfo.role === 'contractor') {
                    await initializeOrdersSection();
                        } else {
                            contentArea.innerHTML = '<p>Bu bölüme erişim yetkiniz bulunmamaktadır. Siparişlerim özelliği sadece müteahhit kullanıcıları için kullanılabilir.</p>';
                        }
                    } catch (error) {
                        console.error("Error checking user role for orders section:", error);
                        contentArea.innerHTML = '<p>Kullanıcı bilgileri kontrol edilirken bir hata oluştu.</p>';
                    }
                    break;
                case 'password':
                    await initializePasswordSection();
                    break;
                case 'auth':
                    await initializeAuthSection();
                    break;
                case 'authorization':
                    await initializeAuthorizationSection();
                    break;
                case 'faq':
                    await initializeFaqSection();
                    break;
            }
        } else {
            console.error(`Template not found for section: profile-${sectionId}-template`);
            contentArea.innerHTML = '<p>Bu bölüm yüklenirken bir hata oluştu.</p>';
        }
         // URL hash'ini güncelle (isteğe bağlı, gezinme geçmişi için)
        // window.location.hash = `#/profile/${sectionId}`;
    };

    // --- Menü Tıklama Olayları ---
    menuItems.forEach(item => {
        const section = item.getAttribute('data-section');
        if (section) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                loadSection(section);
            });
        }
    });

    // --- Çıkış Butonu (Profil Sayfası Menüsü) --- 
    // Yorum satırları kaldırıldı ve işlevsellik eklendi.
    const logoutButton = profileContainer.querySelector('#logoutButton');
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault(); // Linkin varsayılan davranışını engelle (#/logout'a gitmesini)
            console.log("Logout button clicked on profile page");
            if (confirm("Çıkış yapmak istediğinizden emin misiniz?")) {
                try {
                    apiService.logout(); // API servisi üzerinden çıkış yap
                    window.location.hash = '#/'; // Ana sayfaya yönlendir
                    window.location.reload(); // Arayüzü güncellemek için sayfayı yenile
                } catch (error) {
                    console.error("Logout failed:", error);
                    alert("Çıkış işlemi sırasında bir hata oluştu.");
                }
            }
        });
    }

    // --- Bölüm Başlatma Fonksiyonları (Başlangıç) ---
    async function initializeAccountSection() {
        console.log("Initializing account section...");
        const form = document.getElementById('account-details-form');
        const profilePicPreview = document.getElementById('profile-pic-preview');
        const profilePicUpload = document.getElementById('profile-pic-upload');
        const uploadPicBtn = document.getElementById('upload-pic-btn');
        const sectionContent = document.getElementById('account-section');
        const saveButton = form.querySelector('.btn-save-profile');
        const fileInputs = form.querySelectorAll('input[type="file"][required]'); // Zorunlu dosya inputları

        if (!form || !profilePicPreview || !profilePicUpload || !uploadPicBtn || !sectionContent || !saveButton) {
            console.error("Account section elements not found!");
            if(contentArea) contentArea.innerHTML = '<p>Hesap bölümü yüklenirken bir hata oluştu (UI Elemanları Eksik).</p>';
            return;
        }

        // Avatar için hata durumu
        profilePicPreview.onerror = function() {
            console.warn('Profil resmi yüklenemedi, varsayılan kullanılıyor.');
            this.src = 'img/placeholder-avatar.svg'; // Alternatif bir placeholder veya stil ile değiştirilebilir
            this.onerror = null; // Sonsuz döngüyü engelle
        };

        // Gerekli alanları bul (metin ve dosya)
        const requiredTextFields = Array.from(form.querySelectorAll('input[required], textarea[required], select[required]')).filter(el => el.type !== 'file');
        const requiredFileFields = Array.from(fileInputs);

        // Form doğrulama ve buton durumunu güncelleme fonksiyonu
        const validateForm = () => {
            let allTextValid = true;
            requiredTextFields.forEach(field => {
                if (!field.value.trim()) {
                    allTextValid = false;
                    field.classList.add('is-invalid'); // Stil için sınıf ekle (opsiyonel)
                } else {
                    field.classList.remove('is-invalid');
                }
            });

            let allFilesValid = true;
            requiredFileFields.forEach(field => {
                // Dosya seçilmemiş VEYA geçersiz dosya seçilmişse (pdf olmayan)
                if (field.files.length === 0 || field.dataset.isInvalid === 'true') { 
                    allFilesValid = false;
                    field.classList.add('is-invalid'); // Stil için sınıf ekle (opsiyonel)
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            // Tüm metin alanları VE tüm dosya alanları geçerliyse butonu etkinleştir
            saveButton.disabled = !(allTextValid && allFilesValid);
        };

        // Başlangıçta butonu devre dışı bırak ve formu dinle
        saveButton.disabled = true; 
        form.addEventListener('input', validateForm); // Metin inputlarını dinle
        
        // Dosya yükleme gruplarını etkinleştir
        const fileUploadGroups = document.querySelectorAll('.file-upload-group');
        fileUploadGroups.forEach(group => {
            const fileInput = group.querySelector('input[type="file"]');
            const fileNameDisplay = group.querySelector('.file-name-display');
            const viewLink = group.querySelector('.view-uploaded');
            const progressBar = group.querySelector('.file-upload-progress-bar');
            
            if (fileInput) {
                fileInput.addEventListener('change', function() {
                    const file = this.files[0];
                    
                    if (file) {
                        // Dosya adını göster
                        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
                        
                        // Dosya tipini kontrol et
                        const isValid = validateFileTypes(this);
                        
                        if (isValid) {
                            // Dosya yükleme simülasyonu
                            if (progressBar) {
                                const progressContainer = progressBar.parentElement;
                                if (progressContainer) progressContainer.style.display = 'block';
                                
                                // Yükleme simülasyonu
                                simulateFileUpload(this, progressBar, null, () => {
                                    // Yükleme başarılı, görüntüleme bağlantısını göster
                                    if (viewLink) viewLink.style.display = 'inline-block';
                                    
                                    // Dosya geçerli işaretini ayarla (form doğrulama için)
                                    this.dataset.isInvalid = 'false';
                                    this.classList.remove('is-invalid');
                                });
                            }
                        } else {
                            // Geçersiz dosya
                            if (fileNameDisplay) fileNameDisplay.textContent = '';
                            if (viewLink) viewLink.style.display = 'none';
                            
                            // Form doğrulama için geçersiz işareti
                            this.dataset.isInvalid = 'true';
                            this.classList.add('is-invalid');
                            
                            // Kullanıcıya bildir
                            alert('Lütfen geçerli bir dosya formatı seçin.');
                        }
                    } else {
                        // Dosya seçilmemiş
                        if (fileNameDisplay) fileNameDisplay.textContent = '';
                        if (viewLink) viewLink.style.display = 'none';
                        
                        this.dataset.isInvalid = 'true'; // Zorunlu alan için
                        this.classList.add('is-invalid');
                    }
                    
                    // Form doğrulamasını güncelle
                    validateForm();
                });
            }
            
            // Görüntüleme bağlantısı tıklamaları
            if (viewLink) {
                viewLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Gerçek uygulamada, belge görüntüleme URL'si alınacak
                    // Burada sadece bildirim gösteriyoruz
                    alert('Belge görüntüleme özelliği entegre edilecek.');
                });
            }
        });

        // 1. Kullanıcı verilerini API'den çek
        try {
            showLoadingButton(saveButton); // Butonu yükleniyor durumuna al
            const userInfo = await apiService.getUserProfile(); 
            if (userInfo && userInfo.isLoggedIn) {
                // Form alanlarını doldur (yeni alanlar dahil)
                form.username.value = userInfo.username || '';
                form.name.value = userInfo.name || ''; // Ad Soyad
                form.email.value = userInfo.email || '';
                form.phone.value = userInfo.phone || '';
                form.role.value = userInfo.role || ''; // Görev
                form.companyName.value = userInfo.companyName || '';
                form.companyFullName.value = userInfo.companyFullName || ''; // Firma Tam Ünvanı
                form.taxId.value = userInfo.taxId || ''; // VKN
                
                profilePicPreview.src = userInfo.profilePictureUrl || 'img/default-avatar.png';
                
                // Yüklü belgeler için linkleri göster ve input'ları geçerli say (eğer yüklüyse)
                displayUploadedDocumentLinks(userInfo.documents, requiredFileFields);

                // Formu doldurduktan sonra doğrula
                validateForm(); 
            } else {
                 console.error("Kullanıcı bilgileri alınamadı veya giriş yapılmamış.");
                 sectionContent.innerHTML = '<p class="error-message">Hesap bilgileri yüklenemedi. Lütfen tekrar giriş yapmayı deneyin.</p>';
                 return; 
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            sectionContent.innerHTML = '<p class="error-message">Hesap bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
            return; 
        } finally {
            hideLoadingButton(saveButton);
        }

        // 2. Form gönderme olayını dinle
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Formu son bir kez daha doğrula (güvenlik için)
            validateForm();
            if (saveButton.disabled) {
                alert("Lütfen tüm zorunlu alanları doldurunuz ve geçerli PDF dosyaları yükleyiniz.");
                return;
            }

            const formData = new FormData(form);
            console.log("Updating profile with FormData...");
            
            try {
                showLoadingButton(saveButton);
                const updatedUser = await apiService.updateUserProfile(formData);
                console.log("Profile updated successfully:", updatedUser);
                alert("Bilgileriniz başarıyla güncellendi!"); // Mesaj güncellendi
                location.reload(); 
            } catch (error) {
                console.error("Error updating profile:", error);
                const errorMessage = error.message || 'Bilinmeyen bir hata oluştu.';
                alert(`Profil güncellenirken bir hata oluştu: ${errorMessage}`);
            } finally {
                hideLoadingButton(saveButton);
                 validateForm(); 
            }
        });

        // 3. Profil fotoğrafı yükleme
        uploadPicBtn.addEventListener('click', () => {
            profilePicUpload.click(); 
        });

        profilePicUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log("Selected file:", file.name);
                // Önizleme göster
                const reader = new FileReader();
                reader.onload = function(event) {
                    profilePicPreview.src = event.target.result;
                }
                reader.readAsDataURL(file);

                // API'ye yükle
                try {
                    // Yükleniyor durumu gösterilebilir
                    console.log("Uploading profile picture...");
                    const result = await apiService.uploadProfilePicture(file);
                    console.log("Upload result:", result);
                    if (result && result.profilePictureUrl) {
                        profilePicPreview.src = result.profilePictureUrl; // Yeni URL'yi kullan
                        alert("Profil fotoğrafı başarıyla yüklendi!");
                        // Header'daki profil resmini de güncellemek gerekebilir
                    } else {
                         alert("Fotoğraf yüklendi ancak URL alınamadı.");
                    }
                } catch (error) {
                    console.error("Error uploading profile picture:", error);
                    alert("Profil fotoğrafı yüklenirken bir hata oluştu: " + (error.message || 'Bilinmeyen hata'));
                    // Eski resmi geri yükle (eğer varsa)
                    try {
                        const currentUserInfo = await apiService.getUserProfile(); // getUserProfile kullan
                        profilePicPreview.src = currentUserInfo?.profilePictureUrl || 'img/default-avatar.png';
                    } catch (fetchError) {
                        console.error("Failed to fetch current user info after upload error:", fetchError);
                         profilePicPreview.src = 'img/default-avatar.png'; // Fallback
                    }
                } finally {
                     // Yükleniyor durumu kaldır
                }
            }
        });

        // Yüklü belge linklerini gösterme fonksiyonu (Güncellendi)
        function displayUploadedDocumentLinks(documents, fileInputs) {
            if (!documents) return;
            const viewLinks = form.querySelectorAll('.view-uploaded');
            viewLinks.forEach(link => {
                const docType = link.getAttribute('data-doc-type');
                const correspondingInput = form.querySelector(`#${docType}`); // İlgili input
                
                if (documents[docType]) { 
                     link.href = documents[docType]; 
                     link.style.display = 'inline-block';
                     link.target = '_blank'; 
                     const displaySpan = link.closest('.file-upload-group')?.querySelector('.file-name-display');
                     if(displaySpan) displaySpan.textContent = `Yüklü: ${documents[docType].split('/').pop()}`;
                     
                     // Eğer belge yüklüyse, ilgili input'u geçerli say ve stilini düzelt
                     if (correspondingInput) {
                         correspondingInput.dataset.isInvalid = 'false'; 
                         correspondingInput.classList.remove('is-invalid');
                         // Input'u required olmaktan çıkarmaya GEREK YOK, 
                         // validateForm zaten dosya yoksa veya invalid ise kontrol ediyor.
                     }
                     
                } else {
                    link.style.display = 'none';
                    // Yüklü belge yoksa ve input zorunluysa, geçersiz işaretle
                    if (correspondingInput && correspondingInput.required) {
                         correspondingInput.dataset.isInvalid = 'true';
                    }
                }
            });
            // Linkler gösterildikten sonra formu tekrar doğrula
            // validateForm(); // Bu satır validateForm'un içinde zaten çağrılıyor
        }
    }

    async function initializeMessagesSection() {
        console.log("Initializing messages section...");
        
        // DOM Elementleri
        const messagesSection = document.getElementById('messages-section');
        const messagesList = document.getElementById('messages-list');
        const messageView = document.getElementById('message-view');
        const messageCompose = document.getElementById('message-compose');
        const messageReply = document.getElementById('message-reply');
        const newMessageBtn = document.getElementById('new-message-btn');
        const cancelMessageBtn = document.getElementById('cancel-message-btn');
        const messageForm = document.getElementById('message-form');
        const replyForm = document.getElementById('reply-form');
        const messageTabs = document.querySelectorAll('.messages-tab');
        const messageSearch = document.getElementById('messages-search');
        const messageSearchBtn = document.getElementById('messages-search-btn');
        const recipientTypeSelect = document.getElementById('message-recipient-type');
        const recipientSelect = document.getElementById('message-recipient');
        
        // Mesaj dosya ekleri ile ilgili elementler
        const messageFile = document.getElementById('message-file');
        const attachmentList = document.getElementById('attachment-list');
        const replyFile = document.getElementById('reply-file');
        const replyAttachmentList = document.getElementById('reply-attachment-list');
        
        // Durumlar
        let currentTab = 'inbox';
        let searchQuery = '';
        let selectedMessageId = null;
        let currentUserType = '';
        
        // 1. Kullanıcı tipini öğren ve izin verilen alıcı tiplerini belirle
        const initializeRecipientTypes = async () => {
            try {
                const userInfo = await apiService.getUserProfile();
                currentUserType = userInfo.userType || '';
                
                if (recipientTypeSelect) {
                    recipientTypeSelect.innerHTML = '';
                    
                    // Kullanıcı rolüne göre mesajlaşılabilecek kullanıcı tiplerini belirle
                    let allowedTypes = [];
                    
                    switch (currentUserType) {
                        case 'contractor': // Müteahhit
                            allowedTypes = [
                                { value: 'supplier', label: 'Tedarikçi Firmalar' },
                                { value: 'logistics', label: 'Lojistik Firmalar' }
                            ];
                            break;
                        case 'supplier': // Tedarikçi
                            allowedTypes = [
                                { value: 'contractor', label: 'Müteahhit Firmalar' },
                                { value: 'logistics', label: 'Lojistik Firmalar' }
                            ];
                            break;
                        case 'logistics': // Lojistik
                            allowedTypes = [
                                { value: 'contractor', label: 'Müteahhit Firmalar' },
                                { value: 'supplier', label: 'Tedarikçi Firmalar' }
                            ];
                            break;
                        default:
                            console.warn("Bilinmeyen kullanıcı tipi:", currentUserType);
                            allowedTypes = [
                                { value: 'contractor', label: 'Müteahhit Firmalar' },
                                { value: 'supplier', label: 'Tedarikçi Firmalar' },
                                { value: 'logistics', label: 'Lojistik Firmalar' }
                            ];
                    }
                    
                    // Tip seçimini oluştur
                    recipientTypeSelect.innerHTML = '<option value="">Lütfen bir tür seçin</option>';
                    allowedTypes.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type.value;
                        option.textContent = type.label;
                        recipientTypeSelect.appendChild(option);
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };
        
        // 2. Seçilen alıcı tipine göre alıcıların listesini getir
        const loadRecipients = async (recipientType) => {
            if (!recipientSelect || !recipientType) return;
            
            try {
                recipientSelect.innerHTML = '<option value="">Yükleniyor...</option>';
                recipientSelect.disabled = true;
                
                const recipients = await apiService.getMessageRecipients(recipientType);
                
                recipientSelect.innerHTML = '<option value="">Bir alıcı seçin</option>';
                
                recipients.forEach(recipient => {
                    const option = document.createElement('option');
                    option.value = recipient.id;
                    option.textContent = recipient.name;
                    option.dataset.name = recipient.name;
                    option.dataset.type = recipient.type;
                    recipientSelect.appendChild(option);
                });
                
                recipientSelect.disabled = false;
            } catch (error) {
                console.error("Error loading recipients:", error);
                recipientSelect.innerHTML = '<option value="">Hata oluştu</option>';
                recipientSelect.disabled = false;
            }
        };
        
        // 3. Mesaj listesini yükle ve göster
        const loadMessages = async () => {
            if (!messagesList) return;
            
            try {
                messagesList.innerHTML = '<li class="loading-message">Mesajlar yükleniyor...</li>';
                
                const messages = await apiService.getMessages(currentTab, searchQuery);
                
                messagesList.innerHTML = '';
                
                if (messages.length === 0) {
                    messagesList.innerHTML = `<li class="empty-message">
                        ${currentTab === 'inbox' ? 'Gelen kutunuzda mesaj yok' : 'Gönderilmiş mesajınız yok'}
                    </li>`;
                    return;
                }
                
                messages.forEach(message => {
                    const messageItem = document.createElement('li');
                    messageItem.className = `message-item ${!message.read && currentTab === 'inbox' ? 'unread' : ''}`;
                    messageItem.dataset.id = message.id;
                    
                    const otherParty = currentTab === 'inbox' ? message.sender : message.recipient;
                    
                    messageItem.innerHTML = `
                        <div class="sender">${otherParty.name}</div>
                        <div class="subject">${message.subject}</div>
                        <div class="preview">${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}</div>
                        <div class="date">${formatDate(message.date)}</div>
                    `;
                    
                    messageItem.addEventListener('click', () => {
                        document.querySelectorAll('.message-item').forEach(item => item.classList.remove('active'));
                        messageItem.classList.add('active');
                        selectedMessageId = message.id;
                        viewMessage(message.id);
                    });
                    
                    messagesList.appendChild(messageItem);
                });
                
                // Eğer seçili bir mesaj varsa, seçili göster
                if (selectedMessageId) {
                    const selectedItem = messagesList.querySelector(`.message-item[data-id="${selectedMessageId}"]`);
                    if (selectedItem) {
                        selectedItem.classList.add('active');
                    }
                }
                
                // Okunmamış mesaj sayısını güncelle
                updateMessageBadge();
            } catch (error) {
                console.error("Error loading messages:", error);
                messagesList.innerHTML = '<li class="error-message">Mesajlar yüklenirken bir hata oluştu</li>';
            }
        };
        
        // 4. Bir mesajı görüntüle
        const viewMessage = async (messageId) => {
            if (!messageView || !messageId) return;
            
            try {
                // Mesaj görünümünü temizle ve yükleme göster
                messageView.innerHTML = '<div class="loading-spinner-small"></div>';
                
                // Mesaj içeriğini getir
                const message = await apiService.getMessage(messageId);
                
                // Mesaj içeriğini oluştur
                const otherParty = currentTab === 'inbox' ? message.sender : message.recipient;
                const messageDate = new Date(message.date);
                
                messageView.innerHTML = `
                    <div class="message-header">
                        <div class="subject">${message.subject}</div>
                        <div class="meta">
                            <span class="sender">${otherParty.name}</span> - 
                            <span class="date">${messageDate.toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                    <div class="message-body">${message.content.replace(/\n/g, '<br>')}</div>
                `;
                
                // Dosya ekleri varsa göster
                if (message.attachments && message.attachments.length > 0) {
                    const attachmentsSection = document.createElement('div');
                    attachmentsSection.className = 'message-attachments-view';
                    attachmentsSection.innerHTML = '<h4>Ekler</h4>';
                    
                    const attachmentsList = document.createElement('div');
                    attachmentsList.className = 'attachments-list';
                    
                    message.attachments.forEach(attachment => {
                        const attachmentItem = document.createElement('a');
                        attachmentItem.className = 'attachment-item';
                        attachmentItem.href = '#'; // Gerçek API'de dosya URL'si olacak
                        attachmentItem.onclick = (e) => {
                            e.preventDefault();
                            alert('Ek indirme özelliği henüz eklenmedi.');
                        };
                        
                        let icon = 'fas fa-file';
                        if (attachment.type.includes('pdf')) icon = 'fas fa-file-pdf';
                        else if (attachment.type.includes('image')) icon = 'fas fa-file-image';
                        else if (attachment.type.includes('spreadsheet') || attachment.type.includes('excel')) icon = 'fas fa-file-excel';
                        else if (attachment.type.includes('word')) icon = 'fas fa-file-word';
                        
                        attachmentItem.innerHTML = `<i class="${icon}"></i> ${attachment.name}`;
                        attachmentsList.appendChild(attachmentItem);
                    });
                    
                    attachmentsSection.appendChild(attachmentsList);
                    messageView.appendChild(attachmentsSection);
                }
                
                // Yanıt butonu ekle (sadece gelen mesajlara)
                if (currentTab === 'inbox') {
                    const replyButton = document.createElement('button');
                    replyButton.className = 'btn-reply';
                    replyButton.textContent = 'Yanıtla';
                    replyButton.onclick = () => showReplyForm(message);
                    messageView.appendChild(replyButton);
                }
                
                // Mesaj görünümlerini ayarla
                messageView.style.display = 'block';
                messageCompose.style.display = 'none';
                messageReply.style.display = 'none';
                
                // Mesajı okundu olarak işaretle ve sayacı güncelle
                if (currentTab === 'inbox' && !message.read) {
                    updateMessageBadge();
                }
            } catch (error) {
                console.error("Error viewing message:", error);
                messageView.innerHTML = '<div class="error-message">Mesaj yüklenirken bir hata oluştu</div>';
            }
        };
        
        // 5. Yeni mesaj formunu göster
        const showComposeForm = () => {
            if (!messageCompose) return;
            
            // Formu sıfırla
            if (messageForm) messageForm.reset();
            if (attachmentList) attachmentList.innerHTML = '';
            
            // Diğer görünümleri gizle, mesaj formunu göster
            messageView.style.display = 'none';
            messageCompose.style.display = 'block';
            messageReply.style.display = 'none';
        };
        
        // 6. Yanıt formunu göster
        const showReplyForm = (originalMessage) => {
            if (!messageReply || !replyForm) return;
            
            // Formu sıfırla
            replyForm.reset();
            if (replyAttachmentList) replyAttachmentList.innerHTML = '';
            
            // Yanıt formunu orijinal mesaj ID'si ile ilişkilendir
            replyForm.dataset.messageId = originalMessage.id;
            
            // Diğer görünümleri gizle, yanıt formunu göster
            messageView.style.display = 'none';
            messageCompose.style.display = 'none';
            messageReply.style.display = 'block';
        };
        
        // 7. Dosya eklentilerini işle
        const handleFileSelection = (fileInput, previewContainer, fileNameDisplay) => {
            if (!fileInput) return;
            
            fileInput.addEventListener('change', function() {
                // Dosya seçilmişse önizleme alanını göster, yoksa gizle
                if (previewContainer) {
                    if (this.files.length > 0) {
                        previewContainer.style.display = 'block';
                        renderFilePreview(this.files, previewContainer);
                    } else {
                        previewContainer.style.display = 'none';
                        previewContainer.innerHTML = '';
                    }
                }
                
                // Dosya adını göster (tekil dosya seçimi için)
                if (fileNameDisplay && this.files.length === 1) {
                    fileNameDisplay.textContent = this.files[0].name;
                }
                
                // Dosya formatını kontrol et
                validateFileTypes(this);
            });
        };

        // Seçilen dosyaların önizlemesini oluştur
        function renderFilePreview(files, container) {
            if (!container || !files.length) return;
            
            container.innerHTML = '';
            
            Array.from(files).forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item';
                
                // Dosya tipi için ikon sınıfını belirle
                let iconClass = 'fas fa-file';
                if (file.type.includes('pdf')) iconClass = 'fas fa-file-pdf';
                else if (file.type.includes('image')) iconClass = 'fas fa-file-image';
                else if (file.type.includes('video')) iconClass = 'fas fa-file-video';
                else if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) iconClass = 'fas fa-file-excel';
                else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fas fa-file-word';
                
                // Dosya boyutunu formatla (KB veya MB olarak)
                const fileSize = file.size < 1024 * 1024 
                    ? Math.round(file.size / 1024) + ' KB' 
                    : (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                
                fileItem.innerHTML = `
                    <span class="file-icon"><i class="${iconClass}"></i></span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${fileSize}</span>
                    <span class="file-remove" data-index="${index}"><i class="fas fa-times"></i></span>
                `;
                
                container.appendChild(fileItem);
            });
            
            // Dosya kaldırma butonu dinleyicileri
            container.querySelectorAll('.file-remove').forEach(btn => {
                btn.addEventListener('click', function() {
                    // Dosya kaldırma butonu tıklandığında, bu dosyayı dosya listesinden kaldırmak gerek
                    // Fakat FileList değiştirilemez olduğundan, dosya inputunu sıfırlayıp kullanıcının yeniden seçmesini istiyoruz
                    const fileInput = container.previousElementSibling.querySelector('input[type="file"]');
                    if (fileInput) {
                        fileInput.value = ''; // Dosya inputunu sıfırla
                        container.style.display = 'none';
                        container.innerHTML = '';
                    }
                });
            });
        }

        // Dosya tiplerini kontrol et
        function validateFileTypes(fileInput) {
            if (!fileInput || !fileInput.files.length) return true;
            
            const allowedTypes = fileInput.accept.split(',');
            const messageContainer = fileInput.parentElement.querySelector('.file-upload-message');
            let allValid = true;
            
            // Her dosyanın tipini kontrol et
            Array.from(fileInput.files).forEach(file => {
                const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                const mimeTypeValid = allowedTypes.some(type => {
                    // MIME tip kontrolü veya uzantı kontrolü
                    return file.type.match(new RegExp(type.replace('*', '.*').replace('.', '\\.'), 'i')) || 
                           type.toLowerCase() === fileExtension;
                });
                
                if (!mimeTypeValid) {
                    allValid = false;
                }
            });
            
            // Hata mesajını göster/gizle
            if (messageContainer) {
                if (!allValid) {
                    messageContainer.textContent = 'Hata: Lütfen sadece desteklenen dosya formatlarını yükleyin.';
                    messageContainer.className = 'file-upload-message file-upload-error';
                    // Dosya inputunu temizle
                    fileInput.value = '';
                    // Önizleme alanını temizle
                    const previewContainer = fileInput.closest('.form-group').querySelector('.file-preview-area');
                    if (previewContainer) {
                        previewContainer.style.display = 'none';
                        previewContainer.innerHTML = '';
                    }
                } else {
                    messageContainer.textContent = '';
                    messageContainer.className = 'file-upload-message';
                }
            }
            
            return allValid;
        }

        // Dosya yükleme simülasyonu
        function simulateFileUpload(fileInput, progressBar, messageContainer, callback) {
            if (!fileInput || !fileInput.files.length) return;
            
            const progressContainer = progressBar.parentElement;
            progressContainer.style.display = 'block';
            progressBar.style.width = '0%';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                progressBar.style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Yükleme başarılı mesajı
                    if (messageContainer) {
                        messageContainer.textContent = 'Dosyalar başarıyla yüklendi!';
                        messageContainer.className = 'file-upload-message file-upload-success';
                    }
                    
                    // Yükleme tamamlandıktan sonra geri çağrı fonksiyonunu çalıştır
                    if (typeof callback === 'function') {
                        setTimeout(() => {
                            callback();
                            // Yükleme çubuğunu gizle
                            progressContainer.style.display = 'none';
                            // Mesajı temizle
                            if (messageContainer) {
                                setTimeout(() => {
                                    messageContainer.textContent = '';
                                    messageContainer.className = 'file-upload-message';
                                }, 3000);
                            }
                        }, 500);
                    }
                }
            }, 50);
        }

        // Olay Dinleyicileri
        
        // 1. Sekme değiştirme
        messageTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                messageTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                loadMessages();
            });
        });
        
        // 2. Arama
        if (messageSearchBtn) {
            messageSearchBtn.addEventListener('click', () => {
                searchQuery = messageSearch.value.trim();
                loadMessages();
            });
        }
        
        if (messageSearch) {
            messageSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = messageSearch.value.trim();
                    loadMessages();
                }
            });
        }
        
        // 3. Yeni mesaj butonu
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', () => {
                showComposeForm();
            });
        }
        
        // 4. İptal butonu
        if (cancelMessageBtn) {
            cancelMessageBtn.addEventListener('click', () => {
                messageView.style.display = 'block';
                messageCompose.style.display = 'none';
                messageReply.style.display = 'none';
            });
        }
        
        // 5. Alıcı tipi değiştiğinde alıcıları yükle
        if (recipientTypeSelect) {
            recipientTypeSelect.addEventListener('change', () => {
                const selectedType = recipientTypeSelect.value;
                if (selectedType) {
                    loadRecipients(selectedType);
                } else {
                    recipientSelect.innerHTML = '<option value="">Lütfen önce alıcı türünü seçin</option>';
                    recipientSelect.disabled = true;
                }
            });
        }
        
        // 6. Mesaj gönderme formu
        if (messageForm) {
            messageForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const recipientId = recipientSelect.value;
                const recipientOption = recipientSelect.options[recipientSelect.selectedIndex];
                const recipientName = recipientOption ? recipientOption.dataset.name : '';
                const recipientType = recipientOption ? recipientOption.dataset.type : '';
                const subject = document.getElementById('message-subject').value;
                const content = document.getElementById('message-content').value;
                
                if (!recipientId || !subject || !content) {
                    alert('Lütfen tüm alanları doldurun.');
                    return;
                }
                
                try {
                    const sendButton = document.getElementById('send-message-btn');
                    if (sendButton) {
                        sendButton.disabled = true;
                        sendButton.textContent = 'Gönderiliyor...';
                    }
                    
                    // Dosya yükleme simülasyonu
                    const fileInput = document.getElementById('message-file');
                    const progressBar = fileInput.closest('.file-upload-container')?.querySelector('.file-upload-progress-bar');
                    const messageContainer = fileInput.closest('.file-upload-container')?.querySelector('.file-upload-message');
                    
                    if (fileInput && fileInput.files.length > 0 && progressBar) {
                        simulateFileUpload(fileInput, progressBar, messageContainer, async () => {
                            // Dosya yükleme tamamlanınca mesajı gönder
                            try {
                                // FormData oluştur
                                const formData = new FormData();
                                formData.append('recipientId', recipientId);
                                formData.append('recipientName', recipientName);
                                formData.append('recipientType', recipientType);
                                formData.append('subject', subject);
                                formData.append('content', content);
                                
                                // Dosya eklerini ekle
                                if (fileInput.files.length > 0) {
                                    Array.from(fileInput.files).forEach(file => {
                                        formData.append('files', file);
                                    });
                                }
                                
                                // Mesajı gönder
                                const response = await apiService.sendMessage(formData);
                                
                                if (response.success) {
                                    afterMessageSent();
                                }
                            } catch (error) {
                                console.error("Error sending message:", error);
                                alert('Mesaj gönderilirken bir hata oluştu.');
                                enableSendButton();
                            }
                        });
                    } else {
                        // Dosya yok, doğrudan mesajı gönder
                        // FormData oluştur
                        const formData = new FormData();
                        formData.append('recipientId', recipientId);
                        formData.append('recipientName', recipientName);
                        formData.append('recipientType', recipientType);
                        formData.append('subject', subject);
                        formData.append('content', content);
                        
                        // Mesajı gönder
                        const response = await apiService.sendMessage(formData);
                        
                        if (response.success) {
                            afterMessageSent();
                        }
                    }
                    
                    function afterMessageSent() {
                        // Gönderilen sekmesine geç ve mesajları yenile
                        messageTabs.forEach(tab => tab.classList.remove('active'));
                        const sentTab = document.querySelector('.messages-tab[data-tab="sent"]');
                        if (sentTab) sentTab.classList.add('active');
                        currentTab = 'sent';
                        loadMessages();
                        
                        // UI'ı sıfırla
                        messageView.style.display = 'block';
                        messageCompose.style.display = 'none';
                        messageReply.style.display = 'none';
                        
                        // Formu temizle
                        messageForm.reset();
                        if (attachmentList) {
                            attachmentList.style.display = 'none';
                            attachmentList.innerHTML = '';
                        }
                        
                        enableSendButton();
                    }
                    
                    function enableSendButton() {
                        const sendButton = document.getElementById('send-message-btn');
                        if (sendButton) {
                            sendButton.disabled = false;
                            sendButton.textContent = 'Gönder';
                        }
                    }
                    
                } catch (error) {
                    console.error("Error sending message:", error);
                    alert('Mesaj gönderilirken bir hata oluştu.');
                }
            });
        }
        
        // 7. Yanıt gönderme formu
        if (replyForm) {
            replyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const messageId = replyForm.dataset.messageId;
                const content = document.getElementById('reply-content').value;
                
                if (!messageId || !content) {
                    alert('Lütfen mesaj içeriğini girin.');
                    return;
                }
                
                try {
                    const replyButton = document.getElementById('send-reply-btn');
                    if (replyButton) {
                        replyButton.disabled = true;
                        replyButton.textContent = 'Gönderiliyor...';
                    }
                    
                    // Dosya yükleme simülasyonu
                    const fileInput = document.getElementById('reply-file');
                    const progressBar = fileInput.closest('.file-upload-container')?.querySelector('.file-upload-progress-bar');
                    const messageContainer = fileInput.closest('.file-upload-container')?.querySelector('.file-upload-message');
                    
                    if (fileInput && fileInput.files.length > 0 && progressBar) {
                        simulateFileUpload(fileInput, progressBar, messageContainer, async () => {
                            // Dosya yükleme tamamlanınca yanıtı gönder
                            try {
                                // FormData oluştur
                                const formData = new FormData();
                                formData.append('content', content);
                                
                                // Dosya eklerini ekle
                                if (fileInput.files.length > 0) {
                                    Array.from(fileInput.files).forEach(file => {
                                        formData.append('files', file);
                                    });
                                }
                                
                                // Yanıtı gönder
                                const response = await apiService.replyToMessage(messageId, formData);
                                
                                if (response.success) {
                                    afterReplySent();
                                }
                            } catch (error) {
                                console.error("Error sending reply:", error);
                                alert('Yanıt gönderilirken bir hata oluştu.');
                                enableReplyButton();
                            }
                        });
                    } else {
                        // Dosya yok, doğrudan yanıtı gönder
                        // FormData oluştur
                        const formData = new FormData();
                        formData.append('content', content);
                        
                        // Yanıtı gönder
                        const response = await apiService.replyToMessage(messageId, formData);
                        
                        if (response.success) {
                            afterReplySent();
                        }
                    }
                    
                    function afterReplySent() {
                        // Gönderilen sekmesine geç ve mesajları yenile
                        messageTabs.forEach(tab => tab.classList.remove('active'));
                        const sentTab = document.querySelector('.messages-tab[data-tab="sent"]');
                        if (sentTab) sentTab.classList.add('active');
                        currentTab = 'sent';
                        loadMessages();
                        
                        // UI'ı sıfırla
                        messageView.style.display = 'block';
                        messageCompose.style.display = 'none';
                        messageReply.style.display = 'none';
                        
                        // Formu temizle
                        replyForm.reset();
                        if (replyAttachmentList) {
                            replyAttachmentList.style.display = 'none';
                            replyAttachmentList.innerHTML = '';
                        }
                        
                        enableReplyButton();
                    }
                    
                    function enableReplyButton() {
                        const replyButton = document.getElementById('send-reply-btn');
                        if (replyButton) {
                            replyButton.disabled = false;
                            replyButton.textContent = 'Yanıtla';
                        }
                    }
                    
                } catch (error) {
                    console.error("Error sending reply:", error);
                    alert('Yanıt gönderilirken bir hata oluştu.');
                }
            });
        }
        
        // Mesaj gönderme
        handleFileSelection(messageFile, attachmentList);
        
        // Yanıt gönderme
        handleFileSelection(replyFile, replyAttachmentList);
        
        // Başlangıç fonksiyonlarını çağır
        await initializeRecipientTypes();
        await loadMessages();
        
        // Başlangıçta boş mesaj görünümü göster
        if (messageView) {
            messageView.innerHTML = `
                <div class="empty-message-view">
                    <i class="fas fa-envelope"></i>
                    <p>Okumak için bir mesaj seçin veya yeni mesaj oluşturun</p>
                </div>
            `;
        }
    }

    async function initializeOrdersSection() {
        console.log("Initializing orders section...");
        
        // UI elemanlarını seç
        const ordersSection = document.getElementById('orders-section');
        const queryForm = document.getElementById('order-query-form');
        const tableBody = document.getElementById('orders-table-body');
        const totalCountElement = document.getElementById('orders-total-count');
        const paginationContainer = document.getElementById('orders-pagination');
        const ordersPerPageSelect = document.getElementById('orders-per-page');
        const orderDetailModal = document.getElementById('order-detail-modal');
        const orderDetailBody = document.getElementById('order-detail-body');
        const closeOrderDetail = document.querySelector('.close-order-detail');
        
        if (!ordersSection || !queryForm || !tableBody || !totalCountElement || !paginationContainer) {
            console.error("Orders section UI elements not found!");
            return;
        }
        
        // Sayfalama durumu
        const paginationState = {
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: 0
        };
        
        // Tüm sipariş verileri
        let allOrders = [];
        
        // Fiyat formatlaması
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
        };
        
        // Tarih formatlaması
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR');
        };
        
        // Sipariş statüsüne göre CSS sınıfı
        const getStatusClass = (status) => {
            switch(status) {
                case 'Kesinleşmiş Olan Sipariş':
                    return 'order-status-confirmed';
                case 'Ön Sipariş':
                    return 'order-status-pending';
                case 'Teslim Edilen Sipariş':
                    return 'order-status-delivered';
                case 'Yolda Olan Sipariş':
                    return 'order-status-processing';
                case 'İptal Edilen':
                    return 'order-status-cancelled';
                default:
                    return '';
            }
        };
        
        // Modal açma işlevi
        const openOrderDetailModal = async (orderId) => {
            try {
                // Modal içeriğini temizle ve yükleniyor göster
                orderDetailBody.innerHTML = '<div class="loading-spinner-small"></div>';
                orderDetailModal.style.display = 'block';
                
                // API'den sipariş detayını getir
                const response = await apiService.getOrderDetails(orderId);
                
                if (response.success && response.order) {
                    const order = response.order;
                    let productRows = '';
                    
                    // Ürün satırlarını oluştur
                    order.products.forEach(product => {
                        productRows += `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.quantity}</td>
                                <td>${formatCurrency(product.price)}</td>
                                <td>${formatCurrency(product.total)}</td>
                            </tr>
                        `;
                    });
                    
                    // Modal içeriğini oluştur
                    orderDetailBody.innerHTML = `
                        <div class="order-info-section">
                            <h4>Sipariş Bilgileri</h4>
                            <div class="order-info-grid">
                                <div class="order-info-item">
                                    <span class="order-info-label">Sipariş No:</span>
                                    <span class="order-info-value">${order.id}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">Tarih:</span>
                                    <span class="order-info-value">${formatDate(order.date)}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">Tedarikçi:</span>
                                    <span class="order-info-value">${order.supplier}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">Durum:</span>
                                    <span class="order-info-value">
                                        <span class="order-status ${getStatusClass(order.status)}">${order.status}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="order-info-section">
                            <h4>Ürünler</h4>
                            <table class="order-products-table">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th>Adet</th>
                                        <th>Birim Fiyat</th>
                                        <th>Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productRows}
                                </tbody>
                            </table>
                            <div class="order-detail-totals">
                                <div class="order-grand-total">Toplam Tutar: ${formatCurrency(order.amount)}</div>
                            </div>
                        </div>
                        
                        <div class="order-detail-buttons">
                            <button type="button" class="order-detail-btn secondary close-modal-btn">Kapat</button>
                        </div>
                    `;
                    
                    // Kapat butonuna tıklama olayı ekle
                    const closeModalBtn = orderDetailBody.querySelector('.close-modal-btn');
                    if (closeModalBtn) {
                        closeModalBtn.addEventListener('click', () => {
                            orderDetailModal.style.display = 'none';
                        });
                    }
                } else {
                    orderDetailBody.innerHTML = '<p>Sipariş detayları yüklenirken bir hata oluştu.</p>';
                }
            } catch (error) {
                console.error("Error fetching order details:", error);
                orderDetailBody.innerHTML = '<p>Sipariş detayları yüklenirken bir hata oluştu.</p>';
            }
        };
        
        // Sayfalama kontrollerini oluştur
        const renderPagination = () => {
            paginationContainer.innerHTML = '';
            
            // Toplam sayfa sayısını hesapla
            paginationState.totalPages = Math.ceil(paginationState.totalItems / paginationState.itemsPerPage);
            
            // Önceki sayfa butonu
            const prevPageItem = document.createElement('div');
            prevPageItem.className = `page-item ${paginationState.currentPage === 1 ? 'disabled' : ''}`;
            prevPageItem.innerHTML = `<button class="page-link" ${paginationState.currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
            prevPageItem.addEventListener('click', () => {
                if (paginationState.currentPage > 1) {
                    paginationState.currentPage--;
                    renderOrders();
                }
            });
            paginationContainer.appendChild(prevPageItem);
            
            // Sayfa numaraları
            for (let i = 1; i <= paginationState.totalPages; i++) {
                // Çok fazla sayfa varsa sadece belirli sayfaları göster
                if (
                    i === 1 || 
                    i === paginationState.totalPages || 
                    (i >= paginationState.currentPage - 2 && i <= paginationState.currentPage + 2)
                ) {
                    const pageItem = document.createElement('div');
                    pageItem.className = `page-item ${i === paginationState.currentPage ? 'active' : ''}`;
                    pageItem.innerHTML = `<button class="page-link">${i}</button>`;
                    pageItem.addEventListener('click', () => {
                        paginationState.currentPage = i;
                        renderOrders();
                    });
                    paginationContainer.appendChild(pageItem);
                } else if (
                    (i === paginationState.currentPage - 3 && paginationState.currentPage > 3) || 
                    (i === paginationState.currentPage + 3 && paginationState.currentPage < paginationState.totalPages - 2)
                ) {
                    const ellipsisItem = document.createElement('div');
                    ellipsisItem.className = 'page-item disabled';
                    ellipsisItem.innerHTML = '<span class="page-link">...</span>';
                    paginationContainer.appendChild(ellipsisItem);
                }
            }
            
            // Sonraki sayfa butonu
            const nextPageItem = document.createElement('div');
            nextPageItem.className = `page-item ${paginationState.currentPage === paginationState.totalPages ? 'disabled' : ''}`;
            nextPageItem.innerHTML = `<button class="page-link" ${paginationState.currentPage === paginationState.totalPages ? 'disabled' : ''}>&raquo;</button>`;
            nextPageItem.addEventListener('click', () => {
                if (paginationState.currentPage < paginationState.totalPages) {
                    paginationState.currentPage++;
                    renderOrders();
                }
            });
            paginationContainer.appendChild(nextPageItem);
        };
        
        // Siparişleri tabloya render et
        const renderOrders = () => {
            tableBody.innerHTML = '';
            
            // Toplam sipariş sayısını güncelle
            totalCountElement.textContent = `Toplam: ${paginationState.totalItems} sipariş`;
            
            // Sayfa başına öğe sayısını güncelle
            if (!allOrders.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">Sipariş bulunamadı.</td>
                    </tr>
                `;
                paginationContainer.innerHTML = '';
                return;
            }
            
            // Geçerli sayfadaki öğeleri hesapla
            const startIndex = (paginationState.currentPage - 1) * paginationState.itemsPerPage;
            const endIndex = Math.min(startIndex + paginationState.itemsPerPage, paginationState.totalItems);
            const currentPageOrders = allOrders.slice(startIndex, endIndex);
            
            // Tabloyu oluştur
            currentPageOrders.forEach(order => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${formatCurrency(order.amount)}</td>
                    <td>${order.itemCount}</td>
                    <td>${order.supplier}</td>
                    <td><span class="order-status ${getStatusClass(order.status)}">${order.status}</span></td>
                    <td>
                        <button class="order-action-btn view" data-order-id="${order.id}" title="Detayları Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Görüntüle butonlarına tıklama olayları ekle
            const viewButtons = tableBody.querySelectorAll('.order-action-btn.view');
            viewButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const orderId = button.getAttribute('data-order-id');
                    openOrderDetailModal(orderId);
                });
            });
            
            // Sayfalama kontrollerini güncelle
            renderPagination();
        };
        
        // API'den siparişleri getir
        const fetchOrders = async (filters = {}) => {
            try {
                tableBody.innerHTML = '<tr><td colspan="7" class="orders-loading"><div class="loading-spinner-small"></div> Siparişler yükleniyor...</td></tr>';
                
                const response = await apiService.getOrders(filters);
                
                if (response.success && response.orders) {
                    allOrders = response.orders;
                    paginationState.totalItems = response.totalCount;
                    paginationState.currentPage = 1; // Filtreleme yapıldığında ilk sayfaya dön
                    renderOrders();
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Siparişler yüklenirken bir hata oluştu.</td></tr>';
                }
        } catch (error) {
            console.error("Error fetching orders:", error);
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Siparişler yüklenirken bir hata oluştu.</td></tr>';
            }
        };
        
        // Olay dinleyicileri
        
        // Sorgulama formu gönderildiğinde
        queryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Form verilerini al
            const formData = new FormData(queryForm);
            const filters = {
                orderNumber: formData.get('orderNumber'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                status: formData.get('status')
            };
            
            // Siparişleri filtrele
            await fetchOrders(filters);
        });
        
        // Temizle butonuna tıklandığında
        const clearButton = queryForm.querySelector('#clear-order-btn');
        clearButton.addEventListener('click', () => {
            queryForm.reset();
            fetchOrders(); // Filtreleri temizleyip tüm siparişleri getir
        });
        
        // Kayıt sayısı değiştiğinde
        ordersPerPageSelect.addEventListener('change', () => {
            paginationState.itemsPerPage = parseInt(ordersPerPageSelect.value);
            paginationState.currentPage = 1; // İlk sayfaya dön
            renderOrders();
        });
        
        // Modal kapatma
        if (closeOrderDetail) {
            closeOrderDetail.addEventListener('click', () => {
                orderDetailModal.style.display = 'none';
            });
        }
        
        // Modal dışına tıklanınca kapat
        window.addEventListener('click', (e) => {
            if (e.target === orderDetailModal) {
                orderDetailModal.style.display = 'none';
            }
        });
        
        // Başlangıçta tüm siparişleri getir
        await fetchOrders();
        console.log("Orders section initialized.");
    }

    async function initializeAuthSection() {
        console.log("Auth section initialized");
        // Yönlendirme yap (bu bölüm eski, yerine authorization kullanılıyor)
        window.location.hash = '#/profile/authorization';
    }

    // Yetkilendirme İşlemleri Bölümü
    async function initializeAuthorizationSection() {
        console.log("Yetkilendirme İşlemleri bölümü başlatılıyor...");
        
        const section = document.getElementById('authorization-section');
        if (!section) {
            console.error("Yetkilendirme bölümü bulunamadı");
            return;
        }

        const userCountElement = document.getElementById('user-count');
        const userTableBody = document.getElementById('user-table-body');
        const addUserBtn = document.getElementById('add-user-btn');
        const userModal = document.getElementById('user-modal');
        const userForm = document.getElementById('user-form');
        const closeUserModalBtn = document.getElementById('close-user-modal');
        const saveUserBtn = document.getElementById('save-user-btn');
        const cancelUserBtn = document.getElementById('cancel-user-btn');
        const confirmModal = document.getElementById('confirm-modal');
        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        
        let currentUsers = [];
        let editingUserId = null;
        let userToDeleteId = null;

        // Kullanıcıları yükle
        const loadUsers = async () => {
            try {
                showLoadingState(section);
                const response = await apiService.getCompanyUsers();
                
                if (response.success) {
                    currentUsers = response.users;
                    renderUsers(currentUsers);
                    updateUserCount(currentUsers.length, response.maxAllowed);
                } else {
                    showNotification('Kullanıcılar yüklenirken bir hata oluştu.', 'error');
                }
        } catch (error) {
                console.error('Kullanıcılar yüklenirken hata oluştu:', error);
                showNotification('Kullanıcılar yüklenirken bir hata oluştu.', 'error');
            } finally {
                hideLoadingState(section);
            }
        };

        // Kullanıcı sayısını güncelle
        const updateUserCount = (count, max) => {
            if (userCountElement) {
                userCountElement.innerHTML = `<i class="fas fa-users"></i> ${count}/${max} Kullanıcı`;
            }
        };

        // Kullanıcıları tabloya render et
        const renderUsers = (users) => {
            if (!userTableBody) return;
            
            userTableBody.innerHTML = '';
            
            if (users.length === 0) {
                // Boş durum göster
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="6">
                        <div class="user-empty-state">
                            <i class="fas fa-user-slash"></i>
                            <h4>Henüz Kullanıcı Eklenmemiş</h4>
                            <p>Firma çalışanlarınızı yetkilendirmek için yeni bir kullanıcı ekleyin.</p>
                            <button class="authorization-add-btn" id="empty-add-user-btn">
                                <i class="fas fa-user-plus"></i> Kullanıcı Ekle
                            </button>
                        </div>
                    </td>
                `;
                userTableBody.appendChild(emptyRow);
                
                // Boş durumdaki ekleme butonuna event listener ekle
                const emptyAddBtn = document.getElementById('empty-add-user-btn');
                if (emptyAddBtn) {
                    emptyAddBtn.addEventListener('click', openAddUserModal);
                }
                
                return;
            }
            
            // Kullanıcıları listele
            users.forEach(user => {
                const row = document.createElement('tr');
                
                // Kullanıcı adının ilk harfini al (avatar için)
                const initials = user.name.split(' ').map(part => part[0]).join('').toUpperCase();
                
                // Rol CSS sınıfını belirle
                const roleClass = user.roleType === 'admin' ? 'user-role-admin' : 
                                user.roleType === 'editor' ? 'user-role-editor' : 'user-role-viewer';
                
                // Durum CSS sınıfını belirle
                const statusClass = user.status === 'active' ? 'user-status-active' : 
                                  user.status === 'inactive' ? 'user-status-inactive' : 'user-status-pending';
                
                // Ekleme tarihini formatla
                const addedDate = new Date(user.addedDate);
                const formattedDate = `${addedDate.getDate().toString().padStart(2, '0')}.${(addedDate.getMonth() + 1).toString().padStart(2, '0')}.${addedDate.getFullYear()}`;
                
                row.innerHTML = `
                    <td>
                        <div class="user-name">
                            <div class="user-avatar">${initials}</div>
                            <div class="user-info">
                                <span>${user.name}</span>
                                <span class="user-position">${user.position}</span>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="user-role ${roleClass}">${user.roleType === 'admin' ? 'Yönetici' : user.roleType === 'editor' ? 'Düzenleyici' : 'Görüntüleyici'}</span></td>
                    <td><span class="user-status ${statusClass}"></span>${user.status === 'active' ? 'Aktif' : user.status === 'inactive' ? 'Pasif' : 'Beklemede'}</td>
                    <td class="user-date">${formattedDate}</td>
                    <td>
                        <div class="user-actions">
                            <button class="user-action-btn edit" data-user-id="${user.id}" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${!user.isOwner ? `
                            <button class="user-action-btn delete" data-user-id="${user.id}" title="Sil">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                
                userTableBody.appendChild(row);
            });
            
            // Düzenleme butonlarına event listener ekle
            document.querySelectorAll('.user-action-btn.edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = parseInt(btn.getAttribute('data-user-id'));
                    const user = currentUsers.find(u => u.id === userId);
                    if (user) {
                        openEditUserModal(user);
                    }
                });
            });
            
            // Silme butonlarına event listener ekle
            document.querySelectorAll('.user-action-btn.delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = parseInt(btn.getAttribute('data-user-id'));
                    openDeleteConfirmation(userId);
                });
            });
        };
        
        // Yeni kullanıcı ekleme modalını aç
        const openAddUserModal = () => {
            editingUserId = null;
            userForm.reset();
            
            // Form elemanlarını varsayılan değerlere ayarla
            document.getElementById('user-role').value = 'editor';
            
            // İzinleri varsayılan olarak belirle
            document.getElementById('perm-users').checked = false;
            document.getElementById('perm-orders').checked = true;
            document.getElementById('perm-products').checked = true;
            document.getElementById('perm-messages').checked = true;
            document.getElementById('perm-reports').checked = false;
            
            // Status'u varsayılan olarak aktif yap
            document.getElementById('user-status').value = 'active';
            
            // Modal başlığını güncelle
            document.getElementById('user-modal-title').textContent = 'Yeni Kullanıcı Ekle';
            
            // Kaydet butonunu güncelle
            saveUserBtn.textContent = 'Kullanıcı Ekle';
            
            // Modalı göster
            userModal.classList.add('show');
        };
        
        // Kullanıcı düzenleme modalını aç
        const openEditUserModal = (user) => {
            editingUserId = user.id;
            
            // Form elemanlarını kullanıcı verileriyle doldur
            document.getElementById('user-name').value = user.name;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-position').value = user.position;
            document.getElementById('user-role').value = user.roleType;
            document.getElementById('user-status').value = user.status;
            
            // İzinleri ayarla
            document.getElementById('perm-users').checked = user.permissions.users;
            document.getElementById('perm-orders').checked = user.permissions.orders;
            document.getElementById('perm-products').checked = user.permissions.products;
            document.getElementById('perm-messages').checked = user.permissions.messages;
            document.getElementById('perm-reports').checked = user.permissions.reports;
            
            // Ana kullanıcıysa (owner), bazı alanları devre dışı bırak
            const isOwner = user.isOwner;
            if (isOwner) {
                document.getElementById('user-role').disabled = true;
                document.getElementById('perm-users').disabled = true;
                document.getElementById('user-status').disabled = true;
            } else {
                document.getElementById('user-role').disabled = false;
                document.getElementById('perm-users').disabled = false;
                document.getElementById('user-status').disabled = false;
            }
            
            // Modal başlığını güncelle
            document.getElementById('user-modal-title').textContent = 'Kullanıcıyı Düzenle';
            
            // Kaydet butonunu güncelle
            saveUserBtn.textContent = 'Değişiklikleri Kaydet';
            
            // Modalı göster
            userModal.classList.add('show');
        };
        
        // Silme onay modalını aç
        const openDeleteConfirmation = (userId) => {
            userToDeleteId = userId;
            const user = currentUsers.find(u => u.id === userId);
            
            // Silme onay mesajını güncelle
            document.getElementById('confirm-message').textContent = `"${user.name}" adlı kullanıcıyı silmek istediğinize emin misiniz?`;
            
            // Modalı göster
            confirmModal.classList.add('show');
        };
        
        // Kullanıcı modalını kapat
        const closeUserModal = () => {
            userModal.classList.remove('show');
            editingUserId = null;
            userForm.reset();
            
            // Eğer devre dışı bırakılan elementler varsa, aktifleştir
            document.getElementById('user-role').disabled = false;
            document.getElementById('perm-users').disabled = false;
            document.getElementById('user-status').disabled = false;
        };
        
        // Onay modalını kapat
        const closeConfirmModal = () => {
            confirmModal.classList.remove('show');
            userToDeleteId = null;
        };
        
        // Form verilerini topla
        const getFormData = () => {
            const name = document.getElementById('user-name').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const position = document.getElementById('user-position').value.trim();
            const roleType = document.getElementById('user-role').value;
            const status = document.getElementById('user-status').value;
            
            // İzinleri topla
            const permissions = {
                users: document.getElementById('perm-users').checked,
                orders: document.getElementById('perm-orders').checked,
                products: document.getElementById('perm-products').checked,
                messages: document.getElementById('perm-messages').checked,
                reports: document.getElementById('perm-reports').checked,
            };
            
            return {
                name,
                email,
                position,
                roleType,
                status,
                permissions
            };
        };
        
        // Form doğrulama
        const validateForm = () => {
            let isValid = true;
            const name = document.getElementById('user-name');
            const email = document.getElementById('user-email');
            const position = document.getElementById('user-position');
            
            // Ad-soyad doğrulama
            if (!name.value.trim()) {
                name.classList.add('is-invalid');
                document.getElementById('user-name-feedback').style.display = 'block';
                isValid = false;
            } else {
                name.classList.remove('is-invalid');
                document.getElementById('user-name-feedback').style.display = 'none';
            }
            
            // E-posta doğrulama
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
                email.classList.add('is-invalid');
                document.getElementById('user-email-feedback').style.display = 'block';
                isValid = false;
            } else {
                email.classList.remove('is-invalid');
                document.getElementById('user-email-feedback').style.display = 'none';
            }
            
            // Pozisyon doğrulama
            if (!position.value.trim()) {
                position.classList.add('is-invalid');
                document.getElementById('user-position-feedback').style.display = 'block';
                isValid = false;
            } else {
                position.classList.remove('is-invalid');
                document.getElementById('user-position-feedback').style.display = 'none';
            }
            
            return isValid;
        };
        
        // Kullanıcı kaydet fonksiyonu
        const saveUser = async () => {
            // Form doğrulama
            if (!validateForm()) return;
            
            const userData = getFormData();
            
            try {
                // Buton yükleme durumuna geçir
                showLoadingButton(saveUserBtn);
                
                if (editingUserId) {
                    // Mevcut kullanıcı güncelleme
                    const response = await apiService.updateCompanyUser(editingUserId, userData);
                    
                    if (response.success) {
                        showNotification('Kullanıcı başarıyla güncellendi.', 'success');
                        await loadUsers();
                        closeUserModal();
                    } else {
                        showNotification(response.message || 'Kullanıcı güncellenirken bir hata oluştu.', 'error');
                    }
                } else {
                    // Yeni kullanıcı ekleme
                    const response = await apiService.addCompanyUser(userData);
                    
                    if (response.success) {
                        showNotification('Kullanıcı başarıyla eklendi.', 'success');
                        await loadUsers();
                        closeUserModal();
                    } else {
                        showNotification(response.message || 'Kullanıcı eklenirken bir hata oluştu.', 'error');
                    }
                }
            } catch (error) {
                console.error('Kullanıcı kaydedilirken hata:', error);
                showNotification('İşlem sırasında bir hata oluştu.', 'error');
            } finally {
                hideLoadingButton(saveUserBtn, editingUserId ? 'Değişiklikleri Kaydet' : 'Kullanıcı Ekle');
            }
        };
        
        // Kullanıcı silme fonksiyonu
        const deleteUser = async () => {
            if (!userToDeleteId) return;
            
            try {
                // Buton yükleme durumuna geçir
                showLoadingButton(confirmDeleteBtn);
                
                const response = await apiService.deleteCompanyUser(userToDeleteId);
                
                if (response.success) {
                    showNotification('Kullanıcı başarıyla silindi.', 'success');
                    await loadUsers();
                    closeConfirmModal();
                } else {
                    showNotification(response.message || 'Kullanıcı silinirken bir hata oluştu.', 'error');
                }
            } catch (error) {
                console.error('Kullanıcı silinirken hata:', error);
                showNotification('İşlem sırasında bir hata oluştu.', 'error');
            } finally {
                hideLoadingButton(confirmDeleteBtn, 'Sil');
                closeConfirmModal();
            }
        };
        
        // Yükleme durumlarını yönet
        const showLoadingState = (container) => {
            const loadingEl = document.createElement('div');
            loadingEl.className = 'loading-spinner';
            loadingEl.innerHTML = '<div class="spinner"></div>';
            container.appendChild(loadingEl);
        };
        
        const hideLoadingState = (container) => {
            const loadingEl = container.querySelector('.loading-spinner');
            if (loadingEl) {
                loadingEl.remove();
            }
        };
        
        // Event listener'ları ekle
        if (addUserBtn) {
            addUserBtn.addEventListener('click', openAddUserModal);
        }
        
        if (closeUserModalBtn) {
            closeUserModalBtn.addEventListener('click', closeUserModal);
        }
        
        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', closeUserModal);
        }
        
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveUser();
            });
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', deleteUser);
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', closeConfirmModal);
        }
        
        // Sayfa dışı tıklamalarda modalları kapat
        window.addEventListener('click', (e) => {
            if (e.target === userModal) {
                closeUserModal();
            }
            
            if (e.target === confirmModal) {
                closeConfirmModal();
            }
        });
        
        // Input alanları için validasyon dinle
        ['user-name', 'user-email', 'user-position'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    if (input.classList.contains('is-invalid')) {
                        input.classList.remove('is-invalid');
                        document.getElementById(`${id}-feedback`).style.display = 'none';
                    }
                });
            }
        });
        
        // Role değiştiğinde izinleri otomatik ayarla
        const roleSelect = document.getElementById('user-role');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                const role = roleSelect.value;
                
                // "users" izni için checkbox
                const usersPermCheckbox = document.getElementById('perm-users');
                
                // Rol admin ise, users iznini otomatik olarak aktif yap ve devre dışı bırak
                if (role === 'admin') {
                    document.getElementById('perm-users').checked = true;
                    document.getElementById('perm-orders').checked = true;
                    document.getElementById('perm-products').checked = true;
                    document.getElementById('perm-messages').checked = true;
                    document.getElementById('perm-reports').checked = true;
                } else if (role === 'editor') {
                    document.getElementById('perm-users').checked = false;
                    document.getElementById('perm-orders').checked = true;
                    document.getElementById('perm-products').checked = true;
                    document.getElementById('perm-messages').checked = true;
                    document.getElementById('perm-reports').checked = false;
                } else if (role === 'viewer') {
                    document.getElementById('perm-users').checked = false;
                    document.getElementById('perm-orders').checked = false;
                    document.getElementById('perm-products').checked = false;
                    document.getElementById('perm-messages').checked = true;
                    document.getElementById('perm-reports').checked = false;
                }
            });
        }
        
        // Kullanıcıları yükle
        await loadUsers();
    }

    async function initializeFaqSection() {
        console.log("Initializing FAQ section...");
        const searchInput = document.getElementById('faq-search-input');
        const searchBtn = document.getElementById('faq-search-btn');
        const faqContent = document.getElementById('faq-content');
        
        if(!searchInput || !searchBtn || !faqContent) return;

        const displayFaqs = (faqs) => {
            faqContent.innerHTML = ''; // Önceki içeriği temizle
            if (!faqs || faqs.length === 0) {
                 faqContent.innerHTML = '<p>Soru bulunamadı.</p>';
                 return;
            }
            const faqList = document.createElement('ul');
            faqList.className = 'faq-list';
            faqs.forEach(faq => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <details>
                        <summary>${faq.question}</summary>
                        <p>${faq.answer}</p>
                    </details>
                `;
                faqList.appendChild(listItem);
            });
            faqContent.appendChild(faqList);
        };

        const fetchAndDisplayFaqs = async (query = '') => {
             faqContent.innerHTML = '<div class="loading-spinner-small"></div>';
            try {
                 const faqs = query ? await apiService.searchFaq(query) : await apiService.getFaq();
                 displayFaqs(faqs);
            } catch (error) {
                console.error("Error fetching FAQs:", error);
                faqContent.innerHTML = '<p>SSS yüklenirken bir hata oluştu.</p>';
            }
        };
        
        searchBtn.addEventListener('click', () => fetchAndDisplayFaqs(searchInput.value.trim()));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                 fetchAndDisplayFaqs(searchInput.value.trim());
            }
        });

        // Başlangıçta tüm SSS'leri yükle
        await fetchAndDisplayFaqs();
    }
    
    // Yeni mesaj sayısını güncelleyen fonksiyon
    async function updateMessageBadge() {
        if (!messageBadge) return;
        try {
            // API'den okunmamış mesaj sayısını al
            const count = await apiService.getUnreadMessageCount(); 
            if (count > 0) {
                messageBadge.textContent = count;
                messageBadge.style.display = 'inline-block';
            } else {
                messageBadge.style.display = 'none';
            }
        } catch (error) {
             console.error("Error fetching unread message count:", error);
             messageBadge.style.display = 'none';
        }
    }
    
     // Butonlar için yükleme durumu yardımcıları
    function showLoadingButton(button) {
        if (!button) return;
        button.disabled = true;
        button.dataset.originalText = button.innerHTML; // Orijinal metni sakla
        button.innerHTML = '<span class="button-spinner"></span> Yükleniyor...';
    }

    function hideLoadingButton(button) {
        if (!button) return;
        button.disabled = false;
        if (button.dataset.originalText) {
             button.innerHTML = button.dataset.originalText; // Orijinal metni geri yükle
        } else {
            // Fallback
            button.innerHTML = button.innerHTML.replace('<span class="button-spinner"></span> Yükleniyor...', '');
        }
    }

    // 8. Tarih formatla
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        
        // Bugün ise saat:dakika göster
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Bu yıl içindeyse gün.ay göster
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        }
        
        // Diğer durumlarda gün.ay.yıl göster
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // ... existing code ...

    async function initializePasswordSection() {
        console.log("Initializing password section...");
        
        // DOM Elementleri
        const changePasswordForm = document.getElementById('change-password-form');
        const emailResetForm = document.getElementById('email-reset-form');
        const smsResetForm = document.getElementById('sms-reset-form');
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const strengthBar = document.querySelector('.strength-bar');
        const requirements = document.querySelectorAll('.password-requirements li');
        
        // Şifre gücü kontrolü
        function checkPasswordStrength(password) {
            const checks = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
            };

            // Gereksinimleri güncelle
            requirements.forEach(req => {
                const type = req.getAttribute('data-requirement');
                if (checks[type]) {
                    req.classList.add('valid');
                } else {
                    req.classList.remove('valid');
                }
            });

            // Güç seviyesini hesapla
            const strength = Object.values(checks).filter(Boolean).length;
            strengthBar.className = 'strength-bar';
            
            if (strength <= 2) {
                strengthBar.classList.add('weak');
            } else if (strength <= 3) {
                strengthBar.classList.add('medium');
            } else if (strength <= 4) {
                strengthBar.classList.add('strong');
            } else {
                strengthBar.classList.add('very-strong');
            }

            return strength === 5; // Tüm gereksinimler karşılanıyorsa true döndür
        }
        
        // Şifre eşleşme kontrolü
        function checkPasswordMatch() {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword && newPassword !== confirmPassword) {
                confirmPasswordInput.classList.add('is-invalid');
                return false;
            } else {
                confirmPasswordInput.classList.remove('is-invalid');
                return true;
            }
        }

        // Şifre değiştirme formu
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = newPasswordInput.value;
                const confirmPassword = confirmPasswordInput.value;

                // Şifre kontrolü
                if (!checkPasswordStrength(newPassword)) {
                    showNotification('Lütfen daha güçlü bir şifre seçin.', 'error');
                    return;
                }

                if (!checkPasswordMatch()) {
                    showNotification('Yeni şifreler eşleşmiyor.', 'error');
                    return;
                }

                // Buton durumunu güncelle
                const submitButton = changePasswordForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="button-spinner"></span> İşleniyor...';

                try {
                    const response = await apiService.changePassword(currentPassword, newPassword);
                    if (response.success) {
                        showNotification('Şifreniz başarıyla güncellendi.', 'success');
                        changePasswordForm.reset();
                        strengthBar.className = 'strength-bar';
                        requirements.forEach(req => req.classList.remove('valid'));
                    } else {
                        showNotification(response.message || 'Şifre güncellenirken bir hata oluştu.', 'error');
                    }
                } catch (error) {
                    console.error('Password change error:', error);
                    showNotification('Şifre güncellenirken bir hata oluştu.', 'error');
                } finally {
                    // Buton durumunu geri yükle
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }

        // E-posta ile şifre sıfırlama
        if (emailResetForm) {
            emailResetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('reset-email').value;
                
                // Buton durumunu güncelle
                const submitButton = emailResetForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="button-spinner"></span> İşleniyor...';

                try {
                    const response = await apiService.requestPasswordResetEmail(email);
                    if (response.success) {
                        showNotification('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', 'success');
                        emailResetForm.reset();
                    } else {
                        showNotification(response.message || 'E-posta gönderilirken bir hata oluştu.', 'error');
                    }
                } catch (error) {
                    console.error('Email reset error:', error);
                    showNotification('E-posta gönderilirken bir hata oluştu.', 'error');
                } finally {
                    // Buton durumunu geri yükle
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }

        // SMS ile şifre sıfırlama
        if (smsResetForm) {
            smsResetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const phone = document.getElementById('reset-phone').value;
                
                // Buton durumunu güncelle
                const submitButton = smsResetForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="button-spinner"></span> İşleniyor...';

                try {
                    const response = await apiService.requestPasswordResetSMS(phone);
                    if (response.success) {
                        showNotification('Şifre sıfırlama kodu telefonunuza gönderildi.', 'success');
                        smsResetForm.reset();
                    } else {
                        showNotification(response.message || 'SMS gönderilirken bir hata oluştu.', 'error');
                    }
                } catch (error) {
                    console.error('SMS reset error:', error);
                    showNotification('SMS gönderilirken bir hata oluştu.', 'error');
                } finally {
                    // Buton durumunu geri yükle
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }

        // Şifre gücü kontrolü için input event listener
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                checkPasswordStrength(e.target.value);
                if (confirmPasswordInput.value) {
                    checkPasswordMatch();
                }
            });
        }
        
        // Şifre eşleşme kontrolü için input event listener
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                checkPasswordMatch();
            });
        }
        
        // Form alanları için geçerlilik kontrolü
        const formInputs = document.querySelectorAll('.password-operations input');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value.trim() === '') {
                    input.classList.add('is-invalid');
                } else {
                    input.classList.remove('is-invalid');
                }
            });
        });
    }

    // Bildirim gösterme fonksiyonu
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animasyon için setTimeout
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // 3 saniye sonra kaldır
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // --- İlk Yükleme --- 
    // URL hash'ine göre başlangıç bölümünü belirle (örn: #/profile/orders)
    const initialSection = window.location.hash.split('/')[2] || 'account'; 
    await loadSection(initialSection);
    
    // Yeni mesaj sayısını kontrol et
    await updateMessageBadge();

    console.log("Profile page initialized.");
}

// Bu fonksiyonu global scope'a ekleyerek router'dan erişilebilir yap
window.initializeProfilePage = initializeProfilePage; 