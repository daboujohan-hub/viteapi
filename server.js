// ══════════════════════════════════════════════════════
//  VITE API v2.0 — Sandbox Paiement Mobile
//  Aboudev Labs © 2026
//  Nouveautés : Firebase + Sécurité + Webhook
// ══════════════════════════════════════════════════════

const express   = require('express');
const cors      = require('cors');
const crypto    = require('crypto');
const path      = require('path');
const https     = require('https');
const http      = require('http');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ════════════════════════════════════════════
//  FIREBASE CONFIG
// ════════════════════════════════════════════
const FIREBASE_URL = process.env.FIREBASE_URL || 'https://viteapi-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = process.env.FIREBASE_SECRET || '';

// Helper Firebase REST API
async function fbGet(path) {
  return new Promise((resolve, reject) => {
    const url = `${FIREBASE_URL}/${path}.json${FIREBASE_SECRET ? '?auth=' + FIREBASE_SECRET : ''}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function fbSet(path, value) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(value);
    const urlStr = `${FIREBASE_URL}/${path}.json${FIREBASE_SECRET ? '?auth=' + FIREBASE_SECRET : ''}`;
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fbPush(path, value) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(value);
    const urlStr = `${FIREBASE_URL}/${path}.json${FIREBASE_SECRET ? '?auth=' + FIREBASE_SECRET : ''}`;
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fbDelete(path) {
  return new Promise((resolve, reject) => {
    const urlStr = `${FIREBASE_URL}/${path}.json${FIREBASE_SECRET ? '?auth=' + FIREBASE_SECRET : ''}`;
    const urlObj = new URL(urlStr);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'DELETE'
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(true));
    });
    req.on('error', reject);
    req.end();
  });
}

// ════════════════════════════════════════════
//  COMPTE PERMANENT (toujours présent)
// ════════════════════════════════════════════
const COMPTE_PERMANENT = {
  id:            'aboudev-mathwin-permanent',
  nom:           'Diomandé Abou Johan',
  email:         'daboujohan@gmail.com',
  password_hash: crypto.createHash('sha256').update('aboudev2026').digest('hex'),
  app_nom:       'MathWin CI',
  app_type:      'Jeu / Divertissement',
  description:   'Jeu de maths mobile CI',
  operateurs:    ['wave', 'orange', 'moov', 'mtn'],
  cle:           'vite_sk_a3981b7c21f1f8067f46cd9d',
  soldes:        { wave: 500000, orange: 500000, moov: 500000, mtn: 500000 },
  statut:        'actif',
  limite_jour:   10000,
  tx_count:      0,
  webhook_url:   '',
  domaines:      [],
  date_creation: '2026-05-30T00:00:00.000Z'
};

// Initialiser Firebase avec le compte permanent au démarrage
async function initFirebase() {
  try {
    const existing = await fbGet('developpeurs/aboudev-mathwin-permanent');
    if (!existing || existing === null) {
      await fbSet('developpeurs/aboudev-mathwin-permanent', COMPTE_PERMANENT);
      console.log('✅ Compte permanent créé dans Firebase');
    } else {
      console.log('✅ Compte permanent trouvé dans Firebase');
    }
  } catch(e) {
    console.log('⚠️ Firebase non accessible, mode local activé');
  }
}

// ════════════════════════════════════════════
//  RATE LIMITING (Sécurité)
// ════════════════════════════════════════════
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxReqs  = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return next();
  }

  const record = rateLimitMap.get(ip);
  if (now - record.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return next();
  }

  record.count++;
  if (record.count > maxReqs) {
    return res.status(429).json({
      statut: 'erreur', code: 429,
      message: `Trop de requêtes. Maximum ${maxReqs} par minute.`
    });
  }
  next();
}

app.use(rateLimit);

// ════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════
function genererCle() {
  return 'vite_sk_' + crypto.randomBytes(12).toString('hex');
}

function genererTxId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `VT-${date}-${rand}`;
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

const OPERATEURS = ['wave', 'orange', 'moov', 'mtn'];
const operateurValide = op => OPERATEURS.includes((op||'').toLowerCase());
const numeroValide    = num => /^0[0-9]{9}$/.test(num);

// Trouver développeur par clé dans Firebase
async function findDevByCle(cle) {
  const devs = await fbGet('developpeurs');
  if (!devs) return null;
  return Object.values(devs).find(d => d.cle === cle) || null;
}

async function findDevByEmail(email) {
  const devs = await fbGet('developpeurs');
  if (!devs) return null;
  return Object.values(devs).find(d => d.email === email) || null;
}

// ════════════════════════════════════════════
//  WEBHOOK — Notifier l'app du développeur
// ════════════════════════════════════════════
function envoyerWebhook(webhookUrl, payload) {
  if (!webhookUrl) return;
  try {
    const body = JSON.stringify(payload);
    const urlObj = new URL(webhookUrl);
    const mod    = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port:     urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path:     urlObj.pathname + urlObj.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'X-ViteAPI-Webhook': '1' }
    };
    const req = mod.request(options);
    req.on('error', () => {});
    req.write(body);
    req.end();
    console.log(`📡 Webhook envoyé → ${webhookUrl}`);
  } catch(e) {
    console.log('⚠️ Webhook erreur:', e.message);
  }
}

// ════════════════════════════════════════════
//  MIDDLEWARE AUTH
// ════════════════════════════════════════════
async function authCle(req, res, next) {
  const cle = req.headers['x-vite-key'] || req.body?.cle;
  if (!cle) {
    return res.status(401).json({ statut:'erreur', code:401, message:'Clé API manquante. Ajoutez x-vite-key dans vos headers.' });
  }
  const dev = await findDevByCle(cle);
  if (!dev) {
    return res.status(401).json({ statut:'erreur', code:401, message:'Clé API invalide ou expirée.' });
  }
  if (dev.statut !== 'actif') {
    return res.status(403).json({ statut:'erreur', code:403, message:'Compte développeur suspendu.' });
  }
  req.dev = dev;
  next();
}

// ════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ════════════════════════════════════════════

app.get('/', (req,res) => res.sendFile(path.join(__dirname,'index.html')));
app.get('/dashboard', (req,res) => res.sendFile(path.join(__dirname,'dashboard.html')));

// Statut API
app.get('/api/v1', (req,res) => res.json({
  api:'VITE API', version:'2.0.0',
  statut:'✅ En ligne',
  nouveautes: ['Firebase persistant', 'Sécurité renforcée', 'Webhook', 'Rate limiting'],
  environnement:'sandbox', operateurs:OPERATEURS,
  message:'VITE API v2.0 — Sandbox paiement mobile pour développeurs africains 🇨🇮'
}));

// ── Inscription
app.post('/api/v1/inscription', async (req,res) => {
  const { nom, email, password, app_nom, app_type, description, operateurs, webhook_url, domaines } = req.body;
  if (!nom || !email || !app_nom) {
    return res.status(400).json({ statut:'erreur', code:400, message:'Champs requis : nom, email, app_nom' });
  }
  const existant = await findDevByEmail(email);
  if (existant) {
    return res.status(400).json({ statut:'erreur', code:400, message:'Email déjà inscrit. Connectez-vous.' });
  }
  const cle = genererCle();
  const id  = 'dev-' + Date.now();
  const dev = {
    id, nom, email,
    password_hash: password ? hashPassword(password) : '',
    app_nom, app_type: app_type||'Autre',
    description: description||'',
    operateurs: operateurs||OPERATEURS,
    cle,
    soldes: { wave:50000, orange:50000, moov:50000, mtn:50000 },
    statut:'actif', limite_jour:1000, tx_count:0,
    webhook_url: webhook_url||'',
    domaines: domaines||[],
    date_creation: new Date().toISOString()
  };
  await fbSet(`developpeurs/${id}`, dev);
  res.status(201).json({
    statut:'succes', code:201,
    message:'🎉 Compte créé ! Bienvenue sur VITE API.',
    cle_api: cle, environnement:'sandbox',
    operateurs: dev.operateurs, limite_jour: dev.limite_jour,
    conseil:'Gardez votre clé API secrète.'
  });
});

// ── Connexion
app.post('/api/v1/connexion', async (req,res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ statut:'erreur', code:400, message:'Email requis.' });
  const dev = await findDevByEmail(email);
  if (!dev) return res.status(404).json({ statut:'erreur', code:404, message:'Aucun compte avec cet email.' });
  if (dev.password_hash && password && hashPassword(password) !== dev.password_hash) {
    return res.status(401).json({ statut:'erreur', code:401, message:'Mot de passe incorrect.' });
  }
  res.json({
    statut:'succes', nom:dev.nom, email:dev.email,
    app_nom:dev.app_nom, cle_api:dev.cle,
    statut_compte:dev.statut, date_creation:dev.date_creation
  });
});

// ════════════════════════════════════════════
//  ROUTES PROTÉGÉES
// ════════════════════════════════════════════

// ── 1. PAYER
app.post('/api/v1/payer', authCle, async (req,res) => {
  const { numero, montant, operateur, description, reference } = req.body;
  const dev = req.dev;

  if (!numero||!montant||!operateur)
    return res.status(400).json({ statut:'erreur', code:400, message:'Champs requis : numero, montant, operateur' });
  if (!numeroValide(numero))
    return res.status(400).json({ statut:'erreur', code:400, message:'Numéro invalide. Format : 0XXXXXXXXX' });
  if (!operateurValide(operateur))
    return res.status(400).json({ statut:'erreur', code:400, message:`Opérateur invalide. Valeurs : ${OPERATEURS.join(', ')}` });

  const montantNum = parseInt(montant);
  if (isNaN(montantNum)||montantNum<100)
    return res.status(400).json({ statut:'erreur', code:400, message:'Montant invalide. Minimum : 100 FCFA' });

  const solde = dev.soldes[operateur.toLowerCase()];
  if (solde < montantNum)
    return res.status(400).json({ statut:'erreur', code:400, message:`Solde sandbox insuffisant. Actuel : ${solde} FCFA`, solde_actuel:solde });

  // Mettre à jour solde dans Firebase
  const nouveauSolde = solde - montantNum;
  dev.soldes[operateur.toLowerCase()] = nouveauSolde;
  dev.tx_count = (dev.tx_count||0) + 1;
  await fbSet(`developpeurs/${dev.id}`, dev);

  // Créer transaction dans Firebase
  const tx = {
    transaction_id: genererTxId(),
    dev_id:         dev.id,
    dev_email:      dev.email,
    dev_app:        dev.app_nom,
    numero, montant:montantNum,
    operateur:      operateur.toLowerCase(),
    description:    description||'Paiement VITE API',
    reference:      reference||'REF-'+Date.now(),
    statut:         'succes',
    date:           new Date().toISOString(),
    environnement:  'sandbox'
  };
  await fbPush(`transactions/${dev.id}`, tx);

  // Envoyer webhook si configuré
  envoyerWebhook(dev.webhook_url, {
    event:          'paiement.succes',
    transaction_id: tx.transaction_id,
    numero, montant:montantNum,
    operateur:      operateur.toLowerCase(),
    reference:      tx.reference,
    date:           tx.date
  });

  res.json({
    statut:'succes', code:200,
    transaction_id:tx.transaction_id,
    numero:tx.numero, montant:tx.montant,
    operateur:tx.operateur, description:tx.description,
    reference:tx.reference, date:tx.date,
    solde_restant:nouveauSolde,
    message:`✅ Paiement ${operateur} de ${montantNum} FCFA effectué`,
    environnement:'sandbox'
  });
});

// ── 2. STATUT TRANSACTION
app.get('/api/v1/statut/:id', authCle, async (req,res) => {
  const { id } = req.params;
  const txsObj  = await fbGet(`transactions/${req.dev.id}`);
  if (!txsObj) return res.status(404).json({ statut:'erreur', code:404, message:'Aucune transaction trouvée.' });
  const tx = Object.values(txsObj).find(t => t.transaction_id === id);
  if (!tx) return res.status(404).json({ statut:'erreur', code:404, message:`Transaction ${id} introuvable.` });
  res.json({ statut:tx.statut, code:200, transaction_id:tx.transaction_id, numero:tx.numero, montant:tx.montant, operateur:tx.operateur, description:tx.description, reference:tx.reference, date:tx.date, environnement:tx.environnement });
});

// ── 3. SOLDE
app.get('/api/v1/solde', authCle, async (req,res) => {
  const dev = await findDevByCle(req.dev.cle);
  res.json({ statut:'succes', code:200, soldes:dev.soldes, devise:'FCFA', environnement:'sandbox', message:'Soldes fictifs pour tests.' });
});

// ── 4. TRANSACTIONS
app.get('/api/v1/transactions', authCle, async (req,res) => {
  const txsObj = await fbGet(`transactions/${req.dev.id}`);
  const txs = txsObj ? Object.values(txsObj).sort((a,b) => new Date(b.date)-new Date(a.date)) : [];
  res.json({ statut:'succes', code:200, total:txs.length, transactions:txs.map(t=>({ transaction_id:t.transaction_id, numero:t.numero, montant:t.montant, operateur:t.operateur, description:t.description, statut:t.statut, date:t.date })) });
});

// ── 5. RECHARGER
app.post('/api/v1/recharger', authCle, async (req,res) => {
  const { operateur, montant } = req.body;
  if (!operateur||!montant) return res.status(400).json({ statut:'erreur', code:400, message:'Champs requis : operateur, montant' });
  if (!operateurValide(operateur)) return res.status(400).json({ statut:'erreur', code:400, message:`Opérateur invalide.` });
  const montantNum = parseInt(montant);
  if (isNaN(montantNum)||montantNum<=0||montantNum>1000000) return res.status(400).json({ statut:'erreur', code:400, message:'Montant invalide. Max 1 000 000 FCFA.' });
  const dev = await findDevByCle(req.dev.cle);
  dev.soldes[operateur.toLowerCase()] += montantNum;
  await fbSet(`developpeurs/${dev.id}`, dev);
  res.json({ statut:'succes', code:200, operateur:operateur.toLowerCase(), montant_ajoute:montantNum, nouveau_solde:dev.soldes[operateur.toLowerCase()], devise:'FCFA', message:`✅ Solde ${operateur} rechargé de ${montantNum} FCFA` });
});

// ── 6. COMPTE
app.get('/api/v1/compte', authCle, async (req,res) => {
  const dev    = await findDevByCle(req.dev.cle);
  const txsObj = await fbGet(`transactions/${dev.id}`);
  const total  = txsObj ? Object.keys(txsObj).length : 0;
  res.json({ statut:'succes', nom:dev.nom, email:dev.email, app_nom:dev.app_nom, app_type:dev.app_type, operateurs:dev.operateurs, soldes:dev.soldes, tx_total:total, statut_compte:dev.statut, limite_jour:dev.limite_jour, webhook_url:dev.webhook_url||'', domaines:dev.domaines||[], date_creation:dev.date_creation, environnement:'sandbox' });
});

// ── 7. CONFIGURER WEBHOOK
app.post('/api/v1/webhook', authCle, async (req,res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ statut:'erreur', code:400, message:'URL webhook requise.' });
  const dev = await findDevByCle(req.dev.cle);
  dev.webhook_url = url;
  await fbSet(`developpeurs/${dev.id}`, dev);
  res.json({ statut:'succes', code:200, message:`✅ Webhook configuré → ${url}`, url });
});

// ── 8. CONFIGURER DOMAINES AUTORISÉS
app.post('/api/v1/domaines', authCle, async (req,res) => {
  const { domaines } = req.body;
  if (!Array.isArray(domaines)) return res.status(400).json({ statut:'erreur', code:400, message:'domaines doit être un tableau.' });
  const dev = await findDevByCle(req.dev.cle);
  dev.domaines = domaines;
  await fbSet(`developpeurs/${dev.id}`, dev);
  res.json({ statut:'succes', code:200, message:'✅ Domaines autorisés mis à jour.', domaines });
});

// ── 9. CHANGER MOT DE PASSE
app.post('/api/v1/password', authCle, async (req,res) => {
  const { ancien, nouveau } = req.body;
  if (!ancien||!nouveau) return res.status(400).json({ statut:'erreur', code:400, message:'Champs requis : ancien, nouveau' });
  const dev = await findDevByCle(req.dev.cle);
  if (dev.password_hash && hashPassword(ancien) !== dev.password_hash)
    return res.status(401).json({ statut:'erreur', code:401, message:'Ancien mot de passe incorrect.' });
  dev.password_hash = hashPassword(nouveau);
  await fbSet(`developpeurs/${dev.id}`, dev);
  res.json({ statut:'succes', code:200, message:'✅ Mot de passe mis à jour.' });
});

// ── 404
app.use((req,res) => res.status(404).json({ statut:'erreur', code:404, message:'Route introuvable. GET /api/v1 pour la doc.' }));

// ════════════════════════════════════════════
//  DÉMARRAGE
// ════════════════════════════════════════════
app.listen(PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║      VITE API v2.0 — ONLINE          ║
  ║  Firebase + Sécurité + Webhook       ║
  ║  Aboudev Labs © 2026  🇨🇮             ║
  ╠══════════════════════════════════════╣
  ║  URL  : http://localhost:${PORT}        ║
  ║  Mode : Sandbox                      ║
  ╚══════════════════════════════════════╝
  `);
  await initFirebase();
});
