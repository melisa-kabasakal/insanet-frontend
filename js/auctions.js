// auctions.js - İhale sayfası işlevselliği

// Global değişkenler
window.selectedProducts = window.selectedProducts || [];
let isProductDropdownOpen = false;
let isLocationDropdownOpen = false;
let currentTabStatus = 'open'; // Varsayılan olarak açık ihaleler sekmesi aktif
let materialRequestRows = []; // Malzeme talep formu satırları
let draftAuctions = []; // Taslak ihaleler

// Sayfa yüklendiğinde çalışacak ana fonksiyon
async function initializeAuctionsPage() {
    console.log('İhaleler sayfası başlatılıyor...');
    
    // "İhale Oluştur" butonunu ilk olarak kontrol et
    console.log('İhale butonu kontrolü başlatılıyor...');
    await checkCreateAuctionButton();
    
    // Sekme butonlarını yakala ve dinleyicileri ekle
    setupTabButtons();
    
    // Arama ve filtreleme bileşenlerini kur
    setupSearchAndFilters();
    
    // Sayfa ilk yüklendiğinde açık ihaleleri yükle
    loadAuctions('open');
    
    // İhale detay modalı kur
    setupAuctionDetailModal();
    
    // İhale oluşturma formunu başlat (gizli kalacak)
    setupCreateAuctionForm();
    
    console.log('İhaleler sayfası başlatıldı.');
    
    // URL değişikliklerini izle
    window.addEventListener('hashchange', function() {
        // Eğer ihaleler sayfasına yönlendirildiyse
        if (window.location.hash.includes('/auctions')) {
            console.log('İhaleler sayfasına navigasyon yapıldı, buton kontrolü tekrar yapılıyor...');
            // Butonun görünürlüğünü tekrar kontrol et
            checkCreateAuctionButton();
        }
    });
}

// Sekme düğmelerini ayarla
function setupTabButtons() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Aktif sekme sınıfını güncelle
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // İlgili sekme içeriğini göster
            const tabId = button.getAttribute('data-tab');
            const tabPanes = document.querySelectorAll('.tab-pane');
            
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                }
            });
            
            // Sekme durumunu güncelle ve ihaleleri yükle
            currentTabStatus = tabId === 'closed-auctions' ? 'closed' : 'open';
            loadAuctions(currentTabStatus);
        });
    });
}

// Arama ve filtreleri ayarla
function setupSearchAndFilters() {
    // Ürün filtresini başlat
    setupProductFilter();
    
    // Lokasyon filtresini başlat
    initializeLocationFilter();
    
    // Arama kutusu
    const searchInput = document.getElementById('auction-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            filterAuctions();
        }, 500));
    }
    
    // Sıralama seçenekleri
    const sortSelect = document.getElementById('filterSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filterAuctions();
        });
    }
    
    // Filtreleri Temizle butonu
    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Arama kutusunu temizle
            if (searchInput) searchInput.value = '';
            
            // Ürün filtrelerini sıfırla
            window.selectedProducts = [];
            updateProductFilterHeader();
            
            // Lokasyon filtrelerini sıfırla (global metod)
            if (typeof window.resetLocationFilter === 'function') {
                window.resetLocationFilter();
            }
            
            // Sıralamayı varsayılana getir
            if (sortSelect) sortSelect.value = 'newest';
            
            // Filtreleri uygula ve yeniden yükle
            filterAuctions();
        });
    }
}

// Ürün filtresini ayarla
function setupProductFilter() {
    const allProducts = [ 
        "Çimento", "Alçı", "Bims", "Tuğla", "Kiremit / Mahya", "Kereste", 
        "OSB (9-18 mm)", "Plywood", "Kireç", "Taş Yünü", "Cam Yünü", 
        "Brüt Beton Astarı", "XPS (Ekstrüde Polistiren)", "EPS (Ekspande Polistiren)",
        "Gaz Beton (Ytong)", "Membran", "Şantiye Mobilizasyon", 
        "İşçi ve İş Güvenliği Ekipmanları", "Kalıp Yağı", "Hırdavat Ürünleri Grubu",
        "Halat / İp Grubu", "Elektrik Malzemeleri Grubu", "İnşaat Mekanik Malzemeleri Grubu",
        "Köpük Grubu"
    ];
    
    const productFilterWrapper = document.querySelector('.product-filter-wrapper');
    const productFilterHeader = document.getElementById('productFilterHeader');
    const productFilterDropdown = document.getElementById('productFilterDropdown');
    const productSearchInput = document.getElementById('productSearchInput');
    const productOptionsContainer = document.getElementById('productOptions');
    const selectAllProductsButton = document.getElementById('selectAllProducts');
    const clearAllProductsButton = document.getElementById('clearAllProducts');
    const applyProductFilterButton = document.getElementById('applyProductFilter');
    
    if (!productFilterWrapper || !productFilterHeader || !productFilterDropdown || 
        !productOptionsContainer || !selectAllProductsButton || 
        !clearAllProductsButton || !applyProductFilterButton) {
        console.error("Ürün filtresi elementlerinden bazıları bulunamadı.");
        return;
    }

    function applyLocalProductFilter() {
        console.log('Seçilen Ürünler (Uygula):', window.selectedProducts);
        isProductDropdownOpen = false; 
        productFilterDropdown.classList.remove('open');
        filterAuctions(); // Ana filtrelemeyi tetikle
    }
    
    function renderProductOptions(container, searchInput, filter = '') {
        if (!container) return;
        container.innerHTML = '';
        const filteredProducts = allProducts.filter(product => 
            product.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredProducts.length === 0) {
            container.innerHTML = '<p class="no-results">Sonuç bulunamadı.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'multi-select-option';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = product;
            checkbox.id = `product-${product.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; 
            checkbox.checked = window.selectedProducts.includes(product);
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = product;

            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(label);
            container.appendChild(optionDiv);

            checkbox.addEventListener('change', (event) => {
                const currentProduct = event.target.value;
                if (event.target.checked) {
                    if (!window.selectedProducts.includes(currentProduct)) {
                        window.selectedProducts.push(currentProduct);
                    }
                } else {
                    window.selectedProducts = window.selectedProducts.filter(p => p !== currentProduct);
                }
                updateProductFilterHeader();
            });
        });
    }
    
    productFilterHeader.addEventListener('click', (event) => {
        event.stopPropagation(); 
        isProductDropdownOpen = !isProductDropdownOpen; 
        productFilterDropdown.classList.toggle('open', isProductDropdownOpen);
        if (isProductDropdownOpen) {
            renderProductOptions(productOptionsContainer, productSearchInput, productSearchInput.value); 
            productSearchInput.focus(); 
        }
    });
    
    // Dışarı tıklama olayını dinle
    document.addEventListener('click', (event) => {
        if (isProductDropdownOpen && productFilterWrapper && !productFilterWrapper.contains(event.target)) {
            isProductDropdownOpen = false; 
            if (productFilterDropdown) productFilterDropdown.classList.remove('open');
        }
    });
    
    productSearchInput.addEventListener('input', debounce(() => {
        renderProductOptions(productOptionsContainer, productSearchInput, productSearchInput.value);
    }, 250));
    
    selectAllProductsButton.addEventListener('click', () => {
        const currentFilter = productSearchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.toLowerCase().includes(currentFilter));
        window.selectedProducts = [...new Set([...window.selectedProducts, ...filtered])]; 
        renderProductOptions(productOptionsContainer, productSearchInput, currentFilter); 
        updateProductFilterHeader();
    });
    
    clearAllProductsButton.addEventListener('click', () => {
        const currentFilter = productSearchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.toLowerCase().includes(currentFilter));
        window.selectedProducts = window.selectedProducts.filter(p => !filtered.includes(p));
        renderProductOptions(productOptionsContainer, productSearchInput, currentFilter);
        updateProductFilterHeader();
    });
    
    applyProductFilterButton.addEventListener('click', applyLocalProductFilter);
    
    // İlk render
    renderProductOptions(productOptionsContainer, productSearchInput);
    updateProductFilterHeader();
}

// Ürün filtresi başlık alanını güncelle
function updateProductFilterHeader() {
    const productFilterHeader = document.getElementById('productFilterHeader');
    if (!productFilterHeader) return;
    
    const placeholder = productFilterHeader.querySelector('.multi-select-placeholder');
    const selectedCountSpan = productFilterHeader.querySelector('.multi-select-selected-count');
    
    if (!placeholder || !selectedCountSpan) return;

    const count = window.selectedProducts.length;
    if (count === 0) {
        placeholder.textContent = 'Tüm Ürünler'; 
        placeholder.style.display = 'inline';
        selectedCountSpan.textContent = '';
        selectedCountSpan.style.display = 'none';
    } else {
        placeholder.style.display = 'none';
        selectedCountSpan.textContent = `${count} ürün seçildi`;
        selectedCountSpan.style.display = 'inline';
    }
}

// Lokasyon filtresi başlat
function initializeLocationFilter() {
    const turkeyProvinces = [ 
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
        "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
        "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
        "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
        "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
        "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
        "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
        "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    ];
    
    const locationFilterWrapper = document.querySelector('.location-filter-wrapper'); 
    const locationFilterHeader = document.getElementById('locationFilterHeader');
    const locationFilterDropdown = document.getElementById('locationFilterDropdown');
    const locationSearchInput = document.getElementById('locationSearchInput');
    const locationOptionsContainer = document.getElementById('locationOptions'); 
    const selectAllBtn = document.getElementById('selectAllLocations');
    const clearAllBtn = document.getElementById('clearAllLocations');
    const applyBtn = document.getElementById('applyLocationFilter');
    
    if (!locationFilterWrapper || !locationFilterHeader || !locationFilterDropdown || 
        !locationOptionsContainer || !selectAllBtn || !clearAllBtn || !applyBtn) {
        console.error("Lokasyon filtresi elementlerinden bazıları bulunamadı.");
        return;
    }

    const selectedCountSpan = locationFilterHeader.querySelector('.multi-select-selected-count');
    const placeholderSpan = locationFilterHeader.querySelector('.multi-select-placeholder');
    let selectedLocations = [];

    function renderLocalLocationOptions(filter = '') {
        if (!locationOptionsContainer) return;
        locationOptionsContainer.innerHTML = ''; 
        const filteredProvinces = turkeyProvinces.filter(province => 
            province.toLowerCase().includes(filter.toLowerCase())
        );
        
        if (filteredProvinces.length === 0) {
            locationOptionsContainer.innerHTML = '<p class="no-results">Sonuç bulunamadı.</p>';
            return;
        }
        
        filteredProvinces.forEach(province => {
            const option = document.createElement('div');
            option.className = 'multi-select-option';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = province;
            checkbox.id = `loc-${province.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            checkbox.checked = selectedLocations.includes(province);
            checkbox.className = 'location-checkbox'; 
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = province; 
            option.appendChild(checkbox);
            option.appendChild(label);
            locationOptionsContainer.appendChild(option);
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                if (e.target.checked) {
                    if (!selectedLocations.includes(value)) {
                        selectedLocations.push(value);
                    }
                } else {
                    selectedLocations = selectedLocations.filter(loc => loc !== value);
                }
                updateLocalSelectedLocationCount();
            });
        });
    }
    
    function updateLocalSelectedLocationCount() {
        if (selectedCountSpan && placeholderSpan) {
            const count = selectedLocations.length;
            if (count > 0) {
                placeholderSpan.style.display = 'none';
                selectedCountSpan.textContent = `${count} lokasyon seçildi`;
                selectedCountSpan.style.display = 'inline';
            } else {
                placeholderSpan.textContent = 'Tüm Lokasyonlar'; 
                placeholderSpan.style.display = 'inline';
                selectedCountSpan.textContent = '';
                selectedCountSpan.style.display = 'none';
            }
        }
    }

    locationFilterHeader.addEventListener('click', (e) => {
        e.stopPropagation(); 
        isLocationDropdownOpen = !isLocationDropdownOpen;
        locationFilterDropdown.classList.toggle('open', isLocationDropdownOpen);
        if (isLocationDropdownOpen) {
            renderLocalLocationOptions(locationSearchInput.value); 
            locationSearchInput.focus();
        }
    });
    
    // Dışarı tıklama olayını dinle
    document.addEventListener('click', (e) => {
        if (isLocationDropdownOpen && locationFilterWrapper && !locationFilterWrapper.contains(e.target)) {
            isLocationDropdownOpen = false;
            if (locationFilterDropdown) locationFilterDropdown.classList.remove('open');
        }
    });
    
    locationSearchInput.addEventListener('input', debounce((e) => {
        renderLocalLocationOptions(e.target.value);
    }, 250));
    
    selectAllBtn.addEventListener('click', () => {
        const currentFilter = locationSearchInput.value.toLowerCase();
        const filteredProvinces = turkeyProvinces.filter(province => 
            province.toLowerCase().includes(currentFilter)
        );
        selectedLocations = [...new Set([...selectedLocations, ...filteredProvinces])];
        renderLocalLocationOptions(currentFilter); 
        updateLocalSelectedLocationCount();
    });
    
    clearAllBtn.addEventListener('click', () => {
        const currentFilter = locationSearchInput.value.toLowerCase();
        const filteredProvinces = turkeyProvinces.filter(province => 
            province.toLowerCase().includes(currentFilter)
        );
        selectedLocations = selectedLocations.filter(loc => !filteredProvinces.includes(loc));
        renderLocalLocationOptions(currentFilter); 
        updateLocalSelectedLocationCount();
    });
    
    applyBtn.addEventListener('click', () => {
        isLocationDropdownOpen = false; 
        locationFilterDropdown.classList.remove('open');
        filterAuctions(); // Ana filtrelemeyi tetikle
    });
    
    // Global erişim fonksiyonlarını window objesine ekle
    window.getSelectedLocations = function() {
        return selectedLocations;
    };
    
    window.resetLocationFilter = function() {
        selectedLocations = [];
        if (locationSearchInput) locationSearchInput.value = '';
        renderLocalLocationOptions(); 
        updateLocalSelectedLocationCount(); 
    };
    
    // İlk render
    renderLocalLocationOptions();
    updateLocalSelectedLocationCount();
} 

// İhaleleri filtrele
function filterAuctions() {
    const searchTerm = document.getElementById('auction-search')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('filterSort')?.value || 'newest';
    
    const selectedProductValues = window.selectedProducts; 
    const selectedLocationValues = typeof window.getSelectedLocations === 'function' ? 
                                 window.getSelectedLocations() : [];
    
    console.log('Filtreleme Kriterleri:', {
        search: searchTerm,
        products: selectedProductValues,
        locations: selectedLocationValues,
        sort: sortValue
    });

    loadAuctions(currentTabStatus, 1, searchTerm, selectedProductValues, selectedLocationValues, sortValue); 
}

// İhaleleri yükle
async function loadAuctions(status = 'open', page = 1, searchTerm = '', products = [], locations = [], sort = 'newest') {
    const listId = `${status}-auctions-list`;
    const paginationId = `${status}-auctions-pagination`;
    const auctionList = document.getElementById(listId);
    const paginationContainer = document.getElementById(paginationId);
    
    if (!auctionList) {
        console.error(`Element bulunamadı: ${listId}`);
        return;
    }
    
    // Yükleme durumunu göster
    const loadingHTML = `
        <div class="loading-auctions" style="display: flex;">
            <div class="spinner"></div>
            <p>İhaleler yükleniyor...</p>
        </div>`;
    auctionList.innerHTML = loadingHTML;
    if (paginationContainer) paginationContainer.innerHTML = ''; 

    console.log(`İhaleler yükleniyor: Status=${status}, Page=${page}, Search=${searchTerm}`);

    try {
        // API'den ihaleleri al
        const response = await fetchAuctionsFromAPI({ 
            status, page, limit: 10, searchTerm, products, locations, sort 
        });

        if (!response || !response.auctions) {
            throw new Error('API yanıtı geçersiz veya ihale verisi yok.');
        }

        const { auctions, totalPages, currentPage } = response;
        auctionList.innerHTML = ''; 

        if (auctions.length === 0) {
            auctionList.innerHTML = '<p class="no-results">Bu kriterlere uygun ihale bulunamadı.</p>';
        } else {
            const template = document.getElementById('auction-card-template');
            if (!template) {
                console.error('İhale kart şablonu bulunamadı!');
                auctionList.innerHTML = '<p class="error-message">İhale kart şablonu yüklenemedi.</p>';
                return;
            }
            auctions.forEach(auction => {
                const card = createAuctionCard(auction, template);
                if (card) {
                    auctionList.appendChild(card);
                }
            });
        }

        if (paginationContainer) {
            createPagination(paginationContainer, totalPages, currentPage, (newPage) => {
                loadAuctions(status, newPage, searchTerm, products, locations, sort);
            });
        }

    } catch (error) {
        console.error('İhaleler yüklenirken hata oluştu:', error);
        auctionList.innerHTML = `<p class="error-message">İhaleler yüklenirken bir hata oluştu: ${error.message}</p>`;
    }
}

// İhale kartı oluştur
function createAuctionCard(auction, template) {
    if (!template || !template.content) {
        console.error('Geçersiz şablon:', template);
        return null;
    }
    
    const cardClone = document.importNode(template.content, true);
    const cardElement = cardClone.querySelector('.auction-card');
    
    if (!cardElement) {
        console.error('Şablon içinde .auction-card bulunamadı.');
        return null;
    }

    cardElement.dataset.id = auction.id;
    cardElement.querySelector('.auction-title').textContent = auction.title;
    cardElement.querySelector('.auction-category span').textContent = auction.category;
    cardElement.querySelector('.auction-location span').textContent = auction.location;
    
    const startingPriceSpan = cardElement.querySelector('.starting-price span');
    if (startingPriceSpan) startingPriceSpan.textContent = formatCurrencyFromString(auction.startingPrice);
    
    const currentBidSpan = cardElement.querySelector('.current-bid span');
    if (currentBidSpan) currentBidSpan.textContent = formatCurrencyFromString(auction.currentBid); 

    const timeLeftSpan = cardElement.querySelector('.time-left span');
    if(timeLeftSpan) timeLeftSpan.textContent = auction.timeLeft; 

    const bidCountSpan = cardElement.querySelector('.bid-count span');
    if (bidCountSpan) bidCountSpan.textContent = auction.bidCount;

    const imageElement = cardElement.querySelector('.auction-image img');
    if (imageElement) {
        imageElement.src = auction.image || './img/placeholder-auction.png'; 
        imageElement.alt = auction.title;
    }

    const statusIndicator = cardElement.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.className = 'status-indicator'; 
        statusIndicator.classList.add(auction.status); 
        statusIndicator.textContent = auction.status === 'open' ? 'Açık' : 'Kapalı';
    }

    const viewButton = cardElement.querySelector('.btn-view-auction');
    if (viewButton) {
        viewButton.href = `#/auction/${auction.id}`; 
    }

    const quickBidButton = cardElement.querySelector('.btn-quick-bid');
    if (quickBidButton) {
        if (auction.status === 'open') {
            quickBidButton.addEventListener('click', () => {
                placeBid(auction.id, auction.currentBid);
            });
        } else {
            quickBidButton.remove(); 
        }
    }
    
    return cardElement;
}

// Sayfalama oluştur
function createPagination(container, totalPages, currentPage, onPageClick) {
    container.innerHTML = ''; 
    if (totalPages <= 1) return; 
    const maxVisibleButtons = 5; 

    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&laquo;';
        prevButton.addEventListener('click', () => onPageClick(currentPage - 1));
        container.appendChild(prevButton);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);
    if (endPage - startPage + 1 < maxVisibleButtons) {
        startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => onPageClick(1));
        container.appendChild(firstPageButton);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            container.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add('active');
            pageButton.disabled = true; 
        } else { 
            pageButton.addEventListener('click', () => onPageClick(i));
        } 
        container.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            container.appendChild(ellipsis);
        }
        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener('click', () => onPageClick(totalPages));
        container.appendChild(lastPageButton);
    }

    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&raquo;';
        nextButton.addEventListener('click', () => onPageClick(currentPage + 1));
        container.appendChild(nextButton);
    }
}

// API'den İhaleleri Getir
async function fetchAuctionsFromAPI(params) {
    console.log('API Çağrısı Parametreleri:', params);
    
    try {
        // API servisini kullan
        const response = await apiService.getAuctions({
            status: params.status || 'open',
            page: params.page || 1,
            limit: params.limit || 10,
            searchTerm: params.searchTerm || '',
            products: params.products || [],
            locations: params.locations || [],
            sort: params.sort || 'newest'
        });
        
        return response;
    } catch (error) {
        console.error('API isteği sırasında hata oluştu:', error);
        throw error;
    }
}

// İhaleye Teklif Ver
async function placeBid(auctionId, currentBidString) {
    // Kullanıcı giriş yapılmışsa kontrol et
    const isLoggedIn = checkUserAuthentication();
    if (!isLoggedIn) {
        showLoginModal();
        return;
    }
    
    // Mevcut teklifi ayrıştır
    const currentBidAmount = parseFloat(currentBidString?.replace(/[^\d.,]/g, '').replace(',', '.') || 0);
    const bidAmount = Math.round(currentBidAmount * 1.05 * 100) / 100; // %5 arttır, 2 basamak yuvarla
    
    if (bidAmount <= currentBidAmount) {
        showNotification('Teklif tutarı mevcut tekliften yüksek olmalıdır.', 'error');
        return;
    }
    
    // Teklif verme modalını göster
    showBidModal(auctionId, bidAmount);
}

// Teklif verme modalını göster
function showBidModal(auctionId, suggestedBidAmount) {
    // Var olan modalı kontrol et veya oluştur
    let bidModal = document.getElementById('bid-modal');
    
    if (!bidModal) {
        // Modal henüz yoksa oluştur
        bidModal = document.createElement('div');
        bidModal.id = 'bid-modal';
        bidModal.className = 'modal';
        
        bidModal.innerHTML = `
            <div class="modal-content bid-modal-content">
                <span class="close">&times;</span>
                <h2>Teklif Ver</h2>
                <form id="bid-form">
                    <div class="form-group">
                        <label for="bid-amount">Teklif Tutarı (TL)</label>
                        <input type="number" id="bid-amount" step="0.01" min="0" required>
                        <small>Minimum teklif: ₺<span id="min-bid-amount">0.00</span></small>
                    </div>
                    <div class="form-group">
                        <label for="bid-note">Not (İsteğe Bağlı)</label>
                        <textarea id="bid-note" rows="3" placeholder="Teklifiniz hakkında ek bilgi..."></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary modal-cancel">İptal</button>
                        <button type="submit" class="btn btn-primary">Teklif Ver</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(bidModal);
    }
    
    // Input değerlerini ayarla
    const bidInput = bidModal.querySelector('#bid-amount');
    const minBidSpan = bidModal.querySelector('#min-bid-amount');
    
    bidInput.value = suggestedBidAmount.toFixed(2);
    minBidSpan.textContent = suggestedBidAmount.toFixed(2);
    
    // Form gönderme olayını dinle
    const bidForm = bidModal.querySelector('#bid-form');
    bidForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const bidAmount = parseFloat(bidInput.value);
        const bidNote = bidModal.querySelector('#bid-note').value;
        
        if (isNaN(bidAmount) || bidAmount < suggestedBidAmount) {
            showNotification(`Teklif tutarı en az ${formatCurrency(suggestedBidAmount)} olmalıdır.`, 'error');
            return;
        }
        
        try {
            // Submit butonunu devre dışı bırak ve yükleniyor durumunu göster
            const submitBtn = bidForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> İşleniyor...';
            
            // API çağrısı yap
            const response = await apiService.placeBid(auctionId, bidAmount, bidNote);
            
            if (response.success) {
                showNotification(`Teklif başarıyla verildi: ${formatCurrency(bidAmount)}`, 'success');
                // İhaleleri yeniden yükle
                filterAuctions();
                // Modalı kapat
                closeBidModal();
            } else {
                showNotification(response.message || 'Teklif verilirken bir hata oluştu.', 'error');
            }
        } catch (error) {
            console.error('Teklif verilirken hata oluştu:', error);
            showNotification('Teklif işlemi sırasında bir hata oluştu.', 'error');
        } finally {
            // Submit butonunu normale döndür
            const submitBtn = bidForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Teklif Ver';
        }
    };
    
    // Kapat düğmesini ayarla
    const closeBtn = bidModal.querySelector('.close');
    const cancelBtn = bidModal.querySelector('.modal-cancel');
    
    closeBtn.onclick = closeBidModal;
    cancelBtn.onclick = closeBidModal;
    
    // Modalı göster
    bidModal.style.display = 'block';
    
    // Input'a odaklan
    bidInput.focus();
    bidInput.select();
    
    // Modal dışına tıklama
    window.onclick = function(event) {
        if (event.target === bidModal) {
            closeBidModal();
        }
    };
}

// Teklif modalını kapat
function closeBidModal() {
    const bidModal = document.getElementById('bid-modal');
    if (bidModal) {
        bidModal.style.display = 'none';
        // Form eventlerini temizle
        const bidForm = bidModal.querySelector('#bid-form');
        if (bidForm) bidForm.onsubmit = null;
    }
}

// İhale detay modalı ayarla
function setupAuctionDetailModal() {
    // Var olan modalı kontrol et
    let detailModal = document.getElementById('auction-detail-modal');
    
    if (!detailModal) {
        // Modal henüz yoksa oluştur
        detailModal = document.createElement('div');
        detailModal.id = 'auction-detail-modal';
        detailModal.className = 'modal';
        
        detailModal.innerHTML = `
            <div class="modal-content auction-detail-content">
                <span class="close">&times;</span>
                <div class="auction-detail-header">
                    <h2 id="detail-auction-title">İhale Detayı</h2>
                    <span class="status-indicator" id="detail-status-indicator">Açık</span>
                </div>
                <div class="auction-detail-body">
                    <div class="auction-detail-image">
                        <img id="detail-auction-image" src="./img/placeholder-auction.png" alt="İhale Görseli">
                    </div>
                    <div class="auction-detail-info">
                        <p><strong>Kategori:</strong> <span id="detail-auction-category">-</span></p>
                        <p><strong>Konum:</strong> <span id="detail-auction-location">-</span></p>
                        <p><strong>Başlangıç Fiyatı:</strong> <span id="detail-starting-price">-</span></p>
                        <p><strong>Mevcut Teklif:</strong> <span id="detail-current-bid">-</span></p>
                        <p><strong>Kalan Süre:</strong> <span id="detail-time-left">-</span></p>
                        <p><strong>Teklif Sayısı:</strong> <span id="detail-bid-count">-</span></p>
                    </div>
                </div>
                <div class="auction-detail-description">
                    <h3>İhale Açıklaması</h3>
                    <p id="detail-auction-description">-</p>
                </div>
                <div class="auction-detail-actions">
                    <button class="btn btn-secondary modal-close">Kapat</button>
                    <button class="btn btn-primary" id="detail-bid-button">Teklif Ver</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(detailModal);
        
        // Kapat düğmelerini ayarla
        const closeBtn = detailModal.querySelector('.close');
        const cancelBtn = detailModal.querySelector('.modal-close');
        
        closeBtn.onclick = closeDetailModal;
        cancelBtn.onclick = closeDetailModal;
        
        // Dışarıya tıklamayı dinle
        window.onclick = function(event) {
            if (event.target === detailModal) {
                closeDetailModal();
            }
        };
    }
    
    // İhale kartlarına tıklama eventlerini ekle (delegated event)
    document.addEventListener('click', function(e) {
        // İhale kartı veya görüntüle düğmesine tıklandığında
        if (e.target && (e.target.classList.contains('btn-view-auction') || 
            e.target.closest('.auction-card'))) {
            
            // Eğer teklif ver düğmesine tıklandıysa, modal açmayı engelle
            if (e.target.classList.contains('btn-quick-bid')) {
                return;
            }
            
            // İhale ID'sini al
            const auctionCard = e.target.closest('.auction-card');
            if (!auctionCard) return;
            
            const auctionId = auctionCard.dataset.id;
            if (!auctionId) return;
            
            e.preventDefault(); // Varsayılan davranışı engelle
            openAuctionDetail(auctionId);
        }
    });
}

// İhale detaylarını göster
async function openAuctionDetail(auctionId) {
    const detailModal = document.getElementById('auction-detail-modal');
    if (!detailModal) return;
    
    try {
        // Yükleme durumu göster
        detailModal.querySelector('#detail-auction-title').textContent = 'Yükleniyor...';
        detailModal.querySelector('#detail-auction-category').textContent = '-';
        detailModal.querySelector('#detail-auction-location').textContent = '-';
        detailModal.querySelector('#detail-starting-price').textContent = '-';
        detailModal.querySelector('#detail-current-bid').textContent = '-';
        detailModal.querySelector('#detail-time-left').textContent = '-';
        detailModal.querySelector('#detail-bid-count').textContent = '-';
        detailModal.querySelector('#detail-auction-description').textContent = 'Yükleniyor...';
        
        // Modalı göster
        detailModal.style.display = 'block';
        
        // API'den ihale detaylarını getir
        const auction = await apiService.getAuctionDetails(auctionId);
        
        if (!auction) {
            throw new Error('İhale bilgileri alınamadı.');
        }
        
        // Modal içeriğini güncelle
        detailModal.querySelector('#detail-auction-title').textContent = auction.title;
        detailModal.querySelector('#detail-auction-category').textContent = auction.category;
        detailModal.querySelector('#detail-auction-location').textContent = auction.location;
        detailModal.querySelector('#detail-starting-price').textContent = formatCurrencyFromString(auction.startingPrice);
        detailModal.querySelector('#detail-current-bid').textContent = formatCurrencyFromString(auction.currentBid);
        detailModal.querySelector('#detail-time-left').textContent = auction.timeLeft;
        detailModal.querySelector('#detail-bid-count').textContent = auction.bidCount;
        detailModal.querySelector('#detail-auction-description').textContent = auction.description || 'Bu ihale için açıklama bulunmamaktadır.';
        
        // Resmi güncelle
        const imageElement = detailModal.querySelector('#detail-auction-image');
        if (imageElement) {
            imageElement.src = auction.image || './img/placeholder-auction.png'; 
            imageElement.alt = auction.title;
        }
        
        // Durum göstergesini güncelle
        const statusIndicator = detailModal.querySelector('#detail-status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator'; 
            statusIndicator.classList.add(auction.status); 
            statusIndicator.textContent = auction.status === 'open' ? 'Açık' : 'Kapalı';
        }
        
        // Teklif ver düğmesini duruma göre güncelle
        const bidButton = detailModal.querySelector('#detail-bid-button');
        if (bidButton) {
            if (auction.status === 'open') {
                bidButton.style.display = 'inline-block';
                bidButton.onclick = function() {
                    closeDetailModal();
                    placeBid(auction.id, auction.currentBid);
                };
            } else {
                bidButton.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('İhale detayları yüklenirken hata oluştu:', error);
        showNotification('İhale detayları yüklenirken bir hata oluştu.', 'error');
        closeDetailModal();
    }
}

// İhale detay modalını kapat
function closeDetailModal() {
    const detailModal = document.getElementById('auction-detail-modal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
}

// Kullanıcı oturum durumunu kontrol et
function checkUserAuthentication() {
    // apiService üzerinden token kontrolü yap
    return !!apiService.token;
}

// Giriş modalını göster
function showLoginModal() {
    showNotification('Teklif verebilmek için giriş yapmalısınız.', 'info');
    
    // 1 saniye sonra login sayfasına yönlendir
    setTimeout(() => {
        window.location.hash = '#/login';
    }, 1000);
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notificationContainer = document.querySelector('.notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Bildirim kapatma işlevi
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Otomatik kapat
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
}

// Bildirim konteyneri oluştur
function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

// Para birimi formatla
function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) {
        return 'N/A';
    }
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

// String'den para birimi formatla
function formatCurrencyFromString(priceString) {
    if (!priceString) return 'N/A';
    const match = priceString.match(/(\d+([.,]\d+)?)/);
    const amount = match ? parseFloat(match[0].replace(',', '.')) : 0;
    return formatCurrency(amount);
}

// Debounce fonksiyonu
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// "İhale Oluştur" butonunun görünürlüğünü kontrol et
async function checkCreateAuctionButton() {
    // Test amacıyla doğrudan butonu göster
    console.log('İhale Oluştur butonu kontrolü yapılıyor...');
    const createAuctionBtnContainer = document.getElementById('createAuctionButtonContainer');
    const createAuctionBtn = document.getElementById('createAuctionButton');
    
    // Elementler var mı kontrol et
    if (!createAuctionBtnContainer || !createAuctionBtn) {
        console.error('createAuctionButton elementleri bulunamadı!');
        return;
    }
    
    try {
        // Test için kullanıcının her zaman giriş yapmış olduğunu varsayalım
        createAuctionBtnContainer.style.display = 'block';
        
        // Tıklama olayını ekle
        createAuctionBtn.removeEventListener('click', openCreateAuctionForm); // Önceki event listener'ı kaldır
        createAuctionBtn.addEventListener('click', openCreateAuctionForm);
        console.log('İhale Oluştur butonuna event listener eklendi.');
        
        /* Gerçek kontrol (daha sonra etkinleştirilecek)
        try {
            const userInfo = await apiService.getUserProfile();
            console.log('Kullanıcı bilgileri yüklendi:', userInfo);
            
            if (userInfo && userInfo.isLoggedIn) {
                createAuctionBtnContainer.style.display = 'block';
                createAuctionBtn.removeEventListener('click', openCreateAuctionForm);
                createAuctionBtn.addEventListener('click', openCreateAuctionForm);
                console.log('İhale Oluştur butonuna event listener eklendi.');
            } else {
                createAuctionBtnContainer.style.display = 'none';
                console.log('Kullanıcı giriş yapmadığı için buton gizlendi.');
            }
        } catch (error) {
            console.error('Kullanıcı bilgileri alınırken hata:', error);
            createAuctionBtnContainer.style.display = 'none';
        }
        */
    } catch (error) {
        console.error('Butonu kontrol ederken hata oluştu:', error);
    }
}

// İhale oluşturma formunu aç
async function openCreateAuctionForm() {
    try {
        // createAuction.html sayfasını yükle
        const response = await fetch('/components/createAuction.html');
        if (!response.ok) throw new Error('createAuction.html yüklenemedi');
        
        const html = await response.text();
        
        // Mevcut modal varsa kaldır
        const existingModal = document.querySelector('.create-auction-container');
        if (existingModal) existingModal.remove();
        
        // Yeni modalı ekle
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Form olaylarını ayarla
        setupCreateAuctionEvents();
        setupCreateAuctionTabs();
        await setupMaterialRequestTable();
        
        // Modalı göster
        const modal = document.querySelector('.create-auction-container');
        if (modal) {
            modal.style.display = 'block';
            
            // Kapatma butonunu ayarla
            const closeBtn = modal.querySelector('.create-auction-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.style.display = 'none';
                };
            }
            
            // Modal dışına tıklamayı dinle
            window.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }
    } catch (error) {
        console.error('İhale oluşturma formu açılırken hata:', error);
        showNotification('İhale oluşturma formu açılamadı', 'error');
    }
}

// İhale oluşturma formunu kur (önceden oluşturulduysa)
function setupCreateAuctionForm() {
    const formContainer = document.getElementById('createAuctionFormContainer');
    if (formContainer) {
        setupCreateAuctionEvents();
    }
}

// İhale oluşturma formu olaylarını ayarla
function setupCreateAuctionEvents() {
    // Sekmeler arası geçiş
    setupCreateAuctionTabs();
    
    // "Kapat" butonunu ayarla
    const closeButton = document.querySelector('.create-auction-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeCreateAuctionForm);
    }
    
    // Malzeme Talep Formu satır ekleme ve işlemleri
    setupMaterialRequestTable();
    
    // Excel içe/dışa aktarma butonları
    setupExcelActions();
    
    // Alt butonları ayarla
    setupActionButtons();
    
    // Otomatik genişleyen textarea'ları ayarla
    setupAutoExpandableTextareas();
}

// İhale oluşturma sekmelerini ayarla
function setupCreateAuctionTabs() {
    const tabs = document.querySelectorAll('.create-auction-tab');
    const tabContents = document.querySelectorAll('.create-auction-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Aktif sekmeleri kaldır
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Tıklanan sekmeyi aktif yap
            tab.classList.add('active');
            
            // İlgili içeriği aktif yap
            const tabId = tab.dataset.tab;
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');
            }
        });
    });
    
    // "Sonraki" butonları
    const nextButtons = document.querySelectorAll('.next-tab');
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextTabId = button.getAttribute('data-next');
            const nextTab = document.querySelector(`.create-auction-tab[data-tab="${nextTabId}"]`);
            if (nextTab) {
                nextTab.click();
            }
        });
    });
    
    // "Önceki" butonları
    const prevButtons = document.querySelectorAll('.prev-tab');
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevTabId = button.getAttribute('data-prev');
            const prevTab = document.querySelector(`.create-auction-tab[data-tab="${prevTabId}"]`);
            if (prevTab) {
                prevTab.click();
            }
        });
    });
}

// Malzeme Talep Formu tablosunu ayarla
async function setupMaterialRequestTable() {
    // Yeni satır ekleme butonu
    const addRowButton = document.getElementById('addMaterialRow');
    if (addRowButton) {
        addRowButton.addEventListener('click', addMaterialRequestRow);
    }
    
    // Mevcut satırlara olay dinleyicileri ekle
    setupTableRowActions();

    // İlk yükleme için talep numarası güncelleme
    await updateInitialRequestNumbers();
    
    // Sürükle-bırak sıralama işlevini etkinleştir
    setupDragAndDrop();
    
    // Detay modalı kapat butonunu ayarla
    setupDetailsModal();
}

// İlk yükleme için talep numaraları güncelleme
async function updateInitialRequestNumbers() {
    console.log('İlk talep numaraları kontrol ediliyor...');
    
    // Tablodaki tüm satırları al
    const table = document.getElementById('materialRequestTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length === 0) return;
    
    // İlk satırın talep numarasını al veya oluştur
    const firstRow = rows[0];
    const firstRowRequestInput = firstRow.querySelector('input[name="request_no"]');
    
    let mainRequestNo;
    
    // İlk satırda talep numarası boşsa yeni oluştur
    if (firstRowRequestInput && (!firstRowRequestInput.value || firstRowRequestInput.value === firstRowRequestInput.placeholder)) {
        console.log('İlk satır için yeni talep numarası oluşturuluyor...');
        mainRequestNo = await generateRequestNumber();
        firstRowRequestInput.value = mainRequestNo;
        firstRowRequestInput.className = 'auto-generated-field';
        firstRowRequestInput.readOnly = true;
    } else if (firstRowRequestInput) {
        // İlk satırda talep numarası varsa kullan
        mainRequestNo = firstRowRequestInput.value;
    } else {
        // İlk satırda input yoksa (hatalı durum), yeni oluştur
        mainRequestNo = await generateRequestNumber();
    }
    
    // Eğer birden fazla satır varsa, diğer tüm satırlardaki talep numaralarını ilk satır ile aynı yap
    if (rows.length > 1) {
        console.log('Tüm satırlar için aynı talep numarası uygulanıyor:', mainRequestNo);
        
        // İlk satırdan sonraki tüm satırlar için
        for (let i = 1; i < rows.length; i++) {
            const requestNoInput = rows[i].querySelector('input[name="request_no"]');
            if (requestNoInput) {
                requestNoInput.value = mainRequestNo;
                requestNoInput.className = 'auto-generated-field';
                requestNoInput.readOnly = true;
            }
        }
    }
    
    console.log('Talep numaraları güncellemesi tamamlandı.');
}

// Malzeme Talep Tablosuna yeni satır ekle
async function addMaterialRequestRow() {
    const table = document.getElementById('materialRequestTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    
    // Her yeni satır için yeni talep numarası oluştur
    const requestNo = await generateRequestNumber();
    console.log('Yeni satır için talep numarası oluşturuldu:', requestNo);
    
    // Malzeme talebini backend'e kaydet
    try {
        const materialRequest = {
            requestNumber: requestNo,
            date: getCurrentDate(),
            status: 'PENDING'
        };
        
        const createdRequest = await apiService.createMaterialRequest(materialRequest);
        console.log('Malzeme talebi başarıyla kaydedildi:', createdRequest);
    } catch (error) {
        console.error('Malzeme talebi kaydedilirken hata oluştu:', error);
    }
    
    // Türkiye illerini al
    const turkeyProvinces = [ 
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
        "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
        "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
        "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
        "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
        "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
        "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
        "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    ];
    
    // İller için options HTML'ini oluştur
    let locationOptionsHTML = '<option value="">Seçiniz</option>';
    turkeyProvinces.forEach(province => {
        locationOptionsHTML += `<option value="${province}">${province}</option>`;
    });
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <div class="d-flex align-items-center">
                <span class="material-request-no">${requestNo}</span>
            </div>
        </td>
        <td>
            <input type="date" name="date" value="${getCurrentDate()}">
        </td>
        <td>
            <select name="location">
                ${locationOptionsHTML}
            </select>
        </td>
        <td>
            <input type="text" name="product_name" placeholder="Ürün Adı">
        </td>
        <td>
            <input type="number" name="quantity" placeholder="Miktar">
        </td>
        <td>
            <select name="unit">
                <option value="">Birim</option>
                <option value="ADET">ADET</option>
                <option value="KG">KG</option>
                <option value="TON">TON</option>
                <option value="M">M</option>
                <option value="M²">M²</option>
                <option value="M³">M³</option>
                <option value="LT">LT</option>
                <option value="TORBA">TORBA</option>
                <option value="PAKET">PAKET</option>
                <option value="ÇUVAL">ÇUVAL</option>
                <option value="TOP">TOP</option>
            </select>
        </td>
        <td>
            <textarea name="product_specs" placeholder="Ürün özellikleri" class="auto-expandable"></textarea>
        </td>
        <td>
            <textarea name="usage_area" placeholder="Kullanım Yeri" class="auto-expandable"></textarea>
        </td>
        <td>
            <select name="payment_type">
                <option value="">Seçiniz</option>
                <option value="Nakit/Havale">Nakit/Havale</option>
                <option value="Kredi Kartı">Kredi Kartı</option>
                <option value="30 Günlük Çek">30 Günlük Çek</option>
                <option value="60 Günlük Çek">60 Günlük Çek</option>
                <option value="75 Günlük Çek">75 Günlük Çek</option>
                <option value="90 Günlük Çek">90 Günlük Çek</option>
                <option value="105 Günlük Çek">105 Günlük Çek</option>
                <option value="120 Günlük Çek">120 Günlük Çek</option>
                <option value="150 Günlük Çek">150 Günlük Çek</option>
                <option value="180 Günlük Çek">180 Günlük Çek</option>
            </select>
        </td>
        <td class="table-actions">
            <div class="primary-actions">
                <button type="button" class="table-action-btn drag-handle" title="Sürükle & Sırala">
                    <i class="fa-solid fa-grip-vertical"></i>
                </button>
                <button type="button" class="table-action-btn details" title="Detayları Göster">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button type="button" class="table-action-btn edit" title="Düzenle">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>
            <div class="secondary-actions">
                <button type="button" class="table-action-btn duplicate" title="Çoğalt">
                    <i class="fa-solid fa-copy"></i>
                </button>
                <button type="button" class="table-action-btn delete" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Olay dinleyicilerini ekle
    setupTableRowActions(newRow);
    
    // Yeni satır için sürükle-bırak özelliğini ayarla
    const dragHandle = newRow.querySelector('.table-action-btn.drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', function() {
            newRow.setAttribute('draggable', 'true');
            setupRowDragEvents(newRow);
        });
        
        newRow.addEventListener('dragend', function() {
            newRow.setAttribute('draggable', 'false');
        });
    }
    
    // Auto-expandable textarea'ları ayarla
    const expandables = newRow.querySelectorAll('.auto-expandable');
    expandables.forEach(setupAutoExpandTextarea);
}

// Backend'den talep numarası al
async function generateRequestNumber() {
    try {
        const requestNumber = await apiService.generateRequestNumber();
        return requestNumber;
    } catch (error) {
        console.error('Talep numarası alma hatası:', error);
        // Hata durumunda yerel olarak oluştur
        const date = new Date();
        const timestamp = date.getTime();
        return `INS-${timestamp}`;
    }
}

// Bugünün tarihini YYYY-MM-DD formatında döndür
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Tablo satır işlemlerini ayarla
function setupTableRowActions(targetRow = null) {
    const rows = targetRow ? [targetRow] : document.querySelectorAll('#materialRequestTable tbody tr');
    
    rows.forEach(row => {
        // Düzenleme butonu (halihazırda düzenlenebilir olduğu için özel bir işlem gerekmez)
        
        // Detayları gösterme butonu
        const detailsBtn = row.querySelector('.table-action-btn.details');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => showMaterialDetails(row));
        }
        
        // Çoğaltma butonu
        const duplicateBtn = row.querySelector('.table-action-btn.duplicate');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => duplicateTableRow(row));
        }
        
        // Silme butonu
        const deleteBtn = row.querySelector('.table-action-btn.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteTableRow(row));
        }
    });
}

// Tablo satırını çoğalt
function duplicateTableRow(row) {
    const table = document.getElementById('materialRequestTable');
    const tbody = table.querySelector('tbody');
    
    // Satırı klonla
    const newRow = row.cloneNode(true);
    
    // Sıra numarasını güncelle
    const rowCount = tbody.querySelectorAll('tr').length + 1;
    newRow.querySelector('td:first-child').textContent = rowCount;
    
    // Talep numarasını ilk satırdaki ile aynı yap
    const firstRowRequestInput = document.querySelector('#materialRequestTable tbody tr:first-child input[name="request_no"]');
    const newRowRequestInput = newRow.querySelector('input[name="request_no"]');
    
    if (firstRowRequestInput && firstRowRequestInput.value && newRowRequestInput) {
        // İlk satırdaki talep numarasını set et
        newRowRequestInput.value = firstRowRequestInput.value;
        console.log('Çoğaltılan satıra ilk satırdaki talep numarası uygulandı:', firstRowRequestInput.value);
    }
    
    // Satırı ekle
    tbody.appendChild(newRow);
    
    // Olay dinleyicilerini ekle
    setupTableRowActions(newRow);
    
    // Yeni satır için sürükle-bırak özelliğini ayarla
    const dragHandle = newRow.querySelector('.table-action-btn.drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('mousedown', function() {
            newRow.setAttribute('draggable', 'true');
            setupRowDragEvents(newRow);
        });
        
        newRow.addEventListener('dragend', function() {
            newRow.setAttribute('draggable', 'false');
        });
    }
    
    // Auto-expandable textarea'ları ayarla
    const expandables = newRow.querySelectorAll('.auto-expandable');
    expandables.forEach(setupAutoExpandTextarea);
}

// Tablo satırını sil
function deleteTableRow(row) {
    if (confirm('Bu satırı silmek istediğinize emin misiniz?')) {
        row.remove();
        
        // Sıra numaralarını güncelle
        const rows = document.querySelectorAll('#materialRequestTable tbody tr');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
    }
}

// Excel eylemlerini ayarla
function setupExcelActions() {
    // Bu fonksiyon artık DOMContentLoaded olay dinleyicisi 
    // içindeki kodlar tarafından işlendiği için boş bırakılabilir
    console.log('Excel butonları DOMContentLoaded içinde ayarlanacak');
}

// Excel kütüphanesini dinamik olarak yükleme fonksiyonu
function loadExcelLibrary() {
    return new Promise((resolve, reject) => {
        // Eğer XLSX zaten yüklüyse, işlemi tamamla
        if (window.XLSX) {
            hideExcelLoader();
            resolve();
            return;
        }
        
        // Yükleme göstergesini göster
        showExcelLoader('Excel kütüphanesi yükleniyor...');
        
        // SheetJS (xlsx) kütüphanesini yükle
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('XLSX kütüphanesi başarıyla yüklendi');
            hideExcelLoader();
            resolve();
        };
        
        script.onerror = (e) => {
            console.error('XLSX kütüphanesi yüklenemedi:', e);
            hideExcelLoader();
            reject(new Error('Excel kütüphanesi yüklenemedi'));
        };
        
        document.head.appendChild(script);
    });
}

// Yükleme göstergesini gösterme
function showExcelLoader(message) {
    // Eğer zaten varsa, mesajı güncelle
    let loader = document.querySelector('.excel-loader');
    
    if (loader) {
        loader.querySelector('.excel-loader-message').textContent = message;
        return;
    }
    
    // Yeni yükleme göstergesi oluştur
    loader = document.createElement('div');
    loader.className = 'excel-loader';
    
    const content = document.createElement('div');
    content.className = 'excel-loader-content';
    
    const spinner = document.createElement('div');
    spinner.className = 'excel-spinner';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'excel-loader-message';
    messageElement.textContent = message;
    
    content.appendChild(spinner);
    content.appendChild(messageElement);
    loader.appendChild(content);
    
    document.body.appendChild(loader);
}

// Yükleme göstergesini gizleme
function hideExcelLoader() {
    const loader = document.querySelector('.excel-loader');
    if (loader) {
        loader.remove();
    }
}

function importExcelData() {
    // Dosya seçme input elemanı oluştur
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls, .csv';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleExcelFile);
    document.body.appendChild(fileInput);
    
    // Tıklama olayını tetikle
    fileInput.click();
    
    // Dosya seçildikten sonra
    function handleExcelFile(e) {
        const file = e.target.files[0];
        if (!file) {
            document.body.removeChild(fileInput);
            return;
        }
        
        // Yükleniyor bildirimi göster
        showExcelLoader('Excel dosyası yükleniyor...');
        showNotification('Excel dosyası yükleniyor...', 'info');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = event.target.result;
                
                // Excel yükleme mesajını güncelle
                showExcelLoader('Excel verileri işleniyor...');
                
                // SheetJS kütüphanesini kullanarak Excel verilerini oku
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Excel verilerini JS nesnesine dönüştür
                const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Yükleme mesajını güncelle
                showExcelLoader('Veriler tabloya aktarılıyor...');
                
                // Veriyi tabloya doldur
                processExcelData(excelData);
                
                // Yükleme göstergesini kaldır
                hideExcelLoader();
                
                showNotification('Excel verisi başarıyla içe aktarıldı', 'success');
            } catch (error) {
                console.error('Excel verileri okunurken hata oluştu:', error);
                showNotification('Excel dosyası işlenirken hata oluştu', 'error');
                hideExcelLoader();
            }
            
            // Input elemanını temizle
            document.body.removeChild(fileInput);
        };
        
        reader.onerror = function() {
            showNotification('Dosya okunamadı', 'error');
            document.body.removeChild(fileInput);
            hideExcelLoader();
        };
        
        // Dosyayı ikili (binary) olarak oku
        reader.readAsBinaryString(file);
    }
}

function exportExcelData() {
    try {
        // XLSX tanımlı mı kontrol et
        if (!window.XLSX) {
            throw new Error("XLSX kütüphanesi bulunamadı, sayfa yenilendikten sonra tekrar deneyin.");
        }
        
        // Yükleme göstergesini göster
        showExcelLoader('Excel dosyası hazırlanıyor...');
        
        // Tablo verilerini al
        const table = document.getElementById('materialRequestTable');
        if (!table) {
            throw new Error("Malzeme talep tablosu bulunamadı.");
        }
        
        // Tablo başlıklarını al
        const headerRow = table.querySelector('thead tr');
        const headers = Array.from(headerRow.cells).map(cell => cell.textContent.trim());
        
        // Tablo verilerini al
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const data = [headers];
        
        // Yükleme mesajını güncelle
        showExcelLoader('Veriler dışa aktarılıyor...');
        
        rows.forEach(row => {
            const rowData = [];
            
            // Sıra No
            rowData.push(row.cells[0].textContent.trim());
            
            // Talep No
            rowData.push(row.querySelector('input[name="request_no"]').value);
            
            // Tarih
            rowData.push(row.querySelector('input[name="date"]').value);
            
            // Sevk Yeri
            const locationSelect = row.querySelector('select[name="location"]');
            rowData.push(locationSelect.options[locationSelect.selectedIndex].text);
            
            // Ürün Adı
            rowData.push(row.querySelector('input[name="product_name"]').value);
            
            // Miktar
            rowData.push(row.querySelector('input[name="quantity"]').value);
            
            // Birim
            const unitSelect = row.querySelector('select[name="unit"]');
            rowData.push(unitSelect.options[unitSelect.selectedIndex].text);
            
            // Ürün Özellikleri
            rowData.push(row.querySelector('textarea[name="product_specs"]').value);
            
            // Kullanım Yeri
            rowData.push(row.querySelector('textarea[name="usage_area"]').value);
            
            // Ödeme Tipi
            const paymentSelect = row.querySelector('select[name="payment_type"]');
            rowData.push(paymentSelect.options[paymentSelect.selectedIndex].text);
            
            // İşlemler sütununu dahil etme
            
            data.push(rowData);
        });
        
        console.log('Excel veri dizisi oluşturuldu:', data);
        
        // XLSX nesnesi oluştur
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Malzeme Talebi");
        
        // Excel dosyası olarak indir
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const fileName = `Malzeme_Talep_${dateStr}_${timeStr}.xlsx`;
        
        // Yükleme mesajını güncelle
        showExcelLoader('Dosya indiriliyor...');
        
        console.log('Excel dosyası oluşturuldu, indiriliyor:', fileName);
        XLSX.writeFile(workbook, fileName);
        
        // Yükleme göstergesini kaldır
        hideExcelLoader();
        
        showNotification('Excel dosyası başarıyla indirildi', 'success');
    } catch (error) {
        console.error('Excel dosyası oluşturulurken hata oluştu:', error);
        hideExcelLoader();
        showNotification(`Excel dosyası oluşturulurken hata oluştu: ${error.message}`, 'error');
    }
}

function processExcelData(excelData) {
    if (!excelData || excelData.length < 2) {
        showNotification('Geçerli veri bulunamadı', 'error');
        return;
    }
    
    const table = document.getElementById('materialRequestTable');
    const tbody = table.querySelector('tbody');
    
    // Tablo başlıklarını al (ilk satır)
    const headers = excelData[0];
    
    // Başlıkların hangi indekslerde olduğunu bul
    const columnIndexes = {
        requestNo: headers.findIndex(h => /talep\s*no/i.test(h)),
        date: headers.findIndex(h => /tarih/i.test(h)),
        location: headers.findIndex(h => /sevk\s*yeri|lokasyon/i.test(h)),
        productName: headers.findIndex(h => /ürün\s*adı|malzeme/i.test(h)),
        quantity: headers.findIndex(h => /miktar/i.test(h)),
        unit: headers.findIndex(h => /birim/i.test(h)),
        productSpecs: headers.findIndex(h => /ürün\s*özellikleri|teknik/i.test(h)),
        usageArea: headers.findIndex(h => /kullanım\s*yeri|alan/i.test(h)),
        paymentType: headers.findIndex(h => /ödeme\s*tipi/i.test(h))
    };
    
    // Başlıkların geçerli olup olmadığını kontrol et
    const missingColumns = Object.entries(columnIndexes)
        .filter(([key, index]) => index === -1)
        .map(([key]) => key);
    
    if (missingColumns.length > 0) {
        showNotification(`Eksik sütunlar: ${missingColumns.join(', ')}`, 'warning');
    }
    
    // Mevcut satırları temizle (başlık satırını bırak)
    while (tbody.rows.length > 1) {
        tbody.deleteRow(1);
    }
    
    // Veri satırlarını işle (başlık satırından sonraki satırlar)
    for (let i = 1; i < excelData.length; i++) {
        const rowData = excelData[i];
        
        // Boş satırları atla
        if (rowData.every(cell => !cell || cell.toString().trim() === '')) {
            continue;
        }
        
        // Yeni satır oluştur
        addMaterialRequestRow();
        const newRow = tbody.rows[tbody.rows.length - 1];
        
        // Veriyi satıra yerleştir
        fillTableRowWithData(newRow, rowData, columnIndexes);
    }
    
    // Satır numaralarını güncelle
    updateRowNumbers();
}

function fillTableRowWithData(row, rowData, columnIndexes) {
    // Her bir hücreyi doldur
    if (columnIndexes.requestNo !== -1 && rowData[columnIndexes.requestNo]) {
        row.querySelector('input[name="request_no"]').value = rowData[columnIndexes.requestNo];
    }
    
    if (columnIndexes.date !== -1 && rowData[columnIndexes.date]) {
        // Tarih formatını düzenle
        let dateValue = rowData[columnIndexes.date];
        
        // Excel tarih formatını kontrol et ve dönüştür
        if (typeof dateValue === 'number') {
            // Excel'deki tarih, 1899-12-30'dan itibaren geçen gün sayısıdır
            const excelEpoch = new Date(1899, 11, 30);
            const resultDate = new Date(excelEpoch);
            resultDate.setDate(excelEpoch.getDate() + dateValue);
            dateValue = resultDate;
        } else if (typeof dateValue === 'string') {
            // String formatındaki tarihi Date nesnesine çevir
            dateValue = new Date(dateValue);
        }
        
        // Tarih geçerliyse YYYY-MM-DD formatına çevir
        if (dateValue instanceof Date && !isNaN(dateValue)) {
            const formattedDate = dateValue.toISOString().split('T')[0];
            row.querySelector('input[name="date"]').value = formattedDate;
        }
    }
    
    if (columnIndexes.location !== -1 && rowData[columnIndexes.location]) {
        const locationSelect = row.querySelector('select[name="location"]');
        setSelectOption(locationSelect, rowData[columnIndexes.location]);
    }
    
    if (columnIndexes.productName !== -1 && rowData[columnIndexes.productName]) {
        row.querySelector('input[name="product_name"]').value = rowData[columnIndexes.productName];
    }
    
    if (columnIndexes.quantity !== -1 && rowData[columnIndexes.quantity]) {
        row.querySelector('input[name="quantity"]').value = rowData[columnIndexes.quantity];
    }
    
    if (columnIndexes.unit !== -1 && rowData[columnIndexes.unit]) {
        const unitSelect = row.querySelector('select[name="unit"]');
        setSelectOption(unitSelect, rowData[columnIndexes.unit]);
    }
    
    if (columnIndexes.productSpecs !== -1 && rowData[columnIndexes.productSpecs]) {
        const textarea = row.querySelector('textarea[name="product_specs"]');
        textarea.value = rowData[columnIndexes.productSpecs];
        adjustTextareaHeight(textarea);
    }
    
    if (columnIndexes.usageArea !== -1 && rowData[columnIndexes.usageArea]) {
        const textarea = row.querySelector('textarea[name="usage_area"]');
        textarea.value = rowData[columnIndexes.usageArea];
        adjustTextareaHeight(textarea);
    }
    
    if (columnIndexes.paymentType !== -1 && rowData[columnIndexes.paymentType]) {
        const paymentSelect = row.querySelector('select[name="payment_type"]');
        setSelectOption(paymentSelect, rowData[columnIndexes.paymentType]);
    }
}

function setSelectOption(selectElement, value) {
    // Önce tam eşleşme ara
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value.toLowerCase() === value.toString().toLowerCase()) {
            selectElement.selectedIndex = i;
            return;
        }
    }
    
    // Tam eşleşme yoksa, benzer değer ara
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text.toLowerCase().includes(value.toString().toLowerCase())) {
            selectElement.selectedIndex = i;
            return;
        }
    }
}

// Excel butonları için kütüphane kontrolü yap
document.addEventListener('DOMContentLoaded', function() {
    const importExcelBtn = document.getElementById('importExcel');
    const exportExcelBtn = document.getElementById('exportExcel');
    
    if (importExcelBtn) {
        // Tüm önceki olay dinleyicilerini kaldır
        const newImportBtn = importExcelBtn.cloneNode(true);
        importExcelBtn.parentNode.replaceChild(newImportBtn, importExcelBtn);
        
        // Yeni olay dinleyicisi ekle
        newImportBtn.addEventListener('click', async function() {
            try {
                // Excel kütüphanesini yükle
                await loadExcelLibrary();
                // İçe aktarma işlemini başlat
                importExcelData();
            } catch (error) {
                showNotification('Excel işlemi için gereken kütüphane yüklenemedi', 'error');
                console.error(error);
            }
        });
    }
    
    if (exportExcelBtn) {
        // Tüm önceki olay dinleyicilerini kaldır
        const newExportBtn = exportExcelBtn.cloneNode(true);
        exportExcelBtn.parentNode.replaceChild(newExportBtn, exportExcelBtn);
        
        // Yeni olay dinleyicisi ekle
        newExportBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                // Excel kütüphanesini yükle
                await loadExcelLibrary();
                // Dışa aktarma işlemini başlat
                exportExcelData();
            } catch (error) {
                showNotification('Excel işlemi için gereken kütüphane yüklenemedi', 'error');
                console.error(error);
            }
        });
    }
});

// Bildirim gösterme fonksiyonu (eğer tanımlı değilse)
if (typeof showNotification !== 'function') {
    function showNotification(message, type = 'info') {
        // Basit bildirim oluştur
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Bildirim container'ı oluştur veya var olanı kullan
        let container = document.querySelector('.notification-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        
        // Bildirimi ekle
        container.appendChild(notification);
        
        // Otomatik kapat
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// İhaleyi yayınla
async function publishAuction() {
    try {
        // Form verilerini topla
        const materialRequests = collectMaterialRequestData();
        const auctionSettings = collectAuctionSettingsData();
        const bidSettings = collectBidSettingsData();

        // Zorunlu alanları kontrol et
        if (!auctionSettings.auctionTitle) {
            showNotification('İhale başlığı zorunludur', 'error');
            return;
        }

        if (!materialRequests || materialRequests.length === 0) {
            showNotification('En az bir malzeme talebi eklemelisiniz', 'error');
            return;
        }

        // API'ye gönderilecek veriyi hazırla
        const auctionData = {
            title: auctionSettings.auctionTitle,
            description: auctionSettings.auctionDescription,
            category: auctionSettings.auctionCategory,
            features: auctionSettings.auctionFeatures,
            materialRequests: materialRequests,
            bidSettings: bidSettings
        };

        // İhaleyi API'ye gönder
        const response = await apiService.createAuction(auctionData);

        if (response.success) {
            showNotification('İhale başarıyla yayınlandı', 'success');
            // İhale listesini güncelle
            loadAuctions('open');
            // Formu kapat
            closeCreateAuctionForm();
        } else {
            showNotification(response.message || 'İhale yayınlanırken bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('İhale yayınlanırken hata:', error);
        showNotification('İhale yayınlanırken bir hata oluştu', 'error');
    }
}

// Form alt butonlarını ayarla
function setupActionButtons() {
    // Geri Dön butonu
    const backBtn = document.getElementById('backToAuctions');
    if (backBtn) {
        backBtn.addEventListener('click', closeCreateAuctionForm);
    }
    
    // Taslakları Göster butonu
    const showDraftsBtn = document.getElementById('showDrafts');
    if (showDraftsBtn) {
        showDraftsBtn.addEventListener('click', showDraftAuctions);
    }
    
    // Taslak Olarak Kaydet butonu
    const saveDraftBtn = document.getElementById('saveDraft');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveAuctionAsDraft);
    }
    
    // İhale Yayınla butonu
    const publishBtn = document.getElementById('publishAuction');
    if (publishBtn) {
        publishBtn.addEventListener('click', publishAuction);
    }
}

// İhale oluşturma formunu kapat
function closeCreateAuctionForm() {
    const formContainer = document.querySelector('.create-auction-container');
    if (formContainer) {
        // Animasyonla kapat
        formContainer.classList.remove('active');
        
        // İçeriği kaldır
        setTimeout(() => {
            const parentContainer = document.getElementById('createAuctionFormContainer');
            if (parentContainer) {
                parentContainer.remove();
            }
        }, 300);
    }
}

// Taslak ihaleleri göster
function showDraftAuctions() {
    console.log('Taslak ihaleler açılıyor...');
    
    // Modal elementini al
    const modal = document.getElementById('draftAuctionsModal');
    if (!modal) {
        console.error('Taslak ihaleler modalı bulunamadı!');
        return;
    }
    
    // Modalı göster
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Arka planın kaydırılmasını engelle
    
    // Taslak ihaleleri local storage'dan yükle
    loadDraftAuctions();
    
    // Modal kapatma butonu için olay dinleyicisi ekle
    const closeBtn = modal.querySelector('.draft-auctions-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeDraftAuctionsModal);
    }
    
    // Footer kapatma butonu için olay dinleyicisi ekle
    const closeFooterBtn = document.getElementById('closeDraftsModal');
    if (closeFooterBtn) {
        closeFooterBtn.addEventListener('click', closeDraftAuctionsModal);
    }
    
    // Arama kutusu için olay dinleyicisi ekle
    const searchInput = document.getElementById('draftSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterDraftAuctions(searchTerm);
        });
        
        // Arama kutusuna otomatik odaklan
        setTimeout(() => {
            searchInput.focus();
        }, 300);
    }
    
    // ESC tuşu ile kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDraftAuctionsModal();
        }
    });
    
    // Modal dışına tıklayarak kapatma
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDraftAuctionsModal();
        }
    });
}

// Taslak ihaleleri local storage'dan yükle
function loadDraftAuctions() {
    const draftAuctionsList = document.getElementById('draftAuctionsList');
    if (!draftAuctionsList) {
        console.error('Taslak ihaleler listesi bulunamadı!');
        return;
    }
    
    // Listeyi temizle
    draftAuctionsList.innerHTML = '';
    
    // Local storage'dan taslak ihaleleri al
    const draftAuctions = getDraftAuctionsFromStorage();
    
    // Taslak ihaleler bulunamadıysa boş mesajı göster
    if (!draftAuctions || draftAuctions.length === 0) {
        draftAuctionsList.innerHTML = `
            <div class="no-drafts-message">
                <i class="fa-solid fa-file-circle-exclamation"></i>
                <p>Henüz kaydedilmiş taslak ihale bulunmamaktadır.</p>
            </div>
        `;
        return;
    }
    
    // Her bir taslak için bir öğe oluştur
    draftAuctions.forEach((draft, index) => {
        const draftElement = createDraftAuctionElement(draft, index);
        draftAuctionsList.appendChild(draftElement);
    });
}

// Local storage'dan taslak ihaleleri getir
function getDraftAuctionsFromStorage() {
    try {
        const draftsJson = localStorage.getItem('draftAuctions');
        return draftsJson ? JSON.parse(draftsJson) : [];
    } catch (error) {
        console.error('Taslak ihaleler yüklenirken hata oluştu:', error);
        return [];
    }
}

// Taslak ihale elementini oluştur
function createDraftAuctionElement(draft, index) {
    const draftElement = document.createElement('div');
    draftElement.className = 'draft-auction-item';
    draftElement.dataset.index = index;
    
    // Talep numaralarını al
    const requestNumbers = draft.materialRequests?.map(req => req.requestNo) || [];
    const requestNumbersHtml = requestNumbers.length > 0 
        ? requestNumbers.map(num => `<span class="request-number">${num}</span>`).join('')
        : '<span class="request-number">Talep numarası bulunamadı</span>';
    
    // Tarih formatını düzenle
    const savedDate = new Date(draft.savedDate || Date.now());
    const formattedDate = `${savedDate.toLocaleDateString()} ${savedDate.toLocaleTimeString()}`;
    
    // İhale başlığını al veya varsayılan başlık oluştur
    const title = draft.auctionSettings?.auctionTitle || 'İsimsiz Taslak İhale';
    
    draftElement.innerHTML = `
        <div class="draft-auction-details">
            <div class="draft-auction-title">${title}</div>
            <div class="draft-auction-meta">
                <div>
                    <i class="fa-solid fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div>
                    <i class="fa-solid fa-clipboard-list"></i>
                    <span>${draft.materialRequests?.length || 0} Malzeme Talebi</span>
                </div>
            </div>
            <div class="draft-auction-requests">
                <div class="request-numbers">
                    ${requestNumbersHtml}
                </div>
            </div>
        </div>
        <div class="draft-auction-actions">
            <button type="button" class="btn-load-draft" data-index="${index}">
                <i class="fa-solid fa-pen-to-square"></i> Düzenle
            </button>
            <button type="button" class="btn-delete-draft" data-index="${index}">
                <i class="fa-solid fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Düzenleme butonu için olay dinleyicisi ekle
    const loadButton = draftElement.querySelector('.btn-load-draft');
    if (loadButton) {
        loadButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Tıklama olay yayılımını engelle
            loadDraftAuction(index);
        });
    }
    
    // Silme butonu için olay dinleyicisi ekle
    const deleteButton = draftElement.querySelector('.btn-delete-draft');
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Tıklama olay yayılımını engelle
            deleteDraftAuction(index);
        });
    }
    
    // Tüm öğeye tıklanınca düzenleme işlemi
    draftElement.addEventListener('click', function() {
        loadDraftAuction(index);
    });
    
    return draftElement;
}

// Taslak ihaleyi sil
function deleteDraftAuction(index) {
    const confirmDelete = confirm('Bu taslak ihaleyi silmek istediğinizden emin misiniz?');
    if (!confirmDelete) return;
    
    try {
        const draftAuctions = getDraftAuctionsFromStorage();
        if (index >= 0 && index < draftAuctions.length) {
            draftAuctions.splice(index, 1);
            localStorage.setItem('draftAuctions', JSON.stringify(draftAuctions));
            
            // Listeyi yenile
            loadDraftAuctions();
            
            showNotification('Taslak ihale başarıyla silindi', 'success');
        }
    } catch (error) {
        console.error('Taslak ihale silinirken hata oluştu:', error);
        showNotification('Taslak ihale silinirken bir hata oluştu', 'error');
    }
}

// Taslak ihaleyi yükle
function loadDraftAuction(index) {
    try {
        const draftAuctions = getDraftAuctionsFromStorage();
        if (index >= 0 && index < draftAuctions.length) {
            const draft = draftAuctions[index];
            
            // Modalı kapat
            closeDraftAuctionsModal();
            
            // Taslak verileri forma yükle
            loadDraftDataToForm(draft);
            
            showNotification('Taslak ihale başarıyla yüklendi', 'success');
        }
    } catch (error) {
        console.error('Taslak ihale yüklenirken hata oluştu:', error);
        showNotification('Taslak ihale yüklenirken bir hata oluştu', 'error');
    }
}

// Taslak verileri forma yükle
function loadDraftDataToForm(draft) {
    try {
        // Form elementlerini temizle
        clearAuctionForm();
        
        // Malzeme taleplerini yükle
        if (draft.materialRequests && draft.materialRequests.length > 0) {
            loadMaterialRequests(draft.materialRequests);
        }
        
        // İhale ayarlarını yükle
        if (draft.auctionSettings) {
            loadAuctionSettings(draft.auctionSettings);
        }
        
        // Teklif ayarlarını yükle
        if (draft.bidSettings) {
            loadBidSettings(draft.bidSettings);
        }
        
    } catch (error) {
        console.error('Form verileri yüklenirken hata oluştu:', error);
        showNotification('Form verileri yüklenirken bir hata oluştu', 'error');
    }
}

// Formu temizle
function clearAuctionForm() {
    // Malzeme talep tablosunu temizle
    const table = document.getElementById('materialRequestTable');
    if (table) {
        const tbody = table.querySelector('tbody');
        if (tbody) {
            // İlk satırı bırak, geri kalanları temizle
            while (tbody.rows.length > 1) {
                tbody.deleteRow(1);
            }
            
            // İlk satırı sıfırla
            const firstRow = tbody.rows[0];
            if (firstRow) {
                const inputs = firstRow.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.type !== 'button') {
                        input.value = '';
                    }
                });
            }
        }
    }
    
    // İhale ayarları formunu temizle
    const auctionSettingsForm = document.getElementById('auction-settings');
    if (auctionSettingsForm) {
        const inputs = auctionSettingsForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type !== 'button') {
                input.value = '';
            }
        });
    }
    
    // Teklif ayarları formunu temizle
    const bidSettingsForm = document.getElementById('bid-settings');
    if (bidSettingsForm) {
        const inputs = bidSettingsForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type !== 'button') {
                input.value = '';
            }
        });
    }
}

// Malzeme taleplerini forma yükle
function loadMaterialRequests(materialRequests) {
    const table = document.getElementById('materialRequestTable');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    
    // İlk satırı kullan, sonra yeni satırlar ekle
    for (let i = 0; i < materialRequests.length; i++) {
        const request = materialRequests[i];
        
        // İlk satır için
        if (i === 0) {
            fillRowWithData(tbody.rows[0], request);
        } 
        // Diğer satırlar için
        else {
            // Yeni satır ekle
            addMaterialRequestRow();
            // Son eklenen satırı al
            const newRow = tbody.rows[tbody.rows.length - 1];
            // Veriyi satıra yükle
            fillRowWithData(newRow, request);
        }
    }
    
    // Satır numaralarını güncelle
    updateRowNumbers();
}

// Satırı veri ile doldur
function fillRowWithData(row, data) {
    if (!row || !data) return;
    
    // Talep No
    const requestNoInput = row.querySelector('input[name="request_no"]');
    if (requestNoInput && data.requestNo) {
        requestNoInput.value = data.requestNo;
    }
    
    // Tarih
    const dateInput = row.querySelector('input[name="date"]');
    if (dateInput && data.date) {
        dateInput.value = data.date;
    }
    
    // Sevk Yeri
    const locationSelect = row.querySelector('select[name="location"]');
    if (locationSelect && data.location) {
        selectOptionByValue(locationSelect, data.location);
    }
    
    // Ürün Adı
    const productInput = row.querySelector('input[name="product_name"]');
    if (productInput && data.productName) {
        productInput.value = data.productName;
    }
    
    // Miktar
    const quantityInput = row.querySelector('input[name="quantity"]');
    if (quantityInput && data.quantity) {
        quantityInput.value = data.quantity;
    }
    
    // Birim
    const unitSelect = row.querySelector('select[name="unit"]');
    if (unitSelect && data.unit) {
        selectOptionByValue(unitSelect, data.unit);
    }
    
    // Ürün Özellikleri
    const specsTextarea = row.querySelector('textarea[name="product_specs"]');
    if (specsTextarea && data.productSpecs) {
        specsTextarea.value = data.productSpecs;
        adjustTextareaHeight(specsTextarea);
    }
    
    // Kullanım Yeri
    const usageAreaTextarea = row.querySelector('textarea[name="usage_area"]');
    if (usageAreaTextarea && data.usageArea) {
        usageAreaTextarea.value = data.usageArea;
        adjustTextareaHeight(usageAreaTextarea);
    }
    
    // Ödeme Tipi
    const paymentSelect = row.querySelector('select[name="payment_type"]');
    if (paymentSelect && data.paymentType) {
        selectOptionByValue(paymentSelect, data.paymentType);
    }
}

// Select elementinde belirli bir değere sahip seçeneği seç
function selectOptionByValue(selectElement, value) {
    if (!selectElement || !value) return;
    
    // Tam eşleşme ara
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value.toLowerCase() === value.toLowerCase()) {
            selectElement.selectedIndex = i;
            return;
        }
    }
    
    // Tam eşleşme bulunamadıysa metin eşleşmesi ara
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text.toLowerCase() === value.toLowerCase()) {
            selectElement.selectedIndex = i;
            return;
        }
    }
    
    // Kısmi eşleşme ara
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text.toLowerCase().includes(value.toLowerCase())) {
            selectElement.selectedIndex = i;
            return;
        }
    }
}

// İhale ayarlarını forma yükle
function loadAuctionSettings(settings) {
    if (!settings) return;
    
    // İhale Başlığı
    const titleInput = document.getElementById('auction_title');
    if (titleInput && settings.auctionTitle) {
        titleInput.value = settings.auctionTitle;
    }
    
    // İhale Açıklaması
    const descriptionTextarea = document.getElementById('auction_description');
    if (descriptionTextarea && settings.auctionDescription) {
        descriptionTextarea.value = settings.auctionDescription;
    }
    
    // İhale Kategorisi
    const categorySelect = document.getElementById('auction_category');
    if (categorySelect && settings.auctionCategory) {
        selectOptionByValue(categorySelect, settings.auctionCategory);
    }
    
    // İhale Özellikleri - Checkbox'lar
    if (settings.auctionFeatures && Array.isArray(settings.auctionFeatures)) {
        settings.auctionFeatures.forEach(feature => {
            const checkbox = document.getElementById(feature);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
}

// Teklif ayarlarını forma yükle
function loadBidSettings(settings) {
    if (!settings) return;
    
    // Teklif Koşulları - Checkbox'lar
    if (settings.bidConditions && Array.isArray(settings.bidConditions)) {
        settings.bidConditions.forEach(condition => {
            const checkbox = document.getElementById(condition);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // ISO Sertifikaları - Checkbox'lar
    if (settings.isoCertificates && Array.isArray(settings.isoCertificates)) {
        settings.isoCertificates.forEach(cert => {
            const checkbox = document.getElementById(cert);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // TSE Sertifikaları - Checkbox'lar
    if (settings.tseCertificates && Array.isArray(settings.tseCertificates)) {
        settings.tseCertificates.forEach(cert => {
            const checkbox = document.getElementById(cert);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }
    
    // CE Sertifikası
    const ceSelect = document.getElementById('ce_certificate');
    if (ceSelect && settings.ceCertificate) {
        selectOptionByValue(ceSelect, settings.ceCertificate);
    }
    
    // Teknik Şartname
    const techSpecsTextarea = document.getElementById('technical_specs');
    if (techSpecsTextarea && settings.technicalSpecs) {
        techSpecsTextarea.value = settings.technicalSpecs;
    }
    
    // Kalite Standartları
    const qualityStandardsTextarea = document.getElementById('quality_standards');
    if (qualityStandardsTextarea && settings.qualityStandards) {
        qualityStandardsTextarea.value = settings.qualityStandards;
    }
}

// Taslak ihaleleri filtrele
function filterDraftAuctions(searchTerm) {
    const draftItems = document.querySelectorAll('.draft-auction-item');
    let hasResults = false;
    
    draftItems.forEach(item => {
        const title = item.querySelector('.draft-auction-title')?.textContent?.toLowerCase() || '';
        const requestNumbers = Array.from(item.querySelectorAll('.request-number'))
            .map(span => span.textContent.toLowerCase());
        
        // Başlıkta veya talep numaralarında arama
        const matchTitle = title.includes(searchTerm);
        const matchRequestNumber = requestNumbers.some(num => num.includes(searchTerm));
        
        if (matchTitle || matchRequestNumber) {
            item.style.display = '';
            hasResults = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Sonuç yoksa mesaj göster
    const noResultsMessage = document.querySelector('.no-results-message');
    if (!hasResults && !noResultsMessage && searchTerm) {
        const draftList = document.getElementById('draftAuctionsList');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'no-drafts-message no-results-message';
        messageDiv.innerHTML = `
            <i class="fa-solid fa-search"></i>
            <p>"${searchTerm}" ile eşleşen taslak ihale bulunamadı.</p>
        `;
        draftList.appendChild(messageDiv);
    } else if (hasResults && noResultsMessage) {
        noResultsMessage.remove();
    }
}

// Taslak ihaleler modalını kapat
function closeDraftAuctionsModal() {
    const modal = document.getElementById('draftAuctionsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Arka plan kaydırmayı etkinleştir
    }
}

// İhaleyi taslak olarak kaydet
function saveAuctionAsDraft() {
    try {
        // Form verilerini topla
        const draftData = {
            materialRequests: collectMaterialRequestData(),
            auctionSettings: collectAuctionSettingsData(),
            bidSettings: collectBidSettingsData(),
            savedDate: new Date().toISOString()
        };
        
        // Verileri local storage'a kaydet
        const draftAuctions = getDraftAuctionsFromStorage();
        draftAuctions.push(draftData);
        localStorage.setItem('draftAuctions', JSON.stringify(draftAuctions));
        
        showNotification('İhale taslak olarak kaydedildi', 'success');
    } catch (error) {
        console.error('İhale taslak olarak kaydedilirken hata oluştu:', error);
        showNotification('İhale taslak olarak kaydedilirken bir hata oluştu', 'error');
    }
}

// Malzeme talep verilerini topla
function collectMaterialRequestData() {
    const materialRequests = [];
    const table = document.getElementById('materialRequestTable');
    
    if (table) {
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const request = {
                requestNo: row.querySelector('input[name="request_no"]')?.value || '',
                date: row.querySelector('input[name="date"]')?.value || '',
                location: row.querySelector('select[name="location"]')?.value || '',
                productName: row.querySelector('input[name="product_name"]')?.value || '',
                quantity: row.querySelector('input[name="quantity"]')?.value || '',
                unit: row.querySelector('select[name="unit"]')?.value || '',
                productSpecs: row.querySelector('textarea[name="product_specs"]')?.value || '',
                usageArea: row.querySelector('textarea[name="usage_area"]')?.value || '',
                paymentType: row.querySelector('select[name="payment_type"]')?.value || ''
            };
            
            // Boş talep kaydetme
            if (request.requestNo || request.productName || request.date) {
                materialRequests.push(request);
            }
        });
    }
    
    return materialRequests;
}

// İhale ayarları verilerini topla
function collectAuctionSettingsData() {
    const auctionSettings = {
        auctionTitle: document.getElementById('auction_title')?.value || '',
        auctionDescription: document.getElementById('auction_description')?.value || '',
        auctionCategory: document.getElementById('auction_category')?.value || '',
        auctionFeatures: []
    };
    
    // İhale özellikleri checkboxlarını topla
    const featureCheckboxes = document.querySelectorAll('input[name="auction_features[]"]:checked');
    featureCheckboxes.forEach(checkbox => {
        auctionSettings.auctionFeatures.push(checkbox.id);
    });
    
    return auctionSettings;
}

// Teklif ayarları verilerini topla
function collectBidSettingsData() {
    const bidSettings = {
        bidConditions: [],
        isoCertificates: [],
        tseCertificates: [],
        ceCertificate: document.getElementById('ce_certificate')?.value || '',
        technicalSpecs: document.getElementById('technical_specs')?.value || '',
        qualityStandards: document.getElementById('quality_standards')?.value || ''
    };
    
    // Teklif koşulları checkboxlarını topla
    const conditionCheckboxes = document.querySelectorAll('input[name="bid_conditions[]"]:checked');
    conditionCheckboxes.forEach(checkbox => {
        bidSettings.bidConditions.push(checkbox.id);
    });
    
    // ISO sertifikaları checkboxlarını topla
    const isoCheckboxes = document.querySelectorAll('input[name="iso_certificates[]"]:checked');
    isoCheckboxes.forEach(checkbox => {
        bidSettings.isoCertificates.push(checkbox.id);
    });
    
    // TSE sertifikaları checkboxlarını topla
    const tseCheckboxes = document.querySelectorAll('input[name="tse_certificates[]"]:checked');
    tseCheckboxes.forEach(checkbox => {
        bidSettings.tseCertificates.push(checkbox.id);
    });
    
    return bidSettings;
}

// Event listener'ları ayarla
function setupCreateAuctionEvents() {
    // ... existing code ...
    
    // Taslakları Göster butonu
    const showDraftsBtn = document.getElementById('showDrafts');
    if (showDraftsBtn) {
        showDraftsBtn.addEventListener('click', function() {
            showDraftAuctions();
        });
    }
    
    // Taslak Olarak Kaydet butonu
    const saveDraftBtn = document.getElementById('saveDraft');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function() {
            saveAuctionAsDraft();
        });
    }
    
    // Geri Dön butonu
    const backBtn = document.getElementById('backButton');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            closeCreateAuctionForm();
        });
    }
}

// Ürün detay modalını ayarla
function setupDetailsModal() {
    const detailsModal = document.getElementById('productDetailsModal');
    if (!detailsModal) return;

    // Kapatma butonunu ayarla
    const closeBtn = detailsModal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            detailsModal.style.display = 'none';
        });
    }

    // Modal dışına tıklayınca kapat
    window.addEventListener('click', function(event) {
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
}

// Malzeme talep tablosunda sürükle-bırak sıralama özelliğini ayarla
function setupDragAndDrop() {
    const table = document.getElementById('materialRequestTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = tbody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        // Sürüklenebilir yap
        row.draggable = true;
        
        // Sürükleme başladığında
        row.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', Array.from(rows).indexOf(row));
            row.classList.add('dragging');
        });
        
        // Sürükleme bittiğinde
        row.addEventListener('dragend', function() {
            row.classList.remove('dragging');
        });
        
        // Sürüklenen öğe üzerine geldiğinde
        row.addEventListener('dragover', function(e) {
            e.preventDefault();
            const draggingRow = tbody.querySelector('.dragging');
            if (!draggingRow) return;
            
            const siblings = [...tbody.querySelectorAll('tr:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                const rect = sibling.getBoundingClientRect();
                const offset = (rect.y + rect.height / 2) - e.clientY;
                return offset > 0;
            });
            
            if (nextSibling) {
                tbody.insertBefore(draggingRow, nextSibling);
            } else {
                tbody.appendChild(draggingRow);
            }
        });
    });
}