const https = require('https');
setInterval(() => {
  https.get('https://viteapi.onrender.com/api/v1', (res) => {
    console.log('✅ Keep-alive ping:', new Date().toLocaleTimeString());
  }).on('error', () => console.log('⚠️ Ping failed'));
}, 9 * 60 * 1000); // Toutes les 9 minutes
console.log('🔄 Keep-alive démarré pour VITE API');
