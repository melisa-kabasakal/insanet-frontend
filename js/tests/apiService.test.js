// API Service Test Script

// Browser API'lerini taklit et
global.localStorage = {
    getItem: () => 'mock-token',
    setItem: () => {},
    removeItem: () => {}
};

global.window = {
    location: {
        origin: 'http://localhost:8080'
    }
};

global.FormData = class FormData {
    constructor() {
        this.data = {};
    }
    append(key, value) {
        this.data[key] = value;
    }
    entries() {
        return Object.entries(this.data);
    }
};

global.File = class File {
    constructor(bits, name, options = {}) {
        this.name = name;
        this.size = bits.length;
        this.type = options.type || '';
    }
};

// ApiService sınıfını içe aktar
const fs = require('fs');
const path = require('path');

// ApiService dosyasını oku ve eval et
const apiServicePath = path.join(__dirname, '..', 'apiService.js');
const apiServiceCode = fs.readFileSync(apiServicePath, 'utf-8');
eval(apiServiceCode);

// Test fonksiyonu
async function testApiMethods() {
    console.log('=== API Service Test Başlıyor ===');

    try {
        // 1. Hal listesini test et
        console.log('\n1. Hal Listesi Testi:');
        const markets = await apiService.getMarkets({ page: 1, limit: 5 });
        console.log('Hal Listesi:', markets);

        if (markets && Array.isArray(markets)) {
            // 2. İlk hal'in detaylarını test et
            console.log('\n2. Hal Detay Testi:');
            const marketId = markets[0].id;
            const marketDetail = await apiService.getMarketById(marketId);
            console.log(`Hal Detayı (ID: ${marketId}):`, marketDetail);

            // 3. Hal'deki ürünleri test et
            console.log('\n3. Hal Ürünleri Testi:');
            const marketProducts = await apiService.getMarketProducts(marketId, { limit: 3 });
            console.log(`Hal Ürünleri (Hal ID: ${marketId}):`, marketProducts);
        }

        // 4. Ürün aramasını test et
        console.log('\n4. Ürün Arama Testi:');
        const searchResults = await apiService.searchProducts('çimento', {
            limit: 3,
            sort: 'price'
        });
        console.log('Arama Sonuçları:', searchResults);

        // 5. Ürün kategorilerini test et
        console.log('\n5. Ürün Kategorileri Testi:');
        const categories = await apiService.getProductCategories();
        console.log('Kategoriler:', categories);

        if (categories && categories.length > 0) {
            // 6. Kategoriye göre ürünleri test et
            console.log('\n6. Kategori Ürünleri Testi:');
            const categoryProducts = await apiService.getProductsByCategory(categories[0].id, { limit: 3 });
            console.log(`Kategori Ürünleri (Kategori: ${categories[0].name}):`, categoryProducts);
        }

        // 7. Ürün detaylarını test et (ilk arama sonucunu kullan)
        if (searchResults && searchResults.length > 0) {
            console.log('\n7. Ürün Detayları Testi:');
            const productId = searchResults[0].id;
            const productDetails = await apiService.getProductDetails(productId);
            console.log(`Ürün Detayları (ID: ${productId}):`, productDetails);

            // 8. Ürün fiyat geçmişini test et
            console.log('\n8. Ürün Fiyat Geçmişi Testi:');
            const priceHistory = await apiService.getProductPriceHistory(productId, '3months');
            console.log(`Fiyat Geçmişi (ID: ${productId}):`, priceHistory);

            // 9. Ürün stok durumunu test et
            console.log('\n9. Ürün Stok Durumu Testi:');
            const availability = await apiService.getProductAvailability(productId);
            console.log(`Stok Durumu (ID: ${productId}):`, availability);
        }

        console.log('\n=== Test Başarıyla Tamamlandı ===');
    } catch (error) {
        console.error('\n!!! Test Sırasında Hata Oluştu !!!');
        console.error('Hata:', error);
    }
}

// Testi çalıştır
testApiMethods();
