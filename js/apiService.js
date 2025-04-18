// apiService.js - API ile iletişim için servis
const API_BASE_URL = 'https://api.insanet.com/v1'; // Gerçek API kullanıma hazır olduğunda değiştirilecek

class ApiService {
    constructor()  {
        this.baseUrl = API_BASE_URL;
        this.token = localStorage.getItem('token');
        this.mockData = this.initMockData(); // Mock veri için
        // OTP için kullanılacak geçici bellek
        this.otpStore = {};
    }

    // Mock veri başlatma
    initMockData() {
        return {
            categories: [
                { id: 1, name: 'Yapı Malzemeleri Grubu', slug: 'building-materials' },
                { id: 2, name: 'Mantolama Malzemeleri Grubu', slug: 'insulation-materials' },
                { id: 3, name: 'Hırdavat/Nalbur Malzemeleri Grubu', slug: 'hardware' },
                { id: 4, name: 'Elektrik Malzemeleri Grubu', slug: 'electrical' },
                { id: 5, name: 'İnşaat Mekaniği Malzemeleri Grubu', slug: 'mechanical-materials' }
            ],
            auctions: [
                { 
                    id: 1, 
                    title: 'Çimento Alım İhalesi', 
                    type: 'buying', 
                    endDate: '2025-04-01', 
                    status: 'active',
                    description: '100 ton çimento alımı için ihale'
                },
                { 
                    id: 2, 
                    title: 'Demir Satım İhalesi', 
                    type: 'selling', 
                    endDate: '2025-04-05', 
                    status: 'active',
                    description: '50 ton inşaat demiri satışı için ihale'
                }
            ],
            // Siparişler verisi eklendi
            orders: [],
            products: [
                {
                    id: 1,
                    name: 'Çimento (50kg)',
                    description: 'Portland Çimento 42.5R',
                    price: 120,
                    category: 1,
                    supplier: 1,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 2,
                    name: 'İnşaat Demiri (12mm)',
                    description: 'Nervürlü İnşaat Demiri 12mm',
                    price: 15000,
                    category: 1,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 3,
                    name: 'Mantolama Levhası',
                    description: 'EPS Mantolama Levhası 5cm',
                    price: 45,
                    category: 2,
                    supplier: 3,
                    image: 'placeholder.jpg',
                    tse: false
                },
                {
                    id: 4,
                    name: 'Kum (1 Ton)',
                    description: 'İnce Dere Kumu - İnşaat için',
                    price: 200,
                    category: 1,
                    supplier: 1,
                    image: 'placeholder.jpg',
                    tse: false
                },
                {
                    id: 5,
                    name: 'Sıva Malzemesi',
                    description: 'Hazır Sıva Karışımı (25kg)',
                    price: 85,
                    category: 1,
                    supplier: 3,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 6,
                    name: 'Elektrik Kablosu',
                    description: 'NYM 3x1.5mm² Antigron Kablo (100m)',
                    price: 650,
                    category: 4,
                    supplier: 1,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 7,
                    name: 'Boya (20kg)',
                    description: 'İç Cephe Su Bazlı Boya - Beyaz',
                    price: 450,
                    category: 1,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 8,
                    name: 'XPS Levha',
                    description: 'Ekstrüde Polistiren Levha (5cm)',
                    price: 65,
                    category: 2,
                    supplier: 3,
                    image: 'placeholder.jpg',
                    tse: false
                },
                {
                    id: 9,
                    name: 'Alçıpan',
                    description: 'Standart Alçı Levha (12.5mm)',
                    price: 95,
                    category: 1,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 10,
                    name: 'Çelik Konstrüksiyon Profil',
                    description: 'Galvanizli Çelik Profil (6m)',
                    price: 180,
                    category: 1,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 11,
                    name: 'Priz Grubu',
                    description: 'Topraklı Grup Priz (5li)',
                    price: 120,
                    category: 4,
                    supplier: 1,
                    image: 'placeholder.jpg',
                    tse: false
                },
                {
                    id: 12,
                    name: 'Led Panel',
                    description: '60x60 LED Panel (36W)',
                    price: 350,
                    category: 4,
                    supplier: 1,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 13,
                    name: 'Hidrolik Asansör',
                    description: 'İnşaat için 500kg Taşıma Kapasiteli',
                    price: 25000,
                    category: 5,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                },
                {
                    id: 14,
                    name: 'Mekanik Vinç',
                    description: 'İnşaat Kaldırma Vinci (1 ton)',
                    price: 8500,
                    category: 5,
                    supplier: 3,
                    image: 'placeholder.jpg',
                    tse: false
                },
                {
                    id: 15,
                    name: 'Hidrolik Piston',
                    description: 'Ağır Yük Kaldırma Pistonu',
                    price: 2200,
                    category: 5,
                    supplier: 2,
                    image: 'placeholder.jpg',
                    tse: true
                }
            ],
            suppliers: [
                {
                    id: 1,
                    name: 'ABC Yapı Malzemeleri',
                    description: 'Çimento ve beton ürünleri tedarikçisi',
                    rating: 4.8,
                    location: 'İstanbul'
                },
                {
                    id: 2,
                    name: 'Demir A.Ş.',
                    description: 'İnşaat demiri ve çelik ürünleri',
                    rating: 4.5,
                    location: 'Ankara'
                },
                {
                    id: 3,
                    name: 'XYZ Mantolama',
                    description: 'Mantolama ve yalıtım malzemeleri',
                    rating: 4.7,
                    location: 'İzmir'
                }
            ],
            contractors: [
                {
                    id: 1,
                    name: 'Mega İnşaat',
                    description: 'Konut ve ticari yapı müteahhidi',
                    rating: 4.9,
                    location: 'İstanbul'
                },
                {
                    id: 2,
                    name: 'Yeni Yapı Ltd.',
                    description: 'Altyapı ve üstyapı projeleri',
                    rating: 4.6,
                    location: 'Ankara'
                }
            ],
            logistics: [
                {
                    id: 1,
                    name: 'Hızlı Nakliyat',
                    description: 'İnşaat malzemeleri taşımacılığı',
                    rating: 4.7,
                    location: 'İstanbul'
                },
                {
                    id: 2,
                    name: 'Güven Lojistik',
                    description: 'Ağır yük taşımacılığı',
                    rating: 4.8,
                    location: 'İzmir'
                }
            ],
            // Telefon doğrulama için mock veri
            phoneVerification: {
                validPhones: ['5301234567', '5421234567', '5551234567']
            },
            // Sipariş verileri için mock veritabanı
            orders: [
                {
                    id: "OD100123",
                    date: "2025-03-15",
                    amount: 25000,
                    itemCount: 5,
                    supplier: "ABC Yapı Malzemeleri",
                    status: "Kesinleşmiş Olan Sipariş",
                    products: [
                        { id: 1, name: "Çimento (50kg)", quantity: 20, price: 120, total: 2400 },
                        { id: 4, name: "Kum (1 Ton)", quantity: 5, price: 200, total: 1000 }
                    ]
                },
                {
                    id: "OD100124",
                    date: "2025-03-10",
                    amount: 45000,
                    itemCount: 3,
                    supplier: "Demir A.Ş.",
                    status: "Teslim Edilen Sipariş",
                    products: [
                        { id: 2, name: "İnşaat Demiri (12mm)", quantity: 3, price: 15000, total: 45000 }
                    ]
                },
                {
                    id: "OD100125",
                    date: "2025-03-22",
                    amount: 12800,
                    itemCount: 10,
                    supplier: "ABC Yapı Malzemeleri",
                    status: "Yolda Olan Sipariş",
                    products: [
                        { id: 6, name: "Elektrik Kablosu", quantity: 10, price: 650, total: 6500 },
                        { id: 12, name: "Led Panel", quantity: 18, price: 350, total: 6300 }
                    ]
                },
                {
                    id: "OD100126",
                    date: "2025-02-15",
                    amount: 4500,
                    itemCount: 10,
                    supplier: "XYZ Mantolama",
                    status: "İptal Edilen",
                    products: [
                        { id: 3, name: "Mantolama Levhası", quantity: 100, price: 45, total: 4500 }
                    ]
                },
                {
                    id: "OD100127",
                    date: "2025-04-01",
                    amount: 2200,
                    itemCount: 1,
                    supplier: "Demir A.Ş.",
                    status: "Ön Sipariş",
                    products: [
                        { id: 15, name: "Hidrolik Piston", quantity: 1, price: 2200, total: 2200 }
                    ]
                },
                {
                    id: "OD100128",
                    date: "2025-03-28",
                    amount: 8500,
                    itemCount: 1,
                    supplier: "XYZ Mantolama",
                    status: "Kesinleşmiş Olan Sipariş",
                    products: [
                        { id: 14, name: "Mekanik Vinç", quantity: 1, price: 8500, total: 8500 }
                    ]
                },
                {
                    id: "OD100129",
                    date: "2025-03-25",
                    amount: 4250,
                    itemCount: 5,
                    supplier: "ABC Yapı Malzemeleri",
                    status: "Teslim Edilen Sipariş",
                    products: [
                        { id: 7, name: "Boya (20kg)", quantity: 5, price: 450, total: 2250 },
                        { id: 9, name: "Alçıpan", quantity: 21, price: 95, total: 1995 }
                    ]
                },
                {
                    id: "OD100130",
                    date: "2025-03-20",
                    amount: 850,
                    itemCount: 10,
                    supplier: "ABC Yapı Malzemeleri",
                    status: "Kesinleşmiş Olan Sipariş",
                    products: [
                        { id: 1, name: "Çimento (50kg)", quantity: 5, price: 120, total: 600 },
                        { id: 5, name: "Sıva Malzemesi", quantity: 3, price: 85, total: 255 }
                    ]
                }
            ]
        };
    }

    // Token işlemleri
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Kullanıcı çıkış işlemi
    logout() {
        this.clearToken();
        localStorage.removeItem('userInfo'); // Kullanıcı bilgisini de temizle
        console.log("User logged out.");
        // Gerekirse API'ye çıkış isteği gönderilebilir
        // await this.fetchWithAuth('/logout', { method: 'POST' });
    }

    // Genel HTTP istekleri için yardımcı metod
    async fetchWithAuth(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            // Gerçek API'ye istek atmadan önce mock veri kontrolü
            const mockResponse = this.getMockResponse(endpoint, options);
            if (mockResponse) {
                // Gerçek bir API çağrısını simüle etmek için gecikme ekle
                await new Promise(resolve => setTimeout(resolve, 300));
                return mockResponse;
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API isteği sırasında hata:', error);
            throw error;
        }
    }

    // Mock veri yanıtları
    getMockResponse(endpoint, options) {
        // Endpoint'e göre mock veri döndür
        if (endpoint.startsWith('/categories')) {
            return this.mockData.categories;
        }
        
        if (endpoint.startsWith('/auctions')) {
            const status = endpoint.includes('status=active') ? 'active' : null;
            if (status) {
                return this.mockData.auctions.filter(a => a.status === status);
            }
            return this.mockData.auctions;
        }
        
        if (endpoint.startsWith('/products')) {
            // Ürün ID'si varsa o ürünü döndür
            const productIdMatch = endpoint.match(/\/products\/(\d+)/);
            if (productIdMatch) {
                const productId = parseInt(productIdMatch[1]);
                return this.mockData.products.find(p => p.id === productId);
            }
            return this.mockData.products;
        }
        
        if (endpoint.startsWith('/suppliers')) {
            return this.mockData.suppliers;
        }
        
        if (endpoint.startsWith('/contractors')) {
            return this.mockData.contractors;
        }
        
        if (endpoint.startsWith('/logistics')) {
            return this.mockData.logistics;
        }
        
        if (endpoint.startsWith('/search')) {
            const queryMatch = endpoint.match(/q=([^&]+)/);
            const typeMatch = endpoint.match(/type=([^&]+)/);
            
            if (queryMatch) {
                const query = decodeURIComponent(queryMatch[1]).toLowerCase();
                const type = typeMatch ? typeMatch[1] : 'all';
                
                let results = [];
                
                // Arama tipine göre filtreleme
                if (type === 'all' || type === 'products') {
                    const productResults = this.mockData.products.filter(
                        p => p.name.toLowerCase().includes(query) || 
                             p.description.toLowerCase().includes(query)
                    );
                    results = [...results, ...productResults];
                }
                
                if (type === 'all' || type === 'suppliers') {
                    const supplierResults = this.mockData.suppliers.filter(
                        s => s.name.toLowerCase().includes(query) || 
                             s.description.toLowerCase().includes(query)
                    );
                    results = [...results, ...supplierResults];
                }
                
                if (type === 'all' || type === 'categories') {
                    const categoryResults = this.mockData.categories.filter(
                        c => c.name.toLowerCase().includes(query)
                    );
                    results = [...results, ...categoryResults];
                }
                
                return results;
            }
            return [];
        }
        
        if (endpoint.startsWith('/auth/login') && options.method === 'POST') {
            // Login işlemi için mock token
            return { token: 'mock_token_123456', user: { id: 1, name: 'Test Kullanıcı' } };
        }
        
        if (endpoint.startsWith('/auth/register') && options.method === 'POST') {
            try {
                const userData = JSON.parse(options.body);
                
                // En az bir doğrulama yöntemi gerekli
                if (!userData.phone && !userData.email) {
                    return { 
                        success: false, 
                        message: 'Telefon numarası veya e-posta gerekli' 
                    };
                }
                
                // Mock kayıt başarılı yanıtı
                return { 
                    success: true, 
                    message: 'Kayıt başarılı',
                    user: {
                        id: Math.floor(Math.random() * 1000) + 10,
                        email: userData.email || null,
                        phone: userData.phone || null,
                        userType: userData.userType
                    },
                    token: 'mock_register_token_' + (userData.email ? userData.email.split('@')[0] : userData.phone)
                };
            } catch (error) {
                console.error('Kayıt hatası:', error);
                return { success: false, message: 'Kayıt işlemi başarısız oldu' };
            }
        }
        
        if (endpoint.startsWith('/auth/request-otp') && options.method === 'POST') {
            try {
                const requestData = JSON.parse(options.body);
                const phoneNumber = requestData.phoneNumber;
                const email = requestData.email;
                
                // Telefon veya e-posta ile doğrulama kontrolü
                if (!phoneNumber && !email) {
                    return { 
                        success: false, 
                        message: 'Telefon numarası veya e-posta gerekli' 
                    };
                }
                
                // Doğrulama yöntemi
                const verificationMethod = phoneNumber ? 'phone' : 'email';
                const verificationId = phoneNumber || email;
                
                // Gerçek uygulama için burada SMS API'si veya E-posta servisi çağrılacak
                // Mock uygulama için rastgele 6 haneli kod oluştur
                const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
                
                // OTP'yi sakla (gerçek uygulamada bu sunucuda saklanacak)
                this.otpStore[verificationId] = {
                    code: otpCode,
                    expiry: Date.now() + (5 * 60 * 1000), // 5 dakika geçerli
                    method: verificationMethod
                };
                
                if (verificationMethod === 'phone') {
                    console.log(`MOCK SMS: ${phoneNumber} numarasına gönderilen doğrulama kodu: ${otpCode}`);
                } else {
                    console.log(`MOCK EMAIL: ${email} adresine gönderilen doğrulama kodu: ${otpCode}`);
                }
                
                return { 
                    success: true, 
                    message: 'Doğrulama kodu gönderildi', 
                    code: otpCode // Sadece mock için döndürülüyor
                };
            } catch (error) {
                console.error('OTP isteği hatası:', error);
                return { success: false, message: 'Doğrulama kodu gönderilemedi' };
            }
        }
        
        if (endpoint.startsWith('/auth/verify-otp') && options.method === 'POST') {
            try {
                const requestData = JSON.parse(options.body);
                const phoneNumber = requestData.phoneNumber;
                const email = requestData.email;
                const otpCode = requestData.otpCode;
                
                // Telefon veya e-posta ile doğrulama kontrolü
                if (!phoneNumber && !email) {
                    return { 
                        success: false, 
                        message: 'Telefon numarası veya e-posta gerekli' 
                    };
                }
                
                // Doğrulama yöntemi ve ID
                const verificationId = phoneNumber || email;
                
                // OTP doğrulama (gerçek uygulamada bu sunucuda yapılacak)
                const storedOtp = this.otpStore[verificationId];
                
                if (!storedOtp) {
                    return { success: false, message: 'Geçersiz doğrulama bilgisi' };
                }
                
                if (storedOtp.expiry < Date.now()) {
                    return { success: false, message: 'Doğrulama kodunun süresi dolmuş' };
                }
                
                if (storedOtp.code !== otpCode) {
                    return { success: false, message: 'Geçersiz doğrulama kodu' };
                }
                
                // Başarılı doğrulama - OTP'yi temizle
                delete this.otpStore[verificationId];
                
                // Mock token ve başarı mesajı dön
                return { 
                    success: true,
                    message: 'Doğrulama başarılı',
                    token: 'mock_token_' + verificationId.replace(/[@.]/g, '_')
                };
            } catch (error) {
                console.error('OTP doğrulama hatası:', error);
                return { success: false, message: 'Doğrulama başarısız oldu' };
            }
        }
        
        return null; // Mock veri yoksa null döndür
    }

    // Kullanıcı işlemleri
    async login(email, password) {
        return this.fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Personel/Çalışan kullanıcıları için metodlar
    async getCompanyUsers() {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth('/users/company');
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log("Fetching company users");
            
            // Local storage'dan mevcut kullanıcı bilgilerini al
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            
            // Mock kullanıcı verileri
            const mockCompanyUsers = localStorage.getItem('companyUsers');
            let companyUsers = [];
            
            if (mockCompanyUsers) {
                companyUsers = JSON.parse(mockCompanyUsers);
            } else {
                // Varsayılan kullanıcı listesi oluştur (ana kullanıcı + 1 örnek kullanıcı)
                companyUsers = [{
                    id: userInfo.id || 1,
                    name: userInfo.name || 'Ana Kullanıcı',
                    email: userInfo.email || 'admin@firma.com',
                    position: userInfo.position || 'Yönetici',
                    roleType: 'admin',
                    permissions: {
                        users: true,
                        orders: true,
                        products: true,
                        messages: true,
                        reports: true
                    },
                    status: 'active',
                    addedDate: new Date().toISOString(),
                    isOwner: true
                }];
                
                // Örnek ilave kullanıcı
                if (!userInfo.isOwner) {
                    companyUsers.push({
                        id: 2,
                        name: 'Örnek Kullanıcı',
                        email: 'ornek@firma.com',
                        position: 'Satış Temsilcisi',
                        roleType: 'editor',
                        permissions: {
                            users: false,
                            orders: true,
                            products: true,
                            messages: true,
                            reports: false
                        },
                        status: 'active',
                        addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        isOwner: false
                    });
                }
                
                // Kullanıcı listesini kaydet
                localStorage.setItem('companyUsers', JSON.stringify(companyUsers));
            }
            
            // API yanıtı simülasyonu
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
                success: true,
                users: companyUsers,
                totalCount: companyUsers.length,
                maxAllowed: 5
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error fetching company users:", error);
            throw error;
        }
    }
    
    async addCompanyUser(userData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth('/users/company', {
            //     method: 'POST',
            //     body: JSON.stringify(userData)
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log("Adding company user:", userData);
            
            // Mevcut kullanıcıları kontrol et
            const response = await this.getCompanyUsers();
            const users = response.users;
            
            // Maksimum kullanıcı sayısı kontrolü
            if (users.length >= 5) {
                return {
                    success: false,
                    message: "Maksimum kullanıcı sayısına ulaştınız (5/5). Daha fazla kullanıcı ekleyemezsiniz."
                };
            }
            
            // Yeni kullanıcı ID'si oluştur
            const newId = Math.max(...users.map(u => u.id), 0) + 1;
            
            // Yeni kullanıcı nesnesi
            const newUser = {
                id: newId,
                name: userData.name,
                email: userData.email,
                position: userData.position,
                roleType: userData.roleType,
                permissions: userData.permissions || {
                    users: false,
                    orders: true,
                    products: true,
                    messages: true,
                    reports: false
                },
                status: 'active',
                addedDate: new Date().toISOString(),
                isOwner: false
            };
            
            // Kullanıcıyı ekle ve kaydet
            users.push(newUser);
            localStorage.setItem('companyUsers', JSON.stringify(users));
            
            // API yanıtı simülasyonu
            await new Promise(resolve => setTimeout(resolve, 800));
            
            return {
                success: true,
                message: "Kullanıcı başarıyla eklendi",
                user: newUser
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error adding company user:", error);
            throw error;
        }
    }
    
    async updateCompanyUser(userId, userData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/users/company/${userId}`, {
            //     method: 'PUT',
            //     body: JSON.stringify(userData)
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Updating company user ${userId}:`, userData);
            
            // Mevcut kullanıcıları al
            const response = await this.getCompanyUsers();
            const users = response.users;
            
            // Kullanıcıyı bul
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                return {
                    success: false,
                    message: "Kullanıcı bulunamadı"
                };
            }
            
            const isOwner = users[userIndex].isOwner;
            
            // Ana kullanıcının yetkilerini kısıtlamaya çalışıyorsa engelle
            if (isOwner && (userData.roleType !== 'admin' || !userData.permissions.users)) {
                return {
                    success: false,
                    message: "Ana kullanıcının kullanıcı yönetimi yetkisi kaldırılamaz"
                };
            }
            
            // Kullanıcıyı güncelle
            users[userIndex] = {
                ...users[userIndex],
                name: userData.name,
                email: userData.email,
                position: userData.position,
                roleType: isOwner ? 'admin' : userData.roleType,
                permissions: isOwner ? 
                    {...userData.permissions, users: true} : 
                    userData.permissions,
                status: userData.status
            };
            
            // Değişiklikleri kaydet
            localStorage.setItem('companyUsers', JSON.stringify(users));
            
            // API yanıtı simülasyonu
            await new Promise(resolve => setTimeout(resolve, 600));
            
            return {
                success: true,
                message: "Kullanıcı başarıyla güncellendi",
                user: users[userIndex]
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error updating company user ${userId}:`, error);
            throw error;
        }
    }
    
    async deleteCompanyUser(userId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/users/company/${userId}`, {
            //     method: 'DELETE'
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Deleting company user ${userId}`);
            
            // Mevcut kullanıcıları al
            const response = await this.getCompanyUsers();
            const users = response.users;
            
            // Kullanıcıyı bul
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                return {
                    success: false,
                    message: "Kullanıcı bulunamadı"
                };
            }
            
            // Ana kullanıcıyı silmeye çalışıyorsa engelle
            if (users[userIndex].isOwner) {
                return {
                    success: false,
                    message: "Ana kullanıcı silinemez"
                };
            }
            
            // Kullanıcıyı sil
            users.splice(userIndex, 1);
            
            // Değişiklikleri kaydet
            localStorage.setItem('companyUsers', JSON.stringify(users));
            
            // API yanıtı simülasyonu
            await new Promise(resolve => setTimeout(resolve, 700));
            
            return {
                success: true,
                message: "Kullanıcı başarıyla silindi"
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error deleting company user ${userId}:`, error);
            throw error;
        }
    }

    // Telefon doğrulama işlemleri
    async requestOTP(identifier) {
        // identifier e-posta veya telefon numarası olabilir
        const isEmail = identifier.includes('@');
        
        return this.fetchWithAuth('/auth/request-otp', {
            method: 'POST',
            body: JSON.stringify(isEmail ? { email: identifier } : { phoneNumber: identifier })
        });
    }
    
    async verifyOTP(identifier, otpCode) {
        // identifier e-posta veya telefon numarası olabilir
        const isEmail = identifier.includes('@');
        
        return this.fetchWithAuth('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(isEmail ? 
                { email: identifier, otpCode } : 
                { phoneNumber: identifier, otpCode })
        });
    }

    // Ürün işlemleri
    async getProducts(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        
        // Mock veri için fiyat ve sıralama filtresi ekle
        if (this.mockData) {
            let filteredProducts = [...this.mockData.products];
            
            // Kategori filtresi
            if (filters.category) {
                const categoryId = parseInt(filters.category);
                filteredProducts = filteredProducts.filter(product => product.category === categoryId);
            }
            
            // Tedarikçi filtresi
            if (filters.supplier) {
                const supplierId = parseInt(filters.supplier);
                filteredProducts = filteredProducts.filter(product => product.supplier === supplierId);
            }
            
            // Fiyat filtresi - min
            if (filters.minPrice) {
                const minPrice = parseInt(filters.minPrice);
                filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
            }
            
            // Fiyat filtresi - max
            if (filters.maxPrice) {
                const maxPrice = parseInt(filters.maxPrice);
                filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
            }
            
            // Özel filtreler (5000+ gibi)
            if (filters.minPrice && filters.minPrice.endsWith('+')) {
                const minPrice = parseInt(filters.minPrice);
                filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
            }
            
            // Sıralama
            if (filters.sort) {
                switch (filters.sort) {
                    case 'name_asc':
                        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                    case 'name_desc':
                        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                        break;
                    case 'price_asc':
                        filteredProducts.sort((a, b) => a.price - b.price);
                        break;
                    case 'price_desc':
                        filteredProducts.sort((a, b) => b.price - a.price);
                        break;
                    case 'newest':
                        // Örnek amaçlı, gerçek bir API'de ürün ID'si ya da tarih kullanılacak
                        filteredProducts.sort((a, b) => b.id - a.id);
                        break;
                    case 'popular':
                        // Örnek amaçlı, gerçek bir API'de ürün ratings kullanılacak
                        // Burada rastgele bir popularity puanı ekliyoruz
                        filteredProducts.forEach(p => p.popularity = Math.random() * 100);
                        filteredProducts.sort((a, b) => b.popularity - a.popularity);
                        break;
                    case 'tse_cert':
                        // TSE belgeli olanları önceliklendir
                        filteredProducts.sort((a, b) => {
                            if (a.tse === b.tse) {
                                // Her iki ürün de TSE'li veya TSE'siz ise isme göre sırala
                                return a.name.localeCompare(b.name);
                            }
                            // TSE'li ürünleri önce göster
                            return a.tse ? -1 : 1;
                        });
                        break;
                }
            }
            
            return filteredProducts;
        }
        
        return this.fetchWithAuth(`/products?${queryString}`);
    }

    // İhaleleri getir (Güncellenmiş version)
    async getAuctions(filters = {}) {
        console.log('API İhaleler için filtreler:', filters);
        
        // Mock verileri kullanarak ihale verilerini döndürüyoruz
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock ihale verilerini oluştur
                const allAuctions = this.mockData.detailedAuctions || this.generateMockAuctions();
                
                // Filtreleri uygula
                let filteredAuctions = [...allAuctions];
                
                // Durum filtresi (açık/kapalı)
                if (filters.status && filters.status !== 'all') {
                    filteredAuctions = filteredAuctions.filter(auction => 
                        auction.status === filters.status
                    );
                }
                
                // Arama filtresi
                if (filters.searchTerm) {
                    const searchLower = filters.searchTerm.toLowerCase();
                    filteredAuctions = filteredAuctions.filter(auction => 
                        auction.title.toLowerCase().includes(searchLower) ||
                        auction.category.toLowerCase().includes(searchLower) ||
                        auction.location.toLowerCase().includes(searchLower)
                    );
                }
                
                // Ürün kategorisi filtresi
                if (filters.products && filters.products.length > 0) {
                    filteredAuctions = filteredAuctions.filter(auction => 
                        filters.products.includes(auction.category)
                    );
                }
                
                // Lokasyon filtresi
                if (filters.locations && filters.locations.length > 0) {
                    filteredAuctions = filteredAuctions.filter(auction => 
                        filters.locations.includes(auction.location)
                    );
                }
                
                // Sıralama
                if (filters.sort) {
                    filteredAuctions.sort((a, b) => {
                        const dateA = new Date(a.createdDate).getTime();
                        const dateB = new Date(b.createdDate).getTime();
                        const closingA = new Date(a.closingDate).getTime();
                        const closingB = new Date(b.closingDate).getTime();
                        const currentBidA = parseFloat(a.currentBid?.replace(/[^\d.]/g, '') || 0);
                        const currentBidB = parseFloat(b.currentBid?.replace(/[^\d.]/g, '') || 0);
                        
                        switch (filters.sort) {
                            case 'newest':
                                return dateB - dateA;
                            case 'closing-soon':
                                // Açık ihaleler için kapanış tarihine göre sırala
                                if (filters.status === 'open') {
                                    return closingA - closingB;
                                }
                                return dateB - dateA;
                            case 'price-high':
                                return currentBidB - currentBidA;
                            case 'price-low':
                                return currentBidA - currentBidB;
                            default:
                                return dateB - dateA;
                        }
                    });
                }
                
                // Sayfalama
                const page = filters.page || 1;
                const limit = filters.limit || 10;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex);
                
                // Yanıtı oluştur
                const response = {
                    auctions: paginatedAuctions,
                    totalPages: Math.ceil(filteredAuctions.length / limit),
                    currentPage: page,
                    totalAuctions: filteredAuctions.length
                };
                
                resolve(response);
            }, 800); // Gerçekçi bir API gecikme süresi
        });
    }
    
    // Belirli bir ihaleyi getir
    async getAuctionById(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const allAuctions = this.mockData.detailedAuctions || this.generateMockAuctions();
                const auction = allAuctions.find(a => a.id === parseInt(id));
                
                if (auction) {
                    // İhale için daha fazla detay ekle
                    const enhancedAuction = {
                        ...auction,
                        description: this.generateAuctionDescription(auction),
                        terms: this.generateAuctionTerms(),
                        supplier: this.getRandomSupplier(),
                        bidHistory: this.generateBidHistory(auction)
                    };
                    resolve(enhancedAuction);
                } else {
                    resolve(null);
                }
            }, 500);
        });
    }
    
    // İhaleye teklif ver
    async placeBid(auctionId, bidAmount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Kullanıcı giriş yapmış mı kontrol et
                if (!this.token) {
                    resolve({
                        success: false,
                        message: 'Teklif verebilmek için giriş yapmalısınız.'
                    });
                    return;
                }
                
                const allAuctions = this.mockData.detailedAuctions || this.generateMockAuctions();
                const auction = allAuctions.find(a => a.id === parseInt(auctionId));
                
                if (!auction) {
                    resolve({
                        success: false,
                        message: 'İhale bulunamadı.'
                    });
                    return;
                }
                
                if (auction.status !== 'open') {
                    resolve({
                        success: false,
                        message: 'Bu ihale artık kapalı durumda.'
                    });
                    return;
                }
                
                const currentBid = parseFloat(auction.currentBid?.replace(/[^\d.]/g, '') || 0);
                
                if (bidAmount <= currentBid) {
                    resolve({
                        success: false,
                        message: 'Teklifiniz mevcut tekliften yüksek olmalıdır.'
                    });
                    return;
                }
                
                // Teklifi kabul et ve ihaleyi güncelle
                resolve({
                    success: true,
                    message: 'Teklifiniz başarıyla kaydedildi.',
                    newBid: bidAmount,
                    auctionId: auctionId
                });
            }, 1000);
        });
    }
    
    // Mock ihale verileri oluştur
    generateMockAuctions() {
        // Mock ihale verilerini oluştur ve mockData'ya kaydet
        const detailedAuctions = [
            { 
                id: 1, 
                title: 'Çimento İhalesi - İstanbul', 
                category: 'Çimento', 
                location: 'İstanbul', 
                startingPrice: '1500 TL/ton', 
                currentBid: '1550 TL/ton', 
                timeLeft: '2 gün', 
                bidCount: 15, 
                status: 'open', 
                image: './img/cement.jpg', 
                closingDate: '2024-08-10T10:00:00Z', 
                createdDate: '2024-08-01T09:00:00Z' 
            },
            { 
                id: 2, 
                title: 'Kereste Alımı - Ankara', 
                category: 'Kereste', 
                location: 'Ankara', 
                startingPrice: '5000 TL/m³', 
                currentBid: '5100 TL/m³', 
                timeLeft: '5 saat', 
                bidCount: 8, 
                status: 'open', 
                image: './img/lumber.jpg', 
                closingDate: '2024-08-08T17:00:00Z', 
                createdDate: '2024-08-02T11:00:00Z' 
            },
            { 
                id: 3, 
                title: 'İzmir Bims İhalesi', 
                category: 'Bims', 
                location: 'İzmir', 
                startingPrice: '80 TL/adet', 
                currentBid: '82 TL/adet', 
                timeLeft: '1 gün', 
                bidCount: 22, 
                status: 'open', 
                image: './img/bims.jpg', 
                closingDate: '2024-08-09T14:00:00Z', 
                createdDate: '2024-08-03T14:30:00Z' 
            },
            { 
                id: 4, 
                title: 'Antalya Tuğla Tedariği', 
                category: 'Tuğla', 
                location: 'Antalya', 
                startingPrice: '1.5 TL/adet', 
                currentBid: '1.55 TL/adet', 
                timeLeft: '3 gün', 
                bidCount: 11, 
                status: 'open', 
                image: './img/brick.jpg', 
                closingDate: '2024-08-11T12:00:00Z', 
                createdDate: '2024-08-04T16:00:00Z' 
            },
            { 
                id: 5, 
                title: 'OSB Levha İhalesi - Bursa', 
                category: 'OSB (9-18 mm)', 
                location: 'Bursa', 
                startingPrice: '250 TL/levha', 
                currentBid: '255 TL/levha', 
                timeLeft: '12 saat', 
                bidCount: 18, 
                status: 'open', 
                image: './img/osb.jpg', 
                closingDate: '2024-08-08T23:59:00Z', 
                createdDate: '2024-08-05T08:00:00Z' 
            },
            { 
                id: 6, 
                title: 'Plywood Alımı - Adana', 
                category: 'Plywood', 
                location: 'Adana', 
                startingPrice: '400 TL/levha', 
                currentBid: '410 TL/levha', 
                timeLeft: '4 gün', 
                bidCount: 7, 
                status: 'open', 
                image: './img/plywood.jpg', 
                closingDate: '2024-08-12T15:00:00Z', 
                createdDate: '2024-08-06T10:00:00Z' 
            },
            { 
                id: 7, 
                title: 'Taş Yünü Yalıtım İhalesi - Konya', 
                category: 'Taş Yünü', 
                location: 'Konya', 
                startingPrice: '120 TL/m²', 
                currentBid: '125 TL/m²', 
                timeLeft: '6 saat', 
                bidCount: 25, 
                status: 'open', 
                image: './img/rockwool.jpg', 
                closingDate: '2024-08-08T18:00:00Z', 
                createdDate: '2024-08-07T13:00:00Z' 
            },
            { 
                id: 8, 
                title: 'Gaz Beton (Ytong) Alımı - Gaziantep', 
                category: 'Gaz Beton (Ytong)', 
                location: 'Gaziantep', 
                startingPrice: '90 TL/adet', 
                currentBid: '91 TL/adet', 
                timeLeft: '2 gün', 
                bidCount: 12, 
                status: 'open', 
                image: './img/ytong.jpg', 
                closingDate: '2024-08-10T16:00:00Z', 
                createdDate: '2024-07-31T17:00:00Z' 
            },
            { 
                id: 11, 
                title: 'Kapalı Alçı İhalesi - İstanbul', 
                category: 'Alçı', 
                location: 'İstanbul', 
                startingPrice: '50 TL/torba', 
                currentBid: '55 TL/torba', 
                timeLeft: 'Kapandı', 
                bidCount: 10, 
                status: 'closed', 
                image: './img/plaster.jpg', 
                closingDate: '2024-08-05T10:00:00Z', 
                createdDate: '2024-07-25T09:00:00Z' 
            },
            { 
                id: 12, 
                title: 'Kapalı Kiremit Alımı - Bursa', 
                category: 'Kiremit / Mahya', 
                location: 'Bursa', 
                startingPrice: '5 TL/adet', 
                currentBid: '5.2 TL/adet', 
                timeLeft: 'Kapandı', 
                bidCount: 14, 
                status: 'closed', 
                image: './img/tile.jpg', 
                closingDate: '2024-08-06T15:00:00Z', 
                createdDate: '2024-07-28T11:00:00Z' 
            },
            { 
                id: 13, 
                title: 'Kapalı Membran İhalesi - İzmir', 
                category: 'Membran', 
                location: 'İzmir', 
                startingPrice: '200 TL/rulo', 
                currentBid: '210 TL/rulo', 
                timeLeft: 'Kapandı', 
                bidCount: 9, 
                status: 'closed', 
                image: './img/membrane.jpg', 
                closingDate: '2024-08-07T12:00:00Z', 
                createdDate: '2024-07-30T14:00:00Z' 
            },
            { 
                id: 14, 
                title: 'Kapalı İş Güvenliği Ekipmanları - Ankara', 
                category: 'İşçi ve İş Güvenliği Ekipmanları', 
                location: 'Ankara', 
                startingPrice: '5000 TL (Set)', 
                currentBid: '5150 TL (Set)', 
                timeLeft: 'Kapandı', 
                bidCount: 20, 
                status: 'closed', 
                image: './img/safety.jpg', 
                closingDate: '2024-08-04T16:00:00Z', 
                createdDate: '2024-07-29T10:00:00Z' 
            },
            { 
                id: 15, 
                title: 'Kapalı Hırdavat Grubu - Antalya', 
                category: 'Hırdavat Ürünleri Grubu', 
                location: 'Antalya', 
                startingPrice: '10000 TL (Paket)', 
                currentBid: '10200 TL (Paket)', 
                timeLeft: 'Kapandı', 
                bidCount: 16, 
                status: 'closed', 
                image: './img/hardware.jpg', 
                closingDate: '2024-08-03T18:00:00Z', 
                createdDate: '2024-07-26T13:00:00Z' 
            }
        ];
        
        // Mock veriyi kaydet
        if (!this.mockData.detailedAuctions) {
            this.mockData.detailedAuctions = detailedAuctions;
        }
        
        return detailedAuctions;
    }
    
    // İhale açıklaması oluştur
    generateAuctionDescription(auction) {
        const descriptions = {
            'Çimento': `Bu ihale kapsamında, yüksek kaliteli ${auction.category} tedarik edilecektir. İstenen miktar, projenin büyüklüğüne ve ihtiyaçlarına göre belirlenmiştir. Tedarik edilecek çimento, Türk Standartları Enstitüsü (TSE) tarafından onaylanmış olmalı ve uluslararası kalite standartlarına uygun olmalıdır. İhaleye katılacak tedarikçilerin, ürünlerin kalitesini ve uygunluğunu belgelemesi gerekmektedir.`,
            'Kereste': `Bu ihale kapsamında, inşaat projesi için ${auction.category} tedarik edilecektir. Keresteler, binanın yapısal bütünlüğünü sağlamak için yüksek kalitede olmalıdır. Tedarik edilecek keresteler, böcek ve mantar gibi zararlılardan arındırılmış ve nem içeriği kontrol edilmiş olmalıdır. İhaleye katılacak tedarikçilerin, ürünlerinin kalitesini ve sürdürülebilirlik belgelerini sunması gerekmektedir.`,
            'Bims': `Bu ihale kapsamında, inşaat projesi için ${auction.category} blokları tedarik edilecektir. Bims blokları, hafif ve ısı yalıtım özellikleri nedeniyle tercih edilmektedir. Tedarik edilecek bims blokları, ulusal yapı standartlarına uygun olmalı ve belgelendirilmelidir. İhaleye katılacak tedarikçilerin, ürünlerinin teknik özelliklerini ve kalite sertifikalarını sunması gerekmektedir.`,
            'Tuğla': `Bu ihale kapsamında, inşaat projesi için ${auction.category} tedarik edilecektir. Tuğlalar, duvar örme işlemlerinde kullanılacak olup, yüksek dayanıklılık ve ısı yalıtım özelliklerine sahip olmalıdır. Tedarik edilecek tuğlalar, ulusal yapı standartlarına uygun olmalı ve üretim kalitesi belgelendirilmelidir. İhaleye katılacak tedarikçilerin, ürünlerinin teknik özelliklerini ve kalite sertifikalarını sunması gerekmektedir.`,
            'default': `Bu ihale kapsamında, belirtilen özelliklerde ${auction.category} tedarik edilecektir. Ürünler, Türk standartlarına ve yapı yönetmeliklerine uygun kalitede olmalıdır. Teklifler, ürün kalitesi, teslimat süresi ve fiyat faktörleri göz önünde bulundurularak değerlendirilecektir. İhaleye katılacak tedarikçilerin gerekli belgeleri ve referansları sunmaları gerekmektedir.`
        };
        
        return descriptions[auction.category] || descriptions['default'];
    }
    
    // İhale şartları oluştur
    generateAuctionTerms() {
        return [
            "Teklif veren firmalar, ihale tarihinden itibaren 30 gün süreyle teklifleriyle bağlı kalacaklardır.",
            "Teslimat, sipariş tarihinden itibaren en geç 15 iş günü içinde tamamlanmalıdır.",
            "Ürünlerin kalitesi, ulusal ve uluslararası standartlara uygun olmalıdır.",
            "Ödemeler, teslimatın tamamlanmasından sonra 30 gün içinde yapılacaktır.",
            "İhaleyi kazanan firma, ürünlerin nakliyesinden ve teslimatından sorumlu olacaktır.",
            "Ürünlerde herhangi bir kusur veya hasar tespit edilmesi durumunda, tedarikçi firma değişim veya iade işlemlerini üstlenecektir.",
            "İhale komisyonu, gerekli gördüğü takdirde ihaleyi iptal etme hakkını saklı tutar."
        ];
    }
    
    // Rastgele tedarikçi bilgisi oluştur
    getRandomSupplier() {
        const suppliers = [
            {
                id: 1,
                name: "ABC Yapı Malzemeleri",
                logo: "./img/supplier1.png",
                rating: 4.8,
                location: "İstanbul",
                contactPerson: "Ahmet Yıldız",
                phone: "+90 (212) 555 1234",
                email: "info@abcyapi.com",
                website: "www.abcyapi.com",
                description: "İnşaat sektöründe 20 yılı aşkın tecrübesiyle hizmet veren firmamız, kaliteli yapı malzemeleri ve güvenilir hizmet anlayışıyla müşteri memnuniyetini ön planda tutmaktadır."
            },
            {
                id: 2,
                name: "Birlik İnşaat Malzemeleri",
                logo: "./img/supplier2.png",
                rating: 4.5,
                location: "Ankara",
                contactPerson: "Mehmet Demir",
                phone: "+90 (312) 444 5678",
                email: "iletisim@birlikinsaat.com",
                website: "www.birlikinsaat.com",
                description: "Birlik İnşaat Malzemeleri, sektörde kalite ve güvenin adresi olarak müşterilerine en iyi hizmeti sunmayı hedeflemektedir. Geniş ürün yelpazemiz ve rekabetçi fiyatlarımız ile projelerinize değer katıyoruz."
            },
            {
                id: 3,
                name: "Yapıtaş A.Ş.",
                logo: "./img/supplier3.png",
                rating: 4.3,
                location: "İzmir",
                contactPerson: "Ayşe Kaya",
                phone: "+90 (232) 333 9876",
                email: "satis@yapitas.com",
                website: "www.yapitas.com",
                description: "Yapıtaş A.Ş., inşaat sektöründe kaliteli ve ekonomik çözümler sunmaktadır. Müşteri odaklı hizmet anlayışımız ve sürekli gelişen ürün yelpazemiz ile projelerinizin güvenilir tedarikçisiyiz."
            }
        ];
        
        return suppliers[Math.floor(Math.random() * suppliers.length)];
    }
    
    // Teklif geçmişi oluştur
    generateBidHistory(auction) {
        const bidCount = auction.bidCount || 0;
        const currentBid = parseFloat(auction.currentBid?.replace(/[^\d.]/g, '') || 0);
        const startingPrice = parseFloat(auction.startingPrice?.replace(/[^\d.]/g, '') || 0);
        const history = [];
        
        if (bidCount === 0) {
            return history;
        }
        
        // En son teklifi ekle
        const now = new Date();
        history.push({
            amount: currentBid,
            date: now.toISOString(),
            bidder: "Anonymous" + Math.floor(Math.random() * 1000),
            id: bidCount
        });
        
        // Diğer teklifleri geçmişten günümüze doğru oluştur
        let previousAmount = currentBid;
        
        for (let i = bidCount - 1; i > 0; i--) {
            // Her bir teklif bir öncekinden biraz daha düşük olsun
            const ratio = 0.98 + (Math.random() * 0.01);
            previousAmount = previousAmount * ratio;
            
            // Tarih de geriye doğru gitsin
            const pastDate = new Date(now);
            pastDate.setHours(now.getHours() - (bidCount - i) * 2);
            
            history.unshift({
                amount: previousAmount,
                date: pastDate.toISOString(),
                bidder: "Anonymous" + Math.floor(Math.random() * 1000),
                id: i
            });
        }
        
        // İlk teklif olarak başlangıç fiyatını ekle
        const startDate = new Date(auction.createdDate);
        history.unshift({
            amount: startingPrice,
            date: startDate.toISOString(),
            bidder: "System",
            id: 0,
            isStartingPrice: true
        });
        
        return history;
    }

    // Ürün detayını getir
    async getProductById(id) {
        // Gerçek API kullanıma hazır olduğunda bu kısım değiştirilecek
        return new Promise((resolve) => {
            setTimeout(() => {
                const product = this.mockData.products.find(p => p.id === parseInt(id));
                
                if (product) {
                    // Ekstra detaylar ekle
                    const enhancedProduct = {
                        ...product,
                        stock: this.getProductStock(id),
                        deliveryTime: this.getDeliveryTime(id),
                        supplier: this.getSupplierName(product.supplier),
                        rating: this.getProductRating(id),
                        hasTSE: product.tse
                    };
                    resolve(enhancedProduct);
                } else {
                    resolve(null);
                }
            }, 300);
        });
    }

    // Ürün stoğunu getir
    getProductStock(id) {
        // Gerçek API olmadığı için rastgele stok verisi döndürüyoruz
        // Bazı ürünler stokta yok olarak işaretlenebilir
        const stockInfo = {
            1: 45,  // Çimento
            2: 120, // Tuğla
            3: 0,   // Alçı - Stokta yok
            4: 78,  // Demir
            5: 25,  // Kum
            6: 64,  // Fayans
            7: 92,  // Boya
            8: 15,  // Kireç
            9: 0,   // Tahta Kaplama - Stokta yok
            10: 42, // Vidalama Seti
            11: 30, // Sıva
            12: 18, // Led Panel
            13: 5,  // Hidrolik Asansör
            14: 0,  // Mekanik Vinç - Stokta yok
            15: 23  // Hidrolik Piston
        };
        
        return stockInfo[id] || 0;
    }

    // Teslimat süresini getir
    getDeliveryTime(id) {
        // Gerçek API olmadığı için sabit teslimat süreleri döndürüyoruz
        const deliveryTimes = {
            1: "1-2 iş günü",
            2: "Aynı gün",
            3: "3-5 iş günü",
            4: "1-2 iş günü",
            5: "Aynı gün",
            6: "2-3 iş günü",
            7: "1-2 iş günü",
            8: "2-3 iş günü",
            9: "5-7 iş günü",
            10: "1-2 iş günü",
            11: "Aynı gün",
            12: "3-4 iş günü",
            13: "7-10 iş günü",
            14: "10-15 iş günü",
            15: "3-5 iş günü"
        };
        
        return deliveryTimes[id] || "3-5 iş günü";
    }

    // Tedarikçi adını getir
    getSupplierName(supplierId) {
        const supplier = this.mockData.suppliers.find(s => s.id === supplierId);
        return supplier ? supplier.name : 'Belirtilmemiş';
    }

    // Ürün puanını getir
    getProductRating(id) {
        // Gerçek API olmadığı için rastgele puanlar döndürüyoruz
        const ratings = {
            1: 4.5,
            2: 4.2,
            3: 3.8,
            4: 4.7,
            5: 3.9,
            6: 4.0,
            7: 4.3,
            8: 3.6,
            9: 3.5,
            10: 4.8,
            11: 4.1,
            12: 4.0,
            13: 4.9,
            14: 3.7,
            15: 4.6
        };
        
        return ratings[id] || 4.0;
    }

    // Teklif isteği gönder
    submitQuoteRequest(quoteData) {
        // Gerçek API kullanıma hazır olduğunda bu kısım değiştirilecek
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = {
                    success: true,
                    quoteId: Math.floor(Math.random() * 100000),
                    message: 'Teklif talebiniz başarıyla alındı.',
                    estimatedResponse: '24 saat içinde'
                };
                resolve(response);
            }, 1000);
        });
    }

    // Kategori işlemleri
    async getCategories() {
        return this.fetchWithAuth('/categories');
    }

    // Tedarikçi işlemleri
    async getSuppliers(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.fetchWithAuth(`/suppliers?${queryString}`);
    }

    // Müteahhit işlemleri
    async getContractors(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.fetchWithAuth(`/contractors?${queryString}`);
    }

    // Lojistik firma işlemleri
    async getLogistics(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.fetchWithAuth(`/logistics?${queryString}`);
    }

    // Mevcut Kullanıcı Profilini Al
    async getUserProfile() {
        // Önce localStorage kontrol et
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            try {
                const userInfo = JSON.parse(storedUserInfo);
                // Token hala geçerli mi diye API'ye sorulabilir (isteğe bağlı)
                return { ...userInfo, isLoggedIn: true };
            } catch (e) {
                console.error("Error parsing stored user info:", e);
                localStorage.removeItem('userInfo'); // Bozuk veriyi temizle
            }
        }

        // Token var ama localStorage'da bilgi yoksa API'den çekmeyi dene
        if (this.token) {
            try {
                console.log("Fetching user profile from API...");
                // GERÇEK API ENTEGRASYONU:
                // const profile = await this.fetchWithAuth('/profile'); 
                // localStorage.setItem('userInfo', JSON.stringify(profile));
                // return { ...profile, isLoggedIn: true };

                // ---- MOCK API YANITI (Geçici) ----
                // Bu kısmı gerçek API entegrasyonu ile değiştirin
                const mockProfile = {
                    id: 1,
                    name: 'Ahmet Yılmaz',
                    username: 'ahmet.yilmaz',
                    email: 'ahmet@yilmazinsaat.com',
                    phone: '5301234567',
                    userType: 'contractor', // Kullanıcı tipi
                    role: 'contractor', // API ile eşleşen rol değeri (siparişlerim menüsü kontrolü için)
                    position: 'Proje Müdürü', // Pozisyon/Görev bilgisi
                    companyName: 'Yılmaz İnşaat',
                    companyFullName: 'Yılmaz İnşaat ve Taahhüt A.Ş.',
                    taxId: '1234567890',
                    profilePictureUrl: 'img/default-avatar.png',
                    // Diğer müteahhit bilgileri...
                };
                localStorage.setItem('userInfo', JSON.stringify(mockProfile)); // Mock veriyi sakla
                return { ...mockProfile, isLoggedIn: true };
                // ---- MOCK API YANITI SONU ----

            } catch (error) {
                console.error("Error fetching user profile from API:", error);
                // Token geçersiz olabilir, çıkış yaptır
                this.logout(); 
                return { isLoggedIn: false };
            }
        }

        // Token yoksa giriş yapılmamıştır
        return { isLoggedIn: false };
    }

    // Kullanıcı Profilini Güncelle
    async updateUserProfile(profileData) { // profileData artık FormData olabilir
        if (!this.token) throw new Error("Authentication required");
        try {
            // GERÇEK API ENTEGRASYONU:
            // const updatedProfile = await this.fetchWithAuth('/profile', {
            //     method: 'PUT',
            //     body: profileData // FormData gönder
            // });
            // localStorage.setItem('userInfo', JSON.stringify(updatedProfile)); 
            // return updatedProfile;

            // ---- MOCK API YANITI (Geçici) ----
            console.log("Mock updating profile with FormData:");
            // FormData içeriğini loglamak için:
            for (let [key, value] of profileData.entries()) { 
                if (value instanceof File) {
                    console.log(`${key}: ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            const currentProfile = JSON.parse(localStorage.getItem('userInfo') || '{}');
            // Mock olarak sadece text alanlarını güncelleyelim
            const updatedProfile = { ...currentProfile };
            profileData.forEach((value, key) => {
                // Dosyalar hariç diğer alanları güncelle (mock amaçlı)
                if (!(value instanceof File)) {
                     updatedProfile[key] = value;
                }
            });
            
            localStorage.setItem('userInfo', JSON.stringify(updatedProfile));
            await new Promise(resolve => setTimeout(resolve, 500)); 
            return updatedProfile;
            // ---- MOCK API YANITI SONU ----

        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    }
    
    // Profil Fotoğrafını Yükle
    async uploadProfilePicture(file) {
        if (!this.token) throw new Error("Authentication required");
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            // GERÇEK API ENTEGRASYONU:
            // const response = await this.fetchWithAuth('/profile/picture', { ... });
            // ... (önceki gibi)
            // return response; 

             // ---- MOCK API YANITI (Geçici) ----
             console.log("Mock uploading profile picture:", file.name);
             await new Promise(resolve => setTimeout(resolve, 1000)); 
             // Geçerli bir mock URL döndür (örn: placeholder veya eklenecek default avatar)
             const mockUrl = 'img/placeholder.jpg'; // VEYA 'img/default-avatar.png'
             const currentProfile = JSON.parse(localStorage.getItem('userInfo') || '{}');
             currentProfile.profilePictureUrl = mockUrl; 
             localStorage.setItem('userInfo', JSON.stringify(currentProfile));
             return { success: true, profilePictureUrl: mockUrl };
             // ---- MOCK API YANITI SONU ----

        } catch (error) {
             console.error("Error uploading profile picture:", error);
             throw error;
        }
    }

    // Arama işlemleri
    async search(query, type = 'all') {
        return this.fetchWithAuth(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    }

    // Şifre işlemleri
    async changePassword(currentPassword, newPassword) {
        try {
            // Mock veri kontrolü
            if (this.mockData) {
                console.log("Mock API: Şifre değiştirme isteği");
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Basit doğrulama simülasyonu
                if (currentPassword === "123456") {
                    return {
                        success: true,
                        message: "Şifreniz başarıyla güncellendi."
                    };
                } else {
                    return {
                        success: false,
                        message: "Mevcut şifreniz yanlış."
                    };
                }
            }
            
            return await this.fetchWithAuth('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    async requestPasswordResetEmail(email) {
        try {
            // Mock veri kontrolü
            if (this.mockData) {
                console.log("Mock API: E-posta ile şifre sıfırlama isteği");
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // E-posta formatı kontrolü
                if (email.includes('@') && email.includes('.')) {
                    return {
                        success: true,
                        message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
                    };
                } else {
                    return {
                        success: false,
                        message: "Geçersiz e-posta adresi."
                    };
                }
            }
            
            return await this.fetchWithAuth('/auth/reset-password/email', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        } catch (error) {
            console.error('Error requesting password reset email:', error);
            throw error;
        }
    }

    async requestPasswordResetSMS(phone) {
        try {
            // Mock veri kontrolü
            if (this.mockData) {
                console.log("Mock API: SMS ile şifre sıfırlama isteği");
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Telefon numarası formatı kontrolü (Türkiye formatı)
                if (phone.startsWith('5') && phone.length === 10) {
                    return {
                        success: true,
                        message: "Şifre sıfırlama kodu telefonunuza gönderildi."
                    };
                } else {
                    return {
                        success: false,
                        message: "Geçersiz telefon numarası formatı."
                    };
                }
            }
            
            return await this.fetchWithAuth('/auth/reset-password/sms', {
                method: 'POST',
                body: JSON.stringify({ phone })
            });
        } catch (error) {
            console.error('Error requesting password reset SMS:', error);
            throw error;
        }
    }

    // Mesaj işlemleri için API fonksiyonları
    async getMessages(tab = 'inbox', search = '') {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/messages?tab=${tab}&search=${encodeURIComponent(search)}`);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Fetching messages for tab: ${tab}, search: ${search}`);
            
            // Kullanıcı bilgilerini al
            const userInfo = await this.getUserProfile();
            const { userType } = userInfo;
            
            // Mock mesaj verisi 
            const mockInbox = [
                {
                    id: 1,
                    sender: { id: 101, name: "Ankara Tedarik Ltd.", type: "supplier" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Çimento Fiyat Teklifi",
                    content: "Sayın yetkili,\n\nBaşvurunuz üzerine çimento ürünlerimizin fiyat listesini ekte bulabilirsiniz. Kampanyalı fiyatlarımız 30 gün geçerlidir.\n\nBilgilerinize sunarız.\n\nSaygılarımızla,\nAnkara Tedarik Ltd.",
                    date: "2023-07-15T10:30:00",
                    read: true,
                    attachments: [
                        { id: 1, name: "Çimento_Fiyat_Listesi_2023.pdf", size: "320KB", type: "application/pdf" }
                    ]
                },
                {
                    id: 2,
                    sender: { id: 102, name: "İstanbul Lojistik A.Ş.", type: "logistics" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Taşıma Hizmeti Hakkında",
                    content: "Merhaba,\n\nFirmamız inşaat malzemeleri taşımacılığı konusunda 15 yıllık tecrübeye sahiptir. İstanbul-Ankara ve İstanbul-İzmir hatlarında düzenli seferlerimiz bulunmaktadır.\n\nDetaylı bilgi için iletişime geçebilirsiniz.\n\nİyi çalışmalar dileriz.",
                    date: "2023-07-16T14:20:00",
                    read: false,
                    attachments: []
                },
                {
                    id: 3,
                    sender: { id: 103, name: "İzmir Yapı Malzemeleri", type: "supplier" },
                    recipient: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    subject: "Demir Fiyat Listesi",
                    content: "Değerli Müşterimiz,\n\nTalep etmiş olduğunuz inşaat demiri fiyatlarımızı ekte bulabilirsiniz. 100 ton üzeri alımlarda %5 indirim sağlayabiliyoruz.\n\nSaygılarımızla,\nİzmir Yapı Malzemeleri",
                    date: "2023-07-17T09:15:00",
                    read: false,
                    attachments: [
                        { id: 2, name: "Demir_Fiyatları_Temmuz_2023.xlsx", size: "156KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                    ]
                }
            ];
            
            const mockSent = [
                {
                    id: 101,
                    sender: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    recipient: { id: 201, name: "Ege Çimento San.", type: "supplier" },
                    subject: "Çimento Fiyat Teklifi İsteği",
                    content: "Merhaba,\n\nAnkara Etimesgut'taki inşaat projemiz için 2000 ton çimento alımı düşünüyoruz.\n\nEn güncel fiyat teklifinizi ve teslimat şartlarınızı paylaşabilir misiniz?\n\nTeşekkürler.",
                    date: "2023-07-14T16:45:00",
                    read: true,
                    attachments: []
                },
                {
                    id: 102,
                    sender: { id: userInfo.id, name: userInfo.companyName, type: userInfo.userType },
                    recipient: { id: 202, name: "Anadolu Nakliyat", type: "logistics" },
                    subject: "Malzeme Taşıma Talebi",
                    content: "Sayın yetkili,\n\nİzmir'den Ankara'ya 2 kamyon tuğla sevkiyatı için fiyat teklifinizi rica ediyoruz.\n\nYaklaşık 40 ton ağırlığında olacak ve 25 Temmuz tarihinde hazır olacaktır.\n\nİlginiz için teşekkürler.",
                    date: "2023-07-15T11:30:00",
                    read: true,
                    attachments: []
                }
            ];
            
            // Arama filtresi uygula (eğer varsa)
            const applySearch = (messages) => {
                if (!search) return messages;
                return messages.filter(msg => 
                    msg.subject.toLowerCase().includes(search.toLowerCase()) || 
                    msg.content.toLowerCase().includes(search.toLowerCase()) ||
                    msg.sender.name.toLowerCase().includes(search.toLowerCase()) ||
                    msg.recipient.name.toLowerCase().includes(search.toLowerCase())
                );
            };
            
            // İstenen sekmeye göre filtrele ve gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms gecikme
            
            if (tab === 'inbox') {
                return applySearch(mockInbox);
            } else {
                return applySearch(mockSent);
            }
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error fetching messages:", error);
            throw error;
        }
    }
    
    // Belirli bir mesajı getir
    async getMessage(messageId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/messages/${messageId}`);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Fetching message with ID: ${messageId}`);
            
            // Tüm mesajları getir ve ID'ye göre filtrele
            const inbox = await this.getMessages('inbox');
            const sent = await this.getMessages('sent');
            const allMessages = [...inbox, ...sent];
            
            const message = allMessages.find(msg => msg.id === parseInt(messageId));
            
            if (!message) {
                throw new Error("Message not found");
            }
            
            // Mesaj okundu olarak işaretle (inbox mesajları için)
            if (inbox.includes(message) && !message.read) {
                message.read = true;
                // Gerçek API'de bu noktada bir PATCH isteği gönderilebilir
                console.log(`Marking message ${messageId} as read`);
            }
            
            // Gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 300));
            
            return message;
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error fetching message ${messageId}:`, error);
            throw error;
        }
    }
    
    // Mesaj gönder
    async sendMessage(messageData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // FormData kullanılıyorsa doğrudan gönderilir
            // if (messageData instanceof FormData) {
            //     return await this.fetchWithAuth('/messages', {
            //         method: 'POST',
            //         body: messageData
            //     });
            // }
            // // Normal JSON formatında ise
            // return await this.fetchWithAuth('/messages', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(messageData)
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log("Sending message:", messageData);
            
            // FormData işleme
            let parsedData = messageData;
            if (messageData instanceof FormData) {
                parsedData = {};
                for (let [key, value] of messageData.entries()) {
                    // Dosya bilgilerini işle
                    if (value instanceof File) {
                        // Dosya listesi yoksa oluştur
                        if (!parsedData.attachments) parsedData.attachments = [];
                        parsedData.attachments.push({
                            id: Math.floor(Math.random() * 1000),
                            name: value.name,
                            size: `${Math.round(value.size / 1024)}KB`,
                            type: value.type
                        });
                    } else {
                        parsedData[key] = value;
                    }
                }
            }
            
            // Kullanıcı bilgilerini al
            const userInfo = await this.getUserProfile();
            
            // Yeni mesaj oluştur
            const newMessage = {
                id: Math.floor(Math.random() * 10000),
                sender: { 
                    id: userInfo.id, 
                    name: userInfo.companyName || "Kullanıcı", 
                    type: userInfo.userType 
                },
                recipient: {
                    id: parsedData.recipientId,
                    name: parsedData.recipientName,
                    type: parsedData.recipientType
                },
                subject: parsedData.subject,
                content: parsedData.content,
                date: new Date().toISOString(),
                read: false,
                attachments: parsedData.attachments || []
            };
            
            // Gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 800));
            
            return { success: true, message: newMessage };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }
    
    // Mesaj yanıtla
    async replyToMessage(messageId, replyData) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // FormData kullanılıyorsa doğrudan gönderilir
            // if (replyData instanceof FormData) {
            //     replyData.append('parentMessageId', messageId);
            //     return await this.fetchWithAuth('/messages/reply', {
            //         method: 'POST',
            //         body: replyData
            //     });
            // }
            // // Normal JSON formatında ise
            // return await this.fetchWithAuth('/messages/reply', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({...replyData, parentMessageId: messageId})
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Replying to message ${messageId}:`, replyData);
            
            // Orijinal mesajı getir
            const originalMessage = await this.getMessage(messageId);
            
            // FormData işleme
            let parsedData = replyData;
            let attachments = [];
            if (replyData instanceof FormData) {
                parsedData = {};
                for (let [key, value] of replyData.entries()) {
                    if (value instanceof File) {
                        attachments.push({
                            id: Math.floor(Math.random() * 1000),
                            name: value.name,
                            size: `${Math.round(value.size / 1024)}KB`,
                            type: value.type
                        });
                    } else {
                        parsedData[key] = value;
                    }
                }
            }
            
            // Kullanıcı bilgilerini al
            const userInfo = await this.getUserProfile();
            
            // Yeni yanıt mesajı oluştur
            const replyMessage = {
                id: Math.floor(Math.random() * 10000),
                sender: { 
                    id: userInfo.id, 
                    name: userInfo.companyName || "Kullanıcı", 
                    type: userInfo.userType 
                },
                recipient: originalMessage.sender, // Orijinal göndereni alıcı yap
                subject: `RE: ${originalMessage.subject}`,
                content: parsedData.content,
                date: new Date().toISOString(),
                read: false,
                attachments: attachments,
                parentMessageId: messageId
            };
            
            // Gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 800));
            
            return { success: true, message: replyMessage };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error replying to message ${messageId}:`, error);
            throw error;
        }
    }
    
    // Mesajı sil
    async deleteMessage(messageId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/messages/${messageId}`, {
            //     method: 'DELETE'
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Deleting message ${messageId}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true, message: "Mesaj başarıyla silindi." };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error deleting message ${messageId}:`, error);
            throw error;
        }
    }
    
    // Okunmamış mesaj sayısını getir
    async getUnreadMessageCount() {
        if (!this.token) return 0;
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // const response = await this.fetchWithAuth('/messages/unread/count');
            // return response.count;
            
            // ---- MOCK API YANITI (Geçici) ----
            const messages = await this.getMessages('inbox');
            const unreadCount = messages.filter(msg => !msg.read).length;
            return unreadCount;
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error fetching unread message count:", error);
            return 0; // Hata durumunda 0 döndür
        }
    }
    
    // Kullanıcı türüne göre mesajlaşılabilecek firmaları getir
    async getMessageRecipients(recipientType) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/users?type=${recipientType}`);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Fetching recipients of type: ${recipientType}`);
            
            // Gecikme ekle
            await new Promise(resolve => setTimeout(resolve, 400));
            
            // Kullanıcı türüne göre mock veriler
            const mockContractors = [
                { id: 201, name: "Yılmaz İnşaat A.Ş.", type: "contractor" },
                { id: 202, name: "Mega Yapı Ltd.", type: "contractor" },
                { id: 203, name: "Doğan İnşaat", type: "contractor" },
                { id: 204, name: "Anadolu İnşaat A.Ş.", type: "contractor" }
            ];
            
            const mockSuppliers = [
                { id: 301, name: "Ege Çimento San.", type: "supplier" },
                { id: 302, name: "Demir-Çelik A.Ş.", type: "supplier" },
                { id: 303, name: "Ankara Tedarik Ltd.", type: "supplier" },
                { id: 304, name: "İzmir Yapı Malzemeleri", type: "supplier" }
            ];
            
            const mockLogistics = [
                { id: 401, name: "Hızlı Taşıma Ltd.", type: "logistics" },
                { id: 402, name: "Anadolu Nakliyat", type: "logistics" },
                { id: 403, name: "İstanbul Lojistik A.Ş.", type: "logistics" },
                { id: 404, name: "Ekspres Kargo", type: "logistics" }
            ];
            
            switch (recipientType) {
                case 'contractor':
                    return mockContractors;
                case 'supplier':
                    return mockSuppliers;
                case 'logistics':
                    return mockLogistics;
                default:
                    return [];
            }
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error(`Error fetching recipients of type ${recipientType}:`, error);
            throw error;
        }
    }
    
    // Siparişleri getiren API fonksiyonu
    async getOrders(filters = {}) {
        try {
            console.log('Siparişler getiriliyor, filtreler:', filters);
            
            // Mock: API isteği simüle ediliyor
            return new Promise((resolve) => {
                setTimeout(() => {
                    let orders = [...this.mockData.orders];
                    
                    // Filtreleme işlemleri
                    if (filters.requestNumber) {
                        orders = orders.filter(order => 
                            order.requestNumber.toLowerCase().includes(filters.requestNumber.toLowerCase())
                        );
                    }
                    
                    if (filters.status) {
                        orders = orders.filter(order => order.status === filters.status);
                    }
                    
                    if (filters.startDate && filters.endDate) {
                        const start = new Date(filters.startDate);
                        const end = new Date(filters.endDate);
                        orders = orders.filter(order => {
                            const orderDate = new Date(order.orderDate);
                            return orderDate >= start && orderDate <= end;
                        });
                    }
                    
                    // Sıralama (varsayılan: en yeni)
                    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                    
                    // Başarılı yanıt
                    resolve({
                        success: true,
                        data: orders,
                        total: orders.length
                    });
                }, 800); // 0.8 saniyelik yapay gecikme
            });
        } catch (error) {
            console.error('Siparişler getirilirken hata:', error);
            return {
                success: false,
                message: error.message || 'Siparişler getirilirken bir hata oluştu.',
                data: []
            };
        }
    }
    
    // Sipariş detaylarını getir
    async getOrderDetails(requestNumber) {
        try {
            console.log('Sipariş detayları getiriliyor, talep no:', requestNumber);
            
            // Mock: API isteği simüle ediliyor
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const order = this.mockData.orders.find(o => o.requestNumber === requestNumber);
                    
                    if (order) {
                        // İlgili ihale bilgilerini ekle
                        const auction = this.mockData.auctions.find(a => a.id === order.auctionId);
                        
                        resolve({
                            success: true,
                            data: {
                                ...order,
                                auction: auction || null
                            }
                        });
                    } else {
                        reject({
                            success: false,
                            message: `${requestNumber} numaralı sipariş bulunamadı.`
                        });
                    }
                }, 600); // 0.6 saniyelik yapay gecikme
            });
        } catch (error) {
            console.error('Sipariş detayları getirilirken hata:', error);
            return {
                success: false,
                message: error.message || 'Sipariş detayları getirilirken bir hata oluştu.',
                data: null
            };
        }
    }

    // Dosya yükleme API fonksiyonu
    async uploadFile(formData, progressCallback) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // Gerçek bir XHR kullanarak dosya yükleme işlemi ve ilerleme takibi
            /*
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', this.apiUrl + '/upload', true);
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
                
                // İlerleme olayını izle
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && typeof progressCallback === 'function') {
                        const percentComplete = Math.round((event.loaded / event.total) * 100);
                        progressCallback(percentComplete);
                    }
                };
                
                xhr.onload = function() {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(JSON.parse(xhr.response));
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText,
                            response: xhr.response
                        });
                    }
                };
                
                xhr.onerror = function() {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText,
                        response: xhr.response
                    });
                };
                
                xhr.send(formData);
            });
            */
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log("Mock file upload:", formData);
            
            const files = [];
            // FormData içeriğini loglamak için
            if (formData instanceof FormData) {
                for (let [key, value] of formData.entries()) {
                    if (value instanceof File) {
                        files.push({
                            id: Math.floor(Math.random() * 10000),
                            name: value.name,
                            size: value.size,
                            type: value.type,
                            url: URL.createObjectURL(value) // İndirme için geçici URL (gerçek uygulamada API'den gelen URL)
                        });
                    }
                }
            }
            
            // Yükleme ilerleme simülasyonu
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (typeof progressCallback === 'function') {
                    progressCallback(progress);
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 300);
            
            // API yanıtını simüle et
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return {
                success: true,
                message: "Dosyalar başarıyla yüklendi",
                files: files
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error uploading files:", error);
            throw error;
        }
    }
    
    // Dosya indirme API fonksiyonu
    async downloadFile(fileId, fileName) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // const response = await fetch(`${this.apiUrl}/download/${fileId}`, {
            //     method: 'GET',
            //     headers: {
            //         'Authorization': `Bearer ${this.token}`
            //     }
            // });
            
            // if (!response.ok) {
            //     throw new Error(`Dosya indirme hatası: ${response.status} ${response.statusText}`);
            // }
            
            // const blob = await response.blob();
            // const url = URL.createObjectURL(blob);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = fileName || `download-${fileId}`;
            // document.body.appendChild(a);
            // a.click();
            // document.body.removeChild(a);
            // URL.revokeObjectURL(url);
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Mock downloading file with ID: ${fileId}, filename: ${fileName}`);
            
            // Dosya indirme simülasyonu - gerçek uygulamada yukarıdaki kod çalışacak
            alert(`Dosya indirme simülasyonu: ${fileName || fileId}`);
            
            return {
                success: true,
                message: "Dosya indirme işlemi başlatıldı"
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error downloading file:", error);
            throw error;
        }
    }
    
    // Dosya silme API fonksiyonu
    async deleteFile(fileId) {
        if (!this.token) throw new Error("Authentication required");
        
        try {
            // GERÇEK API ENTEGRASYONU:
            // return await this.fetchWithAuth(`/files/${fileId}`, {
            //     method: 'DELETE'
            // });
            
            // ---- MOCK API YANITI (Geçici) ----
            console.log(`Mock deleting file with ID: ${fileId}`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return {
                success: true,
                message: "Dosya başarıyla silindi"
            };
            // ---- MOCK API YANITI SONU ----
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }

    // İhale Oluşturma API
    async createAuction(auctionData) {
        try {
            // Gerçek API'ye gönderilecek (şu anda mock yapılıyor)
            console.log('İhale oluşturma verisi:', auctionData);
            
            // Mock: API isteği simüle ediliyor
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Yeni ihale oluştur
                    const newAuction = {
                        id: Date.now(),
                        title: auctionData.title,
                        description: auctionData.description,
                        category: auctionData.category,
                        features: auctionData.features || [],
                        status: 'active', // Yayınlandığı için aktif
                        startDate: new Date().toISOString(),
                        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün sonra
                        materials: auctionData.materials || [],
                        bidCount: 0,
                        currentBid: null,
                        startingPrice: this.calculateStartingPrice(auctionData.materials),
                        location: this.extractMainLocation(auctionData.materials),
                        bids: [],
                        bidSettings: {
                            bidConditions: auctionData.bidConditions || [],
                            isoCertificates: auctionData.isoCertificates || [],
                            tseCertificates: auctionData.tseCertificates || [],
                            ceCertificate: auctionData.ceCertificate || '',
                            technicalSpecs: auctionData.technicalSpecs || '',
                            qualityStandards: auctionData.qualityStandards || ''
                        },
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Mock veritabanına ekle
                    this.mockData.auctions.unshift(newAuction);
                    
                    // Başarılı yanıt
                    resolve({
                        success: true,
                        message: 'İhale başarıyla oluşturuldu.',
                        data: newAuction
                    });
                }, 1500); // 1.5 saniyelik yapay gecikme
            });
        } catch (error) {
            console.error('İhale oluşturma hatası:', error);
            return {
                success: false,
                message: error.message || 'İhale oluşturulurken bir hata oluştu.'
            };
        }
    }
    
    // İhale başlangıç fiyatını hesapla (mock)
    calculateStartingPrice(materials) {
        // Örnek bir hesaplama, gerçekte farklı bir mantık kullanılabilir
        if (!materials || materials.length === 0) return 0;
        
        // Malzemelerin miktarına göre ortalama bir değer belirle
        let totalEstimate = 0;
        materials.forEach(material => {
            const quantity = parseFloat(material.quantity) || 0;
            
            // Birime göre farklı çarpanlar kullan
            let unitFactor = 100;
            switch (material.unit) {
                case 'Ton':
                    unitFactor = 1000;
                    break;
                case 'Kg':
                    unitFactor = 50;
                    break;
                case 'm²':
                    unitFactor = 200;
                    break;
                case 'm³':
                    unitFactor = 500;
                    break;
                case 'Metre':
                    unitFactor = 30;
                    break;
                case 'Adet':
                default:
                    unitFactor = 100;
            }
            
            totalEstimate += quantity * unitFactor;
        });
        
        // Minimum bir değer belirle
        return Math.max(totalEstimate, 1000);
    }
    
    // İhale ana lokasyonunu çıkar (en çok tekrar eden)
    extractMainLocation(materials) {
        if (!materials || materials.length === 0) return 'Belirtilmemiş';
        
        // Lokasyonları say
        const locationCounts = {};
        materials.forEach(material => {
            if (material.location) {
                locationCounts[material.location] = (locationCounts[material.location] || 0) + 1;
            }
        });
        
        // En çok tekrar eden lokasyonu bul
        let maxCount = 0;
        let mainLocation = 'Belirtilmemiş';
        
        for (const location in locationCounts) {
            if (locationCounts[location] > maxCount) {
                maxCount = locationCounts[location];
                mainLocation = location;
            }
        }
        
        return mainLocation;
    }

    // Sipariş oluşturma
    async createOrder(orderData) {
        try {
            console.log('Sipariş oluşturuluyor:', orderData);
            
            // Mock: API isteği simüle ediliyor
            return new Promise((resolve) => {
                setTimeout(() => {
                    const newOrder = {
                        id: Date.now(),
                        ...orderData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Mock veritabanına ekle
                    this.mockData.orders.unshift(newOrder);
                    
                    console.log('Oluşturulan sipariş:', newOrder);
                    
                    // Başarılı yanıt
                    resolve({
                        success: true,
                        message: 'Sipariş başarıyla oluşturuldu.',
                        data: newOrder
                    });
                }, 500); // 0.5 saniyelik yapay gecikme
            });
        } catch (error) {
            console.error('Sipariş oluşturma hatası:', error);
            return {
                success: false,
                message: error.message || 'Sipariş oluşturulurken bir hata oluştu.'
            };
        }
    }
}

// Singleton instance oluştur ve global scope'a ekle
const apiService = new ApiService();
window.apiService = apiService;