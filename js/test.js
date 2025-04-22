// Test fonksiyonları
async function testAuctionEndpoints() {
    console.log('=== Testing Auction Endpoints ===');
    
    try {
        // 1. Yeni bir açık artırma oluştur
        const newAuction = {
            title: "Test Açık Artırma",
            description: "Test açıklaması",
            startingPrice: 1000,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 gün sonra
        };
        
        console.log('Creating new auction...');
        const createdAuction = await apiService.createAuction(newAuction);
        console.log('Created auction:', createdAuction);
        
        // 2. Tüm açık artırmaları listele
        console.log('Fetching all auctions...');
        const auctions = await apiService.getAuctions();
        console.log('All auctions:', auctions);
        
        // 3. Belirli bir açık artırmayı getir
        if (createdAuction?.id) {
            console.log(`Fetching auction with ID: ${createdAuction.id}`);
            const auction = await apiService.getAuctionById(createdAuction.id);
            console.log('Single auction:', auction);
            
            // 4. Açık artırmayı güncelle
            const updatedData = {
                ...newAuction,
                title: "Güncellenmiş Test Açık Artırma"
            };
            console.log('Updating auction...');
            const updatedAuction = await apiService.updateAuction(createdAuction.id, updatedData);
            console.log('Updated auction:', updatedAuction);
        }
    } catch (error) {
        console.error('Auction test error:', error);
    }
}

async function testProductEndpoints() {
    console.log('=== Testing Product Endpoints ===');
    
    try {
        // 1. Yeni bir ürün oluştur
        const newProduct = {
            name: "Test Ürün",
            description: "Test ürün açıklaması",
            price: 500,
            category: "Test Kategori"
        };
        
        console.log('Creating new product...');
        const createdProduct = await apiService.createProduct(newProduct);
        console.log('Created product:', createdProduct);
        
        // 2. Tüm ürünleri listele
        console.log('Fetching all products...');
        const products = await apiService.getProducts();
        console.log('All products:', products);
        
        // 3. Belirli bir ürünü getir
        if (createdProduct?.id) {
            console.log(`Fetching product with ID: ${createdProduct.id}`);
            const product = await apiService.getProductById(createdProduct.id);
            console.log('Single product:', product);
            
            // 4. Ürünü güncelle
            const updatedData = {
                ...newProduct,
                name: "Güncellenmiş Test Ürün"
            };
            console.log('Updating product...');
            const updatedProduct = await apiService.updateProduct(createdProduct.id, updatedData);
            console.log('Updated product:', updatedProduct);
        }
    } catch (error) {
        console.error('Product test error:', error);
    }
}

// Test fonksiyonlarını çalıştır
async function runTests() {
    await testAuctionEndpoints();
    console.log('\n'); // Boş satır
    await testProductEndpoints();
}

// Testleri başlat
runTests();
