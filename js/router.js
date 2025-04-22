// router.js - SPA için yönlendirme sistemi
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
        this.defaultRoute = null;
        this.loadingElement = null;
        
        // Hash değişikliklerini dinle
        window.addEventListener('hashchange', this.handleRouteChange.bind(this));
        
        // Sayfa yüklendiğinde mevcut hash'e göre yönlendir
        window.addEventListener('DOMContentLoaded', () => {
            // Yükleme göstergesini oluştur
            this.createLoadingIndicator();
            
            // İlk yönlendirmeyi yap
            this.handleRouteChange();
        });
    }
    
    // Yükleme göstergesini oluştur
    createLoadingIndicator() {
        this.loadingElement = document.querySelector('.loading');
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            this.loadingElement.appendChild(spinner);
            document.body.appendChild(this.loadingElement);
        }
    }
    
    // Yükleme göstergesini göster/gizle
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.add('active');
        }
    }
    
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('active');
        }
    }
    
    // Yeni rota ekle
    addRoute(path, component, title = null) {
        this.routes[path] = { component, title };
        
        // İlk eklenen rotayı varsayılan olarak ayarla
        if (this.defaultRoute === null) {
            this.defaultRoute = path;
        }
    }
    
    // Varsayılan rotayı ayarla
    setDefaultRoute(path) {
        if (this.routes[path]) {
            this.defaultRoute = path;
        } else {
            console.error(`Rota bulunamadı: ${path}`);
        }
    }
    
    // URL'den path ve query parametrelerini ayır
    parseUrl(url) {
        // URL'yi parçala
        const [pathPart, queryPart] = url.split('?');
        
        // Query parametrelerini ayrıştır
        const queryParams = {};
        if (queryPart) {
            const searchParams = new URLSearchParams(queryPart);
            for (const [key, value] of searchParams.entries()) {
                queryParams[key] = value;
            }
        }
        
        return {
            path: pathPart,
            queryParams
        };
    }
    
    // Hash değişikliğini işle
    async handleRouteChange() {
        // Mevcut hash'i al
        const fullUrl = window.location.hash.slice(1);
        
        // Hash boşsa varsayılan rotaya yönlendir
        if (fullUrl === '') {
            window.location.hash = this.defaultRoute;
            return;
        }
        
        // URL'yi path ve query parametrelerine ayır
        const { path: originalPath, queryParams } = this.parseUrl(fullUrl);
        
        // --- Profil Sayfası Erişim Kontrolü Başlangıcı ---
        if (originalPath.startsWith('/profile')) {
            // Kullanıcı bilgilerini al (getUserProfile kullan)
            const userInfo = await apiService.getUserProfile(); 
            
            // Kullanıcı giriş yapmamışsa veya tipi 'contractor' değilse login'e yönlendir
            if (!userInfo || !userInfo.isLoggedIn || userInfo.userType !== 'contractor') {
                console.warn('Yetkisiz erişim denemesi: /profile');
                // Kullanıcı giriş yapmamışsa login'e yönlendir
                if (!userInfo || !userInfo.isLoggedIn) {
                    this.navigateTo('/login'); 
                } else {
                    // Giriş yapmış ama müteahhit değilse ana sayfaya yönlendir
                    alert("Bu sayfaya erişim yetkiniz bulunmamaktadır.");
                    this.navigateTo('/'); 
                }
                return; // İşlemi durdur
            }
        }
        // --- Profil Sayfası Erişim Kontrolü Sonu ---
        
        // Parametreli rotaları kontrol et
        let matchedRoute = null;
        let params = {};
        
        // Önce tam eşleşme kontrolü
        if (this.routes[originalPath]) {
            matchedRoute = originalPath;
        } else {
            // Parametreli rotaları kontrol et
            for (const route in this.routes) {
                // Parametreli rota formatı: '/product/:id'
                if (route.includes(':')) {
                    const routeParts = route.split('/');
                    const pathParts = originalPath.split('/');
                    
                    if (routeParts.length === pathParts.length) {
                        let match = true;
                        const tempParams = {};
                        
                        for (let i = 0; i < routeParts.length; i++) {
                            if (routeParts[i].startsWith(':')) {
                                // Parametre adını al
                                const paramName = routeParts[i].slice(1);
                                tempParams[paramName] = pathParts[i];
                            } else if (routeParts[i] !== pathParts[i]) {
                                match = false;
                                break;
                            }
                        }
                        
                        if (match) {
                            matchedRoute = route;
                            params = tempParams;
                            break;
                        }
                    }
                }
            }
        }
        
        // Eşleşen rota yoksa 404 sayfasına yönlendir
        if (!matchedRoute) {
            matchedRoute = '/404';
            // 404 rotası da tanımlı değilse varsayılan rotaya yönlendir
            if (!this.routes[matchedRoute]) {
                window.location.hash = this.defaultRoute;
                return;
            }
        }
        
        // Yükleme göstergesini göster
        this.showLoading();
        
        try {
            // Mevcut sayfayı gizle
            if (this.currentPage) {
                this.currentPage.classList.remove('active');
            }
            
            // Yeni sayfayı yükle
            const { component, title } = this.routes[matchedRoute];
            
            // Sayfa başlığını güncelle
            if (title) {
                document.title = title;
            }
            
            // Path ve query parametrelerini birleştir
            const allParams = { 
                ...params, 
                ...queryParams,
                _path: originalPath,
                _queryString: Object.keys(queryParams).length ? new URLSearchParams(queryParams).toString() : ''
            };
            
            // Sayfa içeriğini yükle
            const pageElement = await this.loadPage(component, allParams);
            
            // Sayfayı göster
            pageElement.classList.add('active', 'page-transition');
            this.currentPage = pageElement;
            
            // Sayfaya scroll'u en üste taşı
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('Sayfa yüklenirken hata:', error);
        } finally {
            // Yükleme göstergesini gizle
            setTimeout(() => {
                this.hideLoading();
            }, 300);
        }
    }
    
    // Sayfa içindeki script'leri çalıştır
    executeScripts(pageElement) {
        // Sayfa içindeki tüm script etiketlerini bul
        const scripts = pageElement.querySelectorAll('script');
        
        scripts.forEach(oldScript => {
            // Eğer script daha önce işlendiyse tekrar işleme
            if (oldScript.hasAttribute('data-processed')) {
                return;
            }

            const newScript = document.createElement('script');
            
            // Script özelliklerini kopyala (src veya textContent)
            if (oldScript.src) {
                newScript.src = oldScript.src;
                // Dışarıdan yüklenen script'ler için async önemlidir
                newScript.async = false; 
            } else {
                newScript.textContent = oldScript.textContent;
            }
            
            // Type attribute'ünü kopyala
            if (oldScript.type) {
                newScript.type = oldScript.type;
            }
            
            // İşlendiğini işaretle
            oldScript.setAttribute('data-processed', 'true');
            
            // Eski script'i DOM'dan kaldır (opsiyonel ama temizlik için iyi)
            if (oldScript.parentNode) {
                oldScript.parentNode.removeChild(oldScript);
            }

            // Yeni script'i body'nin sonuna ekleyerek çalıştır
            // Head'e eklemek de bir seçenek olabilir
            document.body.appendChild(newScript);
            
            // Debug: Hangi script'in eklendiğini logla
            // console.log('Executing script:', newScript.src || 'inline script');
        });
    }
    
    // Belirli bir sayfa yüklendikten sonra çalışacak özel fonksiyonları yönet
    runPageSpecificInitializer(componentId) {
        switch(componentId) {
            case 'profile':
                if (typeof initializeProfilePage === 'function') {
                    initializeProfilePage();
                } else {
                    console.warn('initializeProfilePage function not found. Make sure js/profile.js is loaded.');
                }
                break;
            case 'forgot-password':
                if (typeof initializeForgotPasswordPage === 'function') {
                    initializeForgotPasswordPage();
                } else {
                    console.warn('initializeForgotPasswordPage function not found. Make sure js/forgot-password.js is loaded.');
                }
                break;
            // Diğer sayfalar için benzer case'ler eklenebilir
            // case 'products':
            //     if (typeof initializeProductPage === 'function') initializeProductPage();
            //     break;
            default:
                // Başka bir işlem yapma
                break;
        }
    }
    
    // Sayfa içeriğini yükle
    async loadPage(component, params = {}) {
        // Sayfa zaten DOM'da varsa onu döndür
        let pageElement = document.querySelector(`#${component}`);
        
        if (!pageElement) {
            // Sayfa DOM'da yoksa, içeriği yükle
            try {
                // Sayfa içeriğini yükle (bu örnekte sayfalar components/ klasöründe)
                const response = await fetch(`./components/${component}.html`);
                
                if (!response.ok) {
                    throw new Error(`Sayfa yüklenemedi: ${component}`);
                }
                
                const html = await response.text();
                
                // Yeni sayfa elementi oluştur
                pageElement = document.createElement('div');
                pageElement.id = component;
                pageElement.className = 'page';
                pageElement.innerHTML = html;
                
                // Sayfayı ana içerik alanına ekle
                const mainContent = document.querySelector('main');
                mainContent.appendChild(pageElement);
                
                // Sayfa parametrelerini global değişkene ekle
                window.routeParams = params;
                
                // Sayfa yüklendikten sonra script'leri çalıştır
                this.executeScripts(pageElement);

                // ---> YENİ: Sayfaya özel başlatıcıyı çalıştır <---
                this.runPageSpecificInitializer(component);

            } catch (error) {
                console.error(`Sayfa yüklenirken hata: ${error.message}`);
                throw error;
            }
        } else {
            // Sayfa zaten DOM'da, parametreleri güncelle
            window.routeParams = params;
            
            // Sayfayı yeniden başlat (event ile)
            const event = new CustomEvent('page:refresh', { detail: params });
            pageElement.dispatchEvent(event);

            // ---> YENİ: Sayfaya özel başlatıcıyı çalıştır (yenileme durumunda da) <---
            // Not: Bu, sayfanın state'ini sıfırlayabilir. Duruma göre ayarlayın.
            this.runPageSpecificInitializer(component); 
        }
        
        return pageElement;
    }
    
    // Programatik olarak yönlendirme yap
    navigateTo(path) {
        window.location.hash = path;
    }

    async initializeAuctionsPage() {
        console.log('Auctions page initialized');
        
        if (typeof window.initializeAuctionsPage === 'function') {
            try {
                await window.initializeAuctionsPage();
            } catch (error) {
                console.error('Error initializing auctions page:', error);
            }
        } else {
            console.warn('initializeAuctionsPage function not found');
        }
    }
}

// Rotaları kur
const router = new Router();
router.addRoute('/', 'home', 'İnşanet: Dijital İnşaat Malzemeleri İhale Platformu');
router.addRoute('/products', 'products', 'Ürünler | İnşanet');
router.addRoute('/product/:id', 'product-detail', 'Ürün Detayı | İnşanet');
router.addRoute('/suppliers', 'suppliers', 'Tedarikçiler | İnşanet');
router.addRoute('/supplier/:id', 'supplier-detail', 'Tedarikçi Detayı | İnşanet');
router.addRoute('/auctions', 'auctions', 'İhaleler | İnşanet');
router.addRoute('/auction/:id', 'auction-detail', 'İhale Detayı | İnşanet');
router.addRoute('/contractors', 'contractors', 'Müteahhitler | İnşanet');
router.addRoute('/contractor/:id', 'contractor-detail', 'Müteahhit Detayı | İnşanet');
router.addRoute('/logistics', 'logistics', 'Lojistik Firmaları | İnşanet');
router.addRoute('/logistics/:id', 'logistics-detail', 'Lojistik Firması Detayı | İnşanet');
router.addRoute('/login', 'login', 'Giriş Yap - İnşanet');
router.addRoute('/register', 'register', 'Kayıt Ol - İnşanet');
router.addRoute('/profile', 'profile', 'Profilim - İnşanet');
router.addRoute('/forgot-password', 'forgot-password', 'Şifremi Unuttum - İnşanet');
router.addRoute('/cart', 'cart', 'Sepetim | İnşanet'); // Sepet sayfası
router.addRoute('/checkout', 'checkout', 'Ödeme | İnşanet');
router.addRoute('/contact', 'contact', 'İletişim | İnşanet');
router.addRoute('/about', 'about', 'Hakkımızda | İnşanet');
router.addRoute('/faq', 'faq', 'Sıkça Sorulan Sorular | İnşanet');
router.addRoute('/privacy', 'privacy', 'Gizlilik Politikası | İnşanet');
router.addRoute('/terms', 'terms', 'Kullanım Koşulları | İnşanet');
router.addRoute('/404', '404', 'Sayfa Bulunamadı | İnşanet');

// Router instance'ını oluştur ve global scope'a ekle
window.router = router;