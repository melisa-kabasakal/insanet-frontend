// app.js - Ana uygulama dosyası

// Sayfa bazlı başlatıcılar (Router tarafından kullanılır)
const pageInitializers = {};

// Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Router'a rotaları tanımla
        initializeRoutes();
        
        // Arama işlevselliğini başlat
        initializeSearch();
        
        // Oturum kontrolü yap ve sonucunu bekle
        const isLoggedIn = await checkSession();
        console.log('Oturum durumu:', isLoggedIn ? 'Giriş yapılmış' : 'Giriş yapılmamış');
        
        // Menü öğelerine tıklama işlevselliği ekle
        initializeMenuItems();
        
        // Kayıt ol modal penceresini başlat
        initializeRegisterModal();
        
        // İhale Oluştur butonunun görünürlüğünü kontrol et
        checkAuctionCreateButton();
        
        // Hash değişiminde oturum ve buton kontrolü yap
        window.addEventListener('hashchange', async function() {
            await checkSession();
            checkAuctionCreateButton();
        });
    } catch (error) {
        console.error('Sayfa başlatma hatası:', error);
        showLoggedOutUI();
    }
});

// Router rotalarını tanımla
function initializeRoutes() {
    // Her sayfa yüklemesinde oturum kontrolü yap
    router.beforeLoad = async () => {
        await checkSession();
    };

    // Ana sayfa
    router.addRoute('/', 'home', 'İnşanet: Dijital İnşaat Malzemeleri İhale Platformu');
    
    // Ürünler ve kategoriler
    router.addRoute('/products', 'products', 'Ürünler - İnşanet');
    router.addRoute('/product/:id', 'product-detail', 'Ürün Detayı - İnşanet');
    router.addRoute('/categories/:slug', 'category', 'Kategori - İnşanet');
    
    // Kullanıcı işlemleri
    router.addRoute('/login', 'login', 'Giriş Yap - İnşanet');
    router.addRoute('/register', 'register', 'Kayıt Ol - İnşanet');
    router.addRoute('/profile', 'profile', 'Profilim - İnşanet');
    
    // Tedarikçi, müteahhit ve lojistik
    router.addRoute('/suppliers', 'suppliers', 'Onaylı Tedarikçiler - İnşanet');
    router.addRoute('/contractors', 'contractors', 'Onaylı Müteahhitler - İnşanet');
    router.addRoute('/logistics', 'logistics', 'Onaylı Lojistik Firmaları - İnşanet');
    
    // İhaleler
    router.addRoute('/auctions', 'auctions', 'İhaleler - İnşanet');
    router.addRoute('/auction/:id', 'auction-detail', 'İhale Detayı - İnşanet');
    
    // Diğer sayfalar
    router.addRoute('/about', 'about', 'Hakkımızda - İnşanet');
    router.addRoute('/contact', 'contact', 'İletişim - İnşanet');
    router.addRoute('/faq', 'faq', 'Sıkça Sorulan Sorular - İnşanet');
    
    // 404 sayfası
    router.addRoute('/404', '404', 'Sayfa Bulunamadı - İnşanet');
    
    // Router hata yakalama
    window.addEventListener('error', function(event) {
        console.error('Sayfa yüklenirken hata: ', event);
        if (event.filename && event.filename.includes('register.html')) {
            console.error('Kayıt sayfası yüklenirken hata oluştu:', event.message);
        }
    });
    
    // Varsayılan rotayı ayarla
    router.setDefaultRoute('/');
}

// Arama işlevselliğini başlat
function initializeSearch() {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const searchType = document.getElementById("searchType");
    const searchResults = document.getElementById("searchResults");
    const searchResultsList = document.getElementById("searchResultsList");
    const filterTags = document.getElementById("filterTags");
    
    if (!searchInput || !searchButton || !searchResults) return;
    
    // Arama geçmişini localStorage'dan al
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Arama butonuna tıklama
    searchButton.addEventListener("click", function () {
        performSearch();
    });

    // Enter tuşuna basma
    searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            performSearch();
        }
    });
    
    // Arama kutusuna odaklanıldığında geçmiş aramaları göster
    searchInput.addEventListener("focus", function() {
        if (searchInput.value.trim() === "") {
            showSearchHistory();
        }
    });
    
    // Arama kutusuna yazıldığında otomatik tamamlama
    searchInput.addEventListener("input", function() {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length >= 2) {
            performAutoComplete(query);
        } else if (query === "") {
            showSearchHistory();
        } else {
            searchResults.classList.remove("active");
        }
    });
    
    // Arama tipi değiştiğinde
    searchType.addEventListener("change", function() {
        if (searchInput.value.trim() !== "") {
            performSearch();
        }
    });
    
    // Sayfa dışına tıklandığında sonuçları gizle
    document.addEventListener("click", function(event) {
        if (!event.target.closest(".search-container")) {
            searchResults.classList.remove("active");
        }
    });

    // Arama işlemi
    async function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const type = searchType.value;
        
        if (query === "") {
            alert("Lütfen bir arama terimi girin.");
            return;
        }

        try {
            // Arama geçmişine ekle
            addToSearchHistory(query);
            
            // Arama filtrelerini göster
            showSearchFilters(query, type);
            
            // Arama sonuçlarını getir
            const results = await apiService.search(query, type);
            
            if (results.length > 0) {
                displaySearchResults(results, type);
                searchResults.classList.add("active");
            } else {
                showNoResults(query);
                searchResults.classList.add("active");
            }
        } catch (error) {
            console.error("Arama sırasında hata:", error);
            alert("Arama yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }
    
    // Otomatik tamamlama
    async function performAutoComplete(query) {
        try {
            // Gerçek API'de otomatik tamamlama endpoint'i olacak
            // Şimdilik mock veri kullanıyoruz
            const results = await apiService.search(query);
            
            if (results.length > 0) {
                displayAutoCompleteResults(results);
                searchResults.classList.add("active");
            } else {
                searchResults.classList.remove("active");
            }
        } catch (error) {
            console.error("Otomatik tamamlama sırasında hata:", error);
        }
    }

    // Arama sonuçlarını göster
    function displaySearchResults(results, type) {
        searchResultsList.innerHTML = "";

        results.forEach(result => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("search-result-item");
            
            let resultHtml = '';
            
            // Sonuç tipine göre farklı HTML oluştur
            if (type === 'products' || result.price !== undefined) {
                resultHtml = `
                    <a href="#/product/${result.id}">
                        <h3>${result.name}</h3>
                        <p>${result.description}</p>
                        <div class="result-meta">
                            <span class="result-price">${result.price ? result.price.toLocaleString('tr-TR') + ' ₺' : ''}</span>
                            <span class="result-category">Kategori: ${getCategoryName(result.category)}</span>
                            <span class="result-supplier">Tedarikçi: ${getSupplierName(result.supplier)}</span>
                        </div>
                    </a>
                `;
            } else if (type === 'suppliers' || result.rating !== undefined) {
                resultHtml = `
                    <a href="#/supplier/${result.id}">
                        <h3>${result.name}</h3>
                        <p>${result.description}</p>
                        <div class="result-meta">
                            <span class="result-rating">Puan: ${result.rating}/5</span>
                            <span class="result-location">Konum: ${result.location}</span>
                        </div>
                    </a>
                `;
            } else if (type === 'categories') {
                resultHtml = `
                    <a href="#/categories/${result.slug}">
                        <h3>${result.name}</h3>
                    </a>
                `;
            } else {
                resultHtml = `
                    <a href="#/product/${result.id}">
                        <h3>${result.name}</h3>
                        <p>${result.description || ''}</p>
                    </a>
                `;
            }
            
            resultItem.innerHTML = resultHtml;
            searchResultsList.appendChild(resultItem);
        });
    }

    
    
    // Otomatik tamamlama sonuçlarını göster
    function displayAutoCompleteResults(results) {
        searchResultsList.innerHTML = "";
        
        // En fazla 5 sonuç göster
        const limitedResults = results.slice(0, 5);

        limitedResults.forEach(result => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("search-result-item");
            
            resultItem.innerHTML = `
                <a href="#/product/${result.id}">
                    <h3>${result.name}</h3>
                </a>
            `;
            
            resultItem.addEventListener("click", function() {
                searchInput.value = result.name;
                performSearch();
            });
            
            searchResultsList.appendChild(resultItem);
        });
        
        // Arama önerileri ekle
        addSearchSuggestions(results);
    }
    
    // Arama önerileri ekle
    function addSearchSuggestions(results) {
        // Öneriler bölümü oluştur
        const suggestionsDiv = document.createElement("div");
        suggestionsDiv.classList.add("search-suggestions");
        
        suggestionsDiv.innerHTML = `
            <h4>Önerilen Aramalar</h4>
            <div class="suggestion-list">
                <div class="suggestion-item">Çimento</div>
                <div class="suggestion-item">Demir</div>
                <div class="suggestion-item">Mantolama</div>
                <div class="suggestion-item">Elektrik Malzemeleri</div>
                <div class="suggestion-item">İnşaat Demiri</div>
            </div>
        `;
        
        // Öneri öğelerine tıklama işlevselliği ekle
        const suggestionItems = suggestionsDiv.querySelectorAll(".suggestion-item");
        suggestionItems.forEach(item => {
            item.addEventListener("click", function() {
                searchInput.value = item.textContent;
                performSearch();
            });
        });
        
        searchResultsList.appendChild(suggestionsDiv);
    }
    
    // Sonuç bulunamadı mesajı göster
    function showNoResults(query) {
        searchResultsList.innerHTML = `
            <div class="search-no-results">
                <p>"${query}" için sonuç bulunamadı.</p>
            </div>
        `;
        
        // Arama önerileri ekle
        const suggestionsDiv = document.createElement("div");
        suggestionsDiv.classList.add("search-suggestions");
        
        suggestionsDiv.innerHTML = `
            <h4>Bunları aramayı deneyin:</h4>
            <div class="suggestion-list">
                <div class="suggestion-item">Çimento</div>
                <div class="suggestion-item">Demir</div>
                <div class="suggestion-item">Mantolama</div>
                <div class="suggestion-item">Elektrik Malzemeleri</div>
            </div>
        `;
        
        // Öneri öğelerine tıklama işlevselliği ekle
        const suggestionItems = suggestionsDiv.querySelectorAll(".suggestion-item");
        suggestionItems.forEach(item => {
            item.addEventListener("click", function() {
                searchInput.value = item.textContent;
                performSearch();
            });
        });
        
        searchResultsList.appendChild(suggestionsDiv);
    }
    
    // Arama geçmişini göster
    function showSearchHistory() {
        searchResultsList.innerHTML = "";
        
        if (searchHistory.length === 0) {
            searchResults.classList.remove("active");
            return;
        }
        
        const historyDiv = document.createElement("div");
        historyDiv.classList.add("search-history");
        
        let historyHtml = `
            <h4>
                Son Aramalar
                <button id="clearHistory">Temizle</button>
            </h4>
            <div class="history-list">
        `;
        
        // En son 5 aramayı göster
        const recentHistory = searchHistory.slice(0, 5);
        
        recentHistory.forEach((item, index) => {
            historyHtml += `
                <div class="history-item" data-query="${item}">
                    <span>${item}</span>
                    <button class="remove-history" data-index="${index}">×</button>
                </div>
            `;
        });
        
        historyHtml += `</div>`;
        historyDiv.innerHTML = historyHtml;
        
        // Geçmiş öğelerine tıklama işlevselliği ekle
        const historyItems = historyDiv.querySelectorAll(".history-item");
        historyItems.forEach(item => {
            item.addEventListener("click", function(e) {
                if (!e.target.classList.contains('remove-history')) {
                    const query = item.getAttribute("data-query");
                    searchInput.value = query;
                    performSearch();
                }
            });
        });
        
        // Geçmiş silme butonlarına işlevselliği ekle
        const removeButtons = historyDiv.querySelectorAll(".remove-history");
        removeButtons.forEach(button => {
            button.addEventListener("click", function(e) {
                e.stopPropagation();
                const index = parseInt(button.getAttribute("data-index"));
                removeFromSearchHistory(index);
                showSearchHistory();
            });
        });
        
        // Tüm geçmişi temizleme butonu
        const clearButton = historyDiv.querySelector("#clearHistory");
        if (clearButton) {
            clearButton.addEventListener("click", function() {
                clearSearchHistory();
                searchResults.classList.remove("active");
            });
        }
        
        searchResultsList.appendChild(historyDiv);
        searchResults.classList.add("active");
    }
    
    // Arama filtrelerini göster
    function showSearchFilters(query, type) {
        filterTags.innerHTML = "";
        
        // Arama terimi filtresi
        const queryTag = document.createElement("div");
        queryTag.classList.add("filter-tag");
        queryTag.innerHTML = `
            Arama: ${query}
            <button class="remove-filter" data-type="query">×</button>
        `;
        
        // Filtre silme butonuna işlevsellik ekle
        const removeQueryBtn = queryTag.querySelector(".remove-filter");
        removeQueryBtn.addEventListener("click", function() {
            searchInput.value = "";
            searchResults.classList.remove("active");
        });
        
        filterTags.appendChild(queryTag);
        
        // Arama tipi filtresi
        if (type !== 'all') {
            const typeTag = document.createElement("div");
            typeTag.classList.add("filter-tag");
            
            let typeText = '';
            switch(type) {
                case 'products': typeText = 'Ürünler'; break;
                case 'suppliers': typeText = 'Tedarikçiler'; break;
                case 'categories': typeText = 'Kategoriler'; break;
                default: typeText = 'Tümü';
            }
            
            typeTag.innerHTML = `
                Tür: ${typeText}
                <button class="remove-filter" data-type="type">×</button>
            `;
            
            // Filtre silme butonuna işlevsellik ekle
            const removeTypeBtn = typeTag.querySelector(".remove-filter");
            removeTypeBtn.addEventListener("click", function() {
                searchType.value = 'all';
                performSearch();
            });
            
            filterTags.appendChild(typeTag);
        }
    }
    
    // Arama geçmişine ekle
    function addToSearchHistory(query) {
        // Aynı sorgu zaten varsa kaldır
        searchHistory = searchHistory.filter(item => item !== query);
        
        // Başa ekle
        searchHistory.unshift(query);
        
        // Maksimum 10 öğe sakla
        if (searchHistory.length > 10) {
            searchHistory.pop();
        }
        
        // LocalStorage'a kaydet
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
    
    // Arama geçmişinden kaldır
    function removeFromSearchHistory(index) {
        if (index >= 0 && index < searchHistory.length) {
            searchHistory.splice(index, 1);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
    }
    
    // Arama geçmişini temizle
    function clearSearchHistory() {
        searchHistory = [];
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
    
    // Kategori adını al
    function getCategoryName(categoryId) {
        if (!categoryId) return 'Bilinmiyor';
        
        const categories = apiService.mockData.categories;
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Bilinmiyor';
    }
    
    // Tedarikçi adını al
    function getSupplierName(supplierId) {
        if (!supplierId) return 'Bilinmiyor';
        
        const suppliers = apiService.mockData.suppliers;
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier ? supplier.name : 'Bilinmiyor';
    }
}

// Kullanıcı arayüzünü güncelle (giriş yapılmış durum)
function showLoggedInUI() {
    const userSignBox = document.querySelector('.user-signBox');
    if (userSignBox) {
        userSignBox.innerHTML = `
            <a href="#/profile" class="btn-login" id="profileButton">Profilim</a>
            <a href="javascript:void(0)" class="btn-login" id="logoutButton">Çıkış yap</a>
        `;
    }
    
    // İhale Oluştur butonunu göster (eğer ihaleler sayfasındaysa)
    const createAuctionBtn = document.getElementById('createAuctionButtonContainer');
    if (createAuctionBtn && window.location.hash.includes('/auctions')) {
        createAuctionBtn.style.display = 'block';
    }
}

// Oturum kontrolü
async function checkSession() {
    try {
        const token = localStorage.getItem('auth_token');
        const userSignBox = document.querySelector('.user-signBox');
        
        if (!userSignBox) {
            console.error('userSignBox elementi bulunamadı');
            return false;
        }

        if (!token) {
            console.log('Token bulunamadı');
            showLoggedOutUI();
            return false;
        }

        // Token geçerliliğini kontrol et
        const isValid = await apiService.validateToken();
        
        if (!isValid) {
            localStorage.removeItem('auth_token');
            throw new Error('Token geçersiz');
        }

        // Giriş yapılmış UI'ı göster
        showLoggedInUI();

        // Çıkış yap butonu tıklama olayı
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await apiService.logout();
                    localStorage.removeItem('auth_token');
                    showLoggedOutUI();
                    window.location.href = '#/'; // Ana sayfaya yönlendir
                } catch (error) {
                    console.error('Çıkış hatası:', error);
                }
            });
        }

        // Profile button click handler
        const profileBtn = document.getElementById('profileButton');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                window.location.href = '#/profile';
            });
        }

        return true;
    } catch (error) {
        console.error('Oturum kontrolü hatası:', error);
        localStorage.removeItem('token');
        showLoggedOutUI();
        return false;
    }
}

// Kullanıcı arayüzünü güncelle (giriş yapılmamış durum)
function showLoggedOutUI() {
    const userSignBox = document.querySelector('.user-signBox');
    if (userSignBox) {
        userSignBox.innerHTML = `
            <a href="#/login" class="btn-login">Giriş Yap</a>
            <button type="button" class="btn-register" id="showRegisterModal">Kayıt Ol</button>
        `;
    }
    
    // İhale Oluştur butonunu gizle
    const createAuctionBtn = document.getElementById('createAuctionButtonContainer');
    if (createAuctionBtn) {
        createAuctionBtn.style.display = 'none';
    }
}
// Menü öğelerine tıklama işlevselliği
function initializeMenuItems() {
    // Tüm menü öğelerini seç
    const menuItems = document.querySelectorAll('.menuItem');
    
    if (!menuItems.length) return;
    
    menuItems.forEach(item => {
        // Href özelliğini SPA formatına dönüştür
        const href = item.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('http') ) {
            // Dış bağlantı değilse, hash formatına dönüştür
            const newHref = href.replace('./pages/', '').replace('.html', '');
            item.setAttribute('href', `#/${newHref}`);
        }
        
        // Yapım aşamasındaki sayfalar için uyarı
        if (href === '#' || !href) {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                alert(`${this.textContent} sayfası yapım aşamasında.`);
            });
        }
    });
}

// Sayfa içeriği yüklendiğinde çalışacak fonksiyonlar
async function loadHomePage() {
    // Sadece giriş yapılmışsa kategorileri ve ihaleleri yükle
    if (apiService.token) {
        await loadCategories();
        await loadActiveAuctions();
    }
}

// Kategorileri yükle
async function loadCategories() {
    try {
        const categories = await apiService.getCategories();
        const categoryList = document.querySelector('.categoryList');
        
        if (!categoryList) return;
        
        categoryList.innerHTML = '';
        
        categories.forEach(category => {
            const categoryItem = document.createElement('a');
            categoryItem.href = `#/categories/${category.slug}`;
            categoryItem.className = 'categoryItem';
            categoryItem.textContent = category.name;
            
            categoryList.appendChild(categoryItem);
        });
        
        // Hover efekti ekle
        addHoverEffect(document.querySelectorAll('.categoryItem'));
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
    }
}

// Aktif ihaleleri yükle
async function loadActiveAuctions() {
    try {
        const auctions = await apiService.getAuctions('active');
        const auctionList = document.querySelector('.auctionList');
        
        if (!auctionList) return;
        
        auctionList.innerHTML = '';
        
        auctions.forEach(auction => {
            const auctionItem = document.createElement('a');
            auctionItem.href = `#/auction/${auction.id}`;
            auctionItem.className = 'auctionItem';
            
            // Tarih formatını düzenle
            const date = new Date(auction.endDate);
            const formattedDate = date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            auctionItem.innerHTML = `
                <h3>${auction.title}</h3>
                <p>Son Tarih: <time datetime="${auction.endDate}">${formattedDate}</time></p>
            `;
            
            auctionList.appendChild(auctionItem);
        });
        
        // Hover efekti ekle
        addHoverEffect(document.querySelectorAll('.auctionItem'));
    } catch (error) {
        console.error('İhaleler yüklenirken hata:', error);
    }
}

// Hover efekti ekle
function addHoverEffect(elements) {
    elements.forEach(item => {
        item.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px)';
        });
        item.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Global scope'a fonksiyonları ekle
window.loadHomePage = loadHomePage;
window.loadCategories = loadCategories;
window.loadActiveAuctions = loadActiveAuctions;
window.showLoggedInUI = showLoggedInUI;
window.showLoggedOutUI = showLoggedOutUI;

// Kayıt ol modalını başlat
function initializeRegisterModal() {
    const showModalButton = document.getElementById('showRegisterModal');
    const modal = document.getElementById('registerTypeModal');
    
    // Gerekli elementler DOM'da yoksa işlemi durdur
    if (!showModalButton || !modal) {
        // Bu elementler daha sonra eklenebileceği için (örn. showLoggedOutUI ile),
        // burada hata loglamak yerine sessizce çıkmak daha iyi olabilir.
        // console.error("Modal butonu veya modal elementi bulunamadı."); 
        return; 
    }
    
    const closeButton = modal.querySelector('.close-modal');
    const registerOptions = modal.querySelectorAll('.register-type-option');

    // --- Event Listener Ekleme (Tek Seferlik) --- 
    
    // Modalı açma butonu
    // Listener'ın zaten ekli olup olmadığını kontrol et
    if (!showModalButton.dataset.listenerAttached) {
        showModalButton.addEventListener('click', function() {
            console.log("Kayıt Ol butonuna tıklandı, modal açılıyor..."); // Debug log
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; 
        });
        showModalButton.dataset.listenerAttached = 'true'; // data-* attribute ile işaretle
        console.log("Modal açma listener'ı eklendi."); // Debug log
    }
    
    // Modalı kapat (x butonuna tıklama)
    if (closeButton && !closeButton.dataset.listenerAttached) { 
        closeButton.addEventListener('click', function() {
            modal.classList.remove('show');
            document.body.style.overflow = ''; 
        });
        closeButton.dataset.listenerAttached = 'true';
    }
    
    // Modalı kapat (modal dışına tıklama)
    if (!modal.dataset.listenerAttached) { 
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
        modal.dataset.listenerAttached = 'true';
    }
    
    // Kayıt tipi seçeneklerine tıklama ve otomatik yönlendirme
    registerOptions.forEach(option => {
        if (!option.dataset.listenerAttached) {
            option.addEventListener('click', function(event) {
                event.preventDefault();
                const href = this.getAttribute('href');
                modal.classList.remove('show');
                document.body.style.overflow = '';
                setTimeout(() => {
                    window.location.hash = href.substring(1); 
                }, 50); 
            });
            option.dataset.listenerAttached = 'true';
        }
    });
    
    // ESC tuşuna basılınca modalı kapat 
    // Bu listener'ı document seviyesinde sadece bir kez eklemek daha verimli
    if (!document.body.dataset.escListenerAttached) {
        document.addEventListener('keydown', function(event) {
            const currentModal = document.getElementById('registerTypeModal'); // Güncel modal referansını al
            if (event.key === 'Escape' && currentModal && currentModal.classList.contains('show')) {
                currentModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
        document.body.dataset.escListenerAttached = 'true'; // Body'ye işaretleyici ekle
    }
}

// === Tedarikçiler Sayfası Başlatıcısı ===
async function loadSuppliersPage() {
    console.log('Tedarikçiler sayfası yükleniyor...');
    const searchInput = document.getElementById('supplierSearchInput');
    const searchButton = document.getElementById('supplierSearchButton');
    const sortFilter = document.getElementById('supplierSortFilter');
    const listContainer = document.getElementById('supplierListContainer');

    if (!listContainer || !searchInput || !searchButton || !sortFilter) {
        console.error('Tedarikçiler sayfası için gerekli DOM elemanları bulunamadı.');
        return;
    }

    let currentSuppliers = []; // Filtreleme için ham veriyi tut

    // Yıldız rating HTML'i oluşturur
    function createRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
        if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>'; // Boş yıldız için far
        return starsHtml;
    }

    // Tedarikçi kartlarını oluşturur ve listeye ekler
    function renderSuppliers(suppliers) {
        listContainer.innerHTML = ''; // Önceki içeriği temizle

        if (!suppliers || suppliers.length === 0) {
            listContainer.innerHTML = '<p class="no-suppliers-found">Aramanızla eşleşen onaylı tedarikçi bulunamadı.</p>';
            return;
        }

        suppliers.forEach(supplier => {
            const card = document.createElement('div');
            card.className = 'supplier-card';

            // Logo (varsa)
            const logoHtml = supplier.logoUrl 
                ? `<img src="${supplier.logoUrl}" alt="${supplier.name} Logosu" class="supplier-logo">`
                : '<div class="supplier-logo-placeholder"></div>'; // Placeholder eklenebilir
            
            // Rating
            const ratingHtml = supplier.rating 
                ? `<div class="supplier-rating">${createRatingStars(supplier.rating)}<span class="rating-value">(${supplier.rating.toFixed(1)})</span></div>`
                : '';

            card.innerHTML = `
                <div class="supplier-header">
                    ${logoHtml}
                    <div class="supplier-title">
                        <h2>${supplier.name || 'İsim Belirtilmemiş'}</h2>
                        <span class="supplier-category">${supplier.category || 'Kategori Belirtilmemiş'}</span>
                    </div>
                </div>
                <div class="supplier-info">
                    ${supplier.description ? `<p>${supplier.description}</p>` : ''}
                    ${supplier.location ? `<p><i class="fas fa-map-marker-alt"></i> ${supplier.location}</p>` : ''}
                    ${supplier.phone ? `<p><i class="fas fa-phone-alt"></i> ${supplier.phone}</p>` : ''}
                    ${supplier.website ? `<p><i class="fas fa-globe"></i> <a href="${supplier.website}" target="_blank" rel="noopener noreferrer">Web Sitesi</a></p>` : ''}
                </div>
                ${ratingHtml}
                <div class="supplier-actions">
                    <a href="#/supplier/${supplier.id}" class="btn-details">Detayları Gör</a> 
                </div>
            `;
            // Not: /supplier/:id rotasının tanımlı ve çalışıyor olması gerekir.
            listContainer.appendChild(card);
        });
    }

    // Tedarikçileri API'den getirir ve render eder
    async function fetchAndRenderSuppliers() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedSort = sortFilter.value;

        listContainer.innerHTML = '<p class="loading-suppliers">Tedarikçiler yükleniyor...</p>';

        try {
            // Varsayımsal API çağrısı - parametrelerle
            const params = {
                search: searchTerm,
                sort: selectedSort
            };
            console.log('API Çağrısı Parametreleri:', params)
            
            // --- Mock Veri Başlangıcı ---
            // Gerçek API entegrasyonunda bu bölüm kaldırılmalıdır.
            await new Promise(resolve => setTimeout(resolve, 500)); // Yapay gecikme
            let mockSuppliers = [
                { id: 1, name: 'Demirtaş Yapı Malzemeleri', category: 'İnşaat Malzemeleri', description: 'Kaliteli demir, çimento ve tuğla çeşitleri.', location: 'Ankara', rating: 4.8, logoUrl: './img/supplier-logos/demirtas.png', phone: '0312 123 4567', website: 'https://demirtas.com' },
                { id: 2, name: 'Aydın Elektrik Dünyası', category: 'Elektrik & Aydınlatma', description: 'Geniş ürün yelpazesi ile elektrik malzemeleri.', location: 'İstanbul', rating: 4.5, logoUrl: './img/supplier-logos/aydin.png' },
                { id: 3, name: 'Mekanik Çözümler Ltd.', category: 'Mekanik Tesisat', description: 'Isıtma, soğutma ve havalandırma sistemleri.', location: 'İzmir', rating: 4.2, logoUrl: './img/supplier-logos/mekanik.png', website: 'https://mekanikcozum.com' },
                { id: 4, name: 'Hırdavat Ustası', category: 'Hırdavat & El Aletleri', description: 'Profesyonel ve amatör kullanıma uygun el aletleri.', location: 'Bursa', rating: 4.9, phone: '0224 987 6543' },
                { id: 5, name: 'Anadolu İnşaat Grubu', category: 'İnşaat Malzemeleri', description: 'Uygun fiyatlı temel inşaat malzemeleri.', location: 'Ankara', rating: 3.9 },
                { id: 6, name: 'Işık Aydınlatma A.Ş.', category: 'Elektrik & Aydınlatma', description: 'Modern ve klasik aydınlatma ürünleri.', location: 'İstanbul', rating: 4.6, logoUrl: './img/supplier-logos/isik.png' }
            ];
            
            // Mock filtreleme ve arama
            if (searchTerm) {
                 mockSuppliers = mockSuppliers.filter(s => s.name.toLowerCase().includes(searchTerm) || (s.description && s.description.toLowerCase().includes(searchTerm)));
            }
            if (params.sort) {
                const [field, direction] = params.sort.split('_');
                mockSuppliers.sort((a, b) => {
                    let valA = a[field];
                    let valB = b[field];
                    // İsim sıralaması için string karşılaştırma
                    if (field === 'name') {
                        valA = valA.toLowerCase();
                        valB = valB.toLowerCase();
                    }
                     // Puan sıralaması için sayısal karşılaştırma (varsa)
                     if (field === 'rating') {
                         valA = valA || 0; // Puan yoksa 0 kabul et
                         valB = valB || 0;
                     }
                     
                    if (valA < valB) return direction === 'asc' ? -1 : 1;
                    if (valA > valB) return direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            currentSuppliers = mockSuppliers;
            // --- Mock Veri Sonu ---

            renderSuppliers(currentSuppliers);

        } catch (error) {
            console.error('Tedarikçiler getirilirken hata:', error);
            listContainer.innerHTML = '<p class="no-suppliers-found error-message">Tedarikçiler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }

    // Olay Dinleyicileri
    searchButton.addEventListener('click', fetchAndRenderSuppliers);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            fetchAndRenderSuppliers();
        }
    });
    sortFilter.addEventListener('change', fetchAndRenderSuppliers);

    // İlk yükleme
    await fetchAndRenderSuppliers(); // Tedarikçileri yükle
}

// Tedarikçiler sayfası başlatıcısını ekle
pageInitializers.suppliers = loadSuppliersPage;

// "İhale Oluştur" butonunu kontrol et (App düzeyinde)
function checkAuctionCreateButton() {
    // Kullanıcı durumunu kontrol et
    const isLoggedIn = !!apiService.token;
    
    // Buton container'ı bul
    const createAuctionBtn = document.getElementById('createAuctionButtonContainer');
    if (createAuctionBtn) {
        // Kullanıcı giriş yapmışsa ve ihaleler sayfasındaysa butonu göster
        if (isLoggedIn && window.location.hash.includes('/auctions')) {
            createAuctionBtn.style.display = 'block';
            console.log('App.js: İhale Oluştur butonu görünür yapıldı.');
            
            // Butona tıklama olayını ekle
            const button = document.getElementById('createAuctionButton');
            if (button && typeof window.openCreateAuctionForm === 'function') {
                button.removeEventListener('click', window.openCreateAuctionForm);
                button.addEventListener('click', window.openCreateAuctionForm);
            }
        } else {
            createAuctionBtn.style.display = 'none';
        }
    }
}