const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS ayarları
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Statik dosyaları serve et
app.use(express.static(__dirname));

// Tüm route'ları index.html'e yönlendir (SPA için)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
});
