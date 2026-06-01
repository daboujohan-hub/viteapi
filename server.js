// ══════════════════════════════════════════════════════
//  VITE API v2.1 — Sandbox Paiement Mobile
//  Aboudev Labs © 2026
//  Nouveautés : Firebase + Sécurité + Webhook + Email
// ══════════════════════════════════════════════════════

const express   = require('express');
const cors      = require('cors');
const crypto    = require('crypto');
const path      = require('path');
const https     = require('https');
const http      = require('http');

// ════════════════════════════════════════════
//  RESEND EMAIL CONFIG
// ════════════════════════════════════════════
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_WgWTPBgJ_A1ih1priSHGV3gU4RqfXHXxq';
const EMAIL_FROM     = 'VITE API <onboarding@resend.dev>';

async function envoyerEmail(to, subject, html) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ from: EMAIL_FROM, to, subject, html });
    const options = {
      hostname: 'api.resend.com',
      path:     '/emails',
      method:   'POST',
      headers:  {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📧 Email envoyé → ${to}`);
        resolve(true);
      });
    });
    req.on('error', (e) => {
      console.log('⚠️ Email erreur:', e.message);
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

function emailBienvenue(dev) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06080f;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:2rem;font-weight:900;color:#fff;letter-spacing:-1px">
        VITE<span style="color:#00e676"> API</span>
      </div>
      <div style="font-size:.75rem;color:#7986ab;margin-top:4px">Sandbox Paiement Mobile • Aboudev Labs 🇨🇮</div>
    </div>

    <!-- Card principale -->
    <div style="background:#0d1120;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:28px;margin-bottom:20px">
      <div style="font-size:1.4rem;margin-bottom:6px">🎉</div>
      <h1 style="color:#fff;font-size:1.2rem;margin:0 0 8px">Bienvenue sur VITE API, ${dev.nom} !</h1>
      <p style="color:#7986ab;font-size:.82rem;line-height:1.6;margin:0 0 24px">
        Votre compte développeur est activé. Vous pouvez maintenant intégrer les paiements Wave, Orange Money, Moov et MTN dans votre application.
      </p>

      <!-- Clé API -->
      <div style="background:rgba(0,230,118,.07);border:1px solid rgba(0,230,118,.2);border-radius:10px;padding:16px;margin-bottom:20px">
        <div style="font-size:.65rem;font-weight:800;color:#00e676;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">🔑 Votre clé API</div>
        <div style="font-family:'Courier New',monospace;font-size:.8rem;color:#00e676;word-break:break-all">${dev.cle}</div>
        <div style="font-size:.65rem;color:#7986ab;margin-top:8px">⚠️ Gardez cette clé secrète. Ne la partagez jamais publiquement.</div>
      </div>

      <!-- Infos compte -->
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:.7rem;color:#7986ab">Application</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-align:right">
            <span style="font-size:.78rem;color:#fff;font-weight:700">${dev.app_nom}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:.7rem;color:#7986ab">Opérateurs</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-align:right">
            <span style="font-size:.78rem;color:#fff;font-weight:700">Wave • Orange • Moov • MTN</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="font-size:.7rem;color:#7986ab">Solde sandbox</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);text-align:right">
            <span style="font-size:.78rem;color:#00e676;font-weight:700">50 000 FCFA × 4 opérateurs</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0">
            <span style="font-size:.7rem;color:#7986ab">Environnement</span>
          </td>
          <td style="padding:8px 0;text-align:right">
            <span style="font-size:.78rem;color:#ffc400;font-weight:700">🧪 Sandbox</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Exemple code -->
    <div style="background:#0d1120;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px;margin-bottom:20px">
      <div style="font-size:.7rem;font-weight:800;color:#7986ab;text-transform:uppercase;margin-bottom:12px">💻 Exemple d'intégration</div>
      <pre style="background:#06080f;border-radius:8px;padding:14px;font-size:.68rem;color:#c3e88d;overflow-x:auto;margin:0">fetch('https://viteapi.onrender.com/api/v1/payer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-vite-key': '${dev.cle}'
  },
  body: JSON.stringify({
    numero:    '0707123456',
    montant:   500,
    operateur: 'wave',
    description: 'Paiement ${dev.app_nom}'
  })
})</pre>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px">
      <a href="https://viteapi.onrender.com/dashboard" style="display:inline-block;background:#00e676;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:900;font-size:.85rem">
        📊 Accéder à mon dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#7986ab;font-size:.65rem;line-height:1.8">
      <div>VITE API v2.1 — Sandbox de paiement mobile</div>
      <div>Fait avec ❤️ par <strong style="color:#00e676">Aboudev Labs</strong> • Côte d'Ivoire 🇨🇮</div>
      <div style="margin-top:8px">
        <a href="https://viteapi.onrender.com" style="color:#00e676;text-decoration:none">viteapi.onrender.com</a>
      </div>
    </div>

  </div>
</body>
</html>`;
}

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
  api:'VITE API', version:'2.1.0',
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

  // Envoyer email de bienvenue
  envoyerEmail(
    email,
    "🎉 Bienvenue sur VITE API — Votre clé API est prête",
    emailBienvenue(dev)
  );

  res.status(201).json({
    statut:'succes', code:201,
    message:'🎉 Compte créé ! Vérifiez votre email.',
    cle_api: cle, environnement:'sandbox',
    operateurs: dev.operateurs, limite_jour: dev.limite_jour,
    conseil:'Un email de confirmation a été envoyé à ' + email
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
  ║      VITE API v2.1 — ONLINE          ║
  ║  Firebase + Sécurité + Webhook       ║
  ║  Aboudev Labs © 2026  🇨🇮             ║
  ╠══════════════════════════════════════╣
  ║  URL  : http://localhost:${PORT}        ║
  ║  Mode : Sandbox                      ║
  ╚══════════════════════════════════════╝
  `);
  await initFirebase();
});

// Gestion erreurs globales
process.on('uncaughtException', (err) => { console.log('⚠️ Erreur:', err.message); });
process.on('unhandledRejection', (reason) => { console.log('⚠️ Promise rejetée:', reason?.message || reason); });
