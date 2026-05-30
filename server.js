// ══════════════════════════════════════════
//  VITE API v1.0 — Sandbox Paiement Mobile
//  Aboudev Labs © 2026
//  Lancer : node server.js
// ══════════════════════════════════════════

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ── Helpers DB ──────────────────────────────
function readDB() {
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch(e) { return { developpeurs: [], transactions: [] }; }
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ── Générer clé API ──────────────────────────
function genererCle() {
  return 'vite_sk_' + crypto.randomBytes(12).toString('hex');
}

// ── Générer ID transaction ───────────────────
function genererTxId() {
  const now  = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `VT-${date}-${rand}`;
}

// ── Valider opérateur ────────────────────────
const OPERATEURS = ['wave', 'orange', 'moov', 'mtn'];

function operateurValide(op) {
  return OPERATEURS.includes((op || '').toLowerCase());
}

// ── Valider numéro CI ────────────────────────
function numeroValide(num) {
  return /^0[0-9]{9}$/.test(num);
}

// ── Middleware auth clé API ──────────────────
function authCle(req, res, next) {
  const cle = req.headers['x-vite-key'] || req.body?.cle;
  if (!cle) {
    return res.status(401).json({
      statut: 'erreur',
      code: 401,
      message: 'Clé API manquante. Ajoutez x-vite-key dans vos headers.'
    });
  }
  const db  = readDB();
  const dev = db.developpeurs.find(d => d.cle === cle);
  if (!dev) {
    return res.status(401).json({
      statut: 'erreur',
      code: 401,
      message: 'Clé API invalide ou expirée.'
    });
  }
  if (dev.statut !== 'actif') {
    return res.status(403).json({
      statut: 'erreur',
      code: 403,
      message: 'Compte développeur suspendu.'
    });
  }
  req.dev = dev;
  next();
}

// ════════════════════════════════════════════
//  ROUTES PUBLIQUES
// ════════════════════════════════════════════

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// ── Statut API
app.get('/api/v1', (req, res) => {
  res.json({
    api: 'VITE API',
    version: '1.0.0',
    statut: '✅ En ligne',
    environnement: 'sandbox',
    operateurs: OPERATEURS,
    documentation: 'https://viteapi.ci/docs',
    message: 'Bienvenue sur VITE API — Sandbox de paiement mobile pour développeurs africains.'
  });
});

// ── Inscription développeur
app.post('/api/v1/inscription', (req, res) => {
  const { nom, email, app_nom, app_type, description, operateurs } = req.body;

  if (!nom || !email || !app_nom) {
    return res.status(400).json({
      statut: 'erreur',
      code: 400,
      message: 'Champs obligatoires : nom, email, app_nom'
    });
  }

  const db = readDB();

  // Vérifier email déjà inscrit
  if (db.developpeurs.find(d => d.email === email)) {
    return res.status(400).json({
      statut: 'erreur',
      code: 400,
      message: 'Cet email est déjà inscrit. Connectez-vous au dashboard.'
    });
  }

  const cle = genererCle();
  const dev = {
    id:           crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    nom,
    email,
    app_nom,
    app_type:     app_type || 'Autre',
    description:  description || '',
    operateurs:   operateurs || OPERATEURS,
    cle,
    soldes: {
      wave:   50000,
      orange: 50000,
      moov:   50000,
      mtn:    50000
    },
    statut:         'actif',
    limite_jour:    1000,
    tx_count:       0,
    date_creation:  new Date().toISOString()
  };

  db.developpeurs.push(dev);
  writeDB(db);

  res.status(201).json({
    statut:        'succes',
    code:          201,
    message:       '🎉 Compte créé avec succès ! Bienvenue sur VITE API.',
    cle_api:       cle,
    environnement: 'sandbox',
    operateurs:    dev.operateurs,
    limite_jour:   dev.limite_jour,
    date_creation: dev.date_creation,
    conseil:       'Gardez votre clé API secrète. Ne la partagez jamais publiquement.'
  });
});

// ── Connexion (récupérer sa clé)
app.post('/api/v1/connexion', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ statut: 'erreur', code: 400, message: 'Email requis.' });
  }
  const db  = readDB();
  const dev = db.developpeurs.find(d => d.email === email);
  if (!dev) {
    return res.status(404).json({ statut: 'erreur', code: 404, message: 'Aucun compte trouvé avec cet email.' });
  }
  res.json({
    statut:      'succes',
    nom:         dev.nom,
    app_nom:     dev.app_nom,
    cle_api:     dev.cle,
    statut_compte: dev.statut,
    date_creation: dev.date_creation
  });
});

// ════════════════════════════════════════════
//  ROUTES PROTÉGÉES (clé API obligatoire)
// ════════════════════════════════════════════

// ── 1. INITIER UN PAIEMENT
app.post('/api/v1/payer', authCle, (req, res) => {
  const { numero, montant, operateur, description, reference } = req.body;
  const dev = req.dev;

  // Validation champs
  if (!numero || !montant || !operateur) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Champs obligatoires : numero, montant, operateur'
    });
  }

  if (!numeroValide(numero)) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Numéro invalide. Format attendu : 0XXXXXXXXX (10 chiffres)'
    });
  }

  if (!operateurValide(operateur)) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: `Opérateur invalide. Valeurs acceptées : ${OPERATEURS.join(', ')}`
    });
  }

  const montantNum = parseInt(montant);
  if (isNaN(montantNum) || montantNum <= 0) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Le montant doit être un nombre positif.'
    });
  }

  if (montantNum < 100) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Montant minimum : 100 FCFA'
    });
  }

  // Vérifier solde fictif
  const db     = readDB();
  const devDB  = db.developpeurs.find(d => d.cle === dev.cle);
  const solde  = devDB.soldes[operateur.toLowerCase()];

  if (solde < montantNum) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: `Solde sandbox insuffisant pour ${operateur}. Rechargez via POST /recharger`,
      solde_actuel: solde
    });
  }

  // Déduire le solde fictif
  devDB.soldes[operateur.toLowerCase()] -= montantNum;
  devDB.tx_count += 1;

  // Créer la transaction
  const tx = {
    transaction_id: genererTxId(),
    dev_email:      devDB.email,
    dev_app:        devDB.app_nom,
    numero,
    montant:        montantNum,
    operateur:      operateur.toLowerCase(),
    description:    description || 'Paiement VITE API',
    reference:      reference   || 'REF-' + Date.now(),
    statut:         'succes',
    date:           new Date().toISOString(),
    environnement:  'sandbox'
  };

  db.transactions.push(tx);
  writeDB(db);

  res.json({
    statut:         'succes',
    code:           200,
    transaction_id: tx.transaction_id,
    numero:         tx.numero,
    montant:        tx.montant,
    operateur:      tx.operateur,
    description:    tx.description,
    reference:      tx.reference,
    date:           tx.date,
    solde_restant:  devDB.soldes[operateur.toLowerCase()],
    message:        `✅ Paiement ${operateur} de ${montantNum} FCFA effectué avec succès`,
    environnement:  'sandbox'
  });
});

// ── 2. VÉRIFIER UNE TRANSACTION
app.get('/api/v1/statut/:id', authCle, (req, res) => {
  const { id } = req.params;
  const db     = readDB();
  const tx     = db.transactions.find(t => t.transaction_id === id && t.dev_email === req.dev.email);

  if (!tx) {
    return res.status(404).json({
      statut: 'erreur', code: 404,
      message: `Transaction ${id} introuvable.`
    });
  }

  res.json({
    statut:         tx.statut,
    code:           200,
    transaction_id: tx.transaction_id,
    numero:         tx.numero,
    montant:        tx.montant,
    operateur:      tx.operateur,
    description:    tx.description,
    reference:      tx.reference,
    date:           tx.date,
    environnement:  tx.environnement
  });
});

// ── 3. VOIR LE SOLDE SANDBOX
app.get('/api/v1/solde', authCle, (req, res) => {
  const db    = readDB();
  const devDB = db.developpeurs.find(d => d.cle === req.dev.cle);

  res.json({
    statut:        'succes',
    code:          200,
    soldes:        devDB.soldes,
    devise:        'FCFA',
    environnement: 'sandbox',
    message:       'Ce sont des soldes fictifs pour tests uniquement.'
  });
});

// ── 4. HISTORIQUE DES TRANSACTIONS
app.get('/api/v1/transactions', authCle, (req, res) => {
  const db  = readDB();
  const txs = db.transactions
    .filter(t => t.dev_email === req.dev.email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    statut:       'succes',
    code:         200,
    total:        txs.length,
    transactions: txs.map(t => ({
      transaction_id: t.transaction_id,
      numero:         t.numero,
      montant:        t.montant,
      operateur:      t.operateur,
      description:    t.description,
      statut:         t.statut,
      date:           t.date
    }))
  });
});

// ── 5. RECHARGER LE SOLDE SANDBOX
app.post('/api/v1/recharger', authCle, (req, res) => {
  const { operateur, montant } = req.body;

  if (!operateur || !montant) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Champs requis : operateur, montant'
    });
  }

  if (!operateurValide(operateur)) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: `Opérateur invalide. Valeurs : ${OPERATEURS.join(', ')}`
    });
  }

  const montantNum = parseInt(montant);
  if (isNaN(montantNum) || montantNum <= 0 || montantNum > 1000000) {
    return res.status(400).json({
      statut: 'erreur', code: 400,
      message: 'Montant invalide. Max : 1 000 000 FCFA par recharge.'
    });
  }

  const db    = readDB();
  const devDB = db.developpeurs.find(d => d.cle === req.dev.cle);
  devDB.soldes[operateur.toLowerCase()] += montantNum;
  writeDB(db);

  res.json({
    statut:        'succes',
    code:          200,
    operateur:     operateur.toLowerCase(),
    montant_ajoute: montantNum,
    nouveau_solde: devDB.soldes[operateur.toLowerCase()],
    devise:        'FCFA',
    message:       `✅ Solde ${operateur} rechargé de ${montantNum} FCFA`
  });
});

// ── 6. INFOS DU COMPTE DÉVELOPPEUR
app.get('/api/v1/compte', authCle, (req, res) => {
  const db    = readDB();
  const devDB = db.developpeurs.find(d => d.cle === req.dev.cle);
  const txs   = db.transactions.filter(t => t.dev_email === devDB.email);

  res.json({
    statut:        'succes',
    nom:           devDB.nom,
    email:         devDB.email,
    app_nom:       devDB.app_nom,
    app_type:      devDB.app_type,
    operateurs:    devDB.operateurs,
    soldes:        devDB.soldes,
    tx_total:      txs.length,
    statut_compte: devDB.statut,
    limite_jour:   devDB.limite_jour,
    date_creation: devDB.date_creation,
    environnement: 'sandbox'
  });
});

// ── 404 Global
app.use((req, res) => {
  res.status(404).json({
    statut:  'erreur',
    code:    404,
    message: 'Route introuvable. Consultez la documentation : GET /api/v1'
  });
});

// ── Démarrage serveur
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════╗
  ║      VITE API v1.0 — ONLINE      ║
  ║  Aboudev Labs © 2026             ║
  ╠══════════════════════════════════╣
  ║  URL  : http://localhost:${PORT}    ║
  ║  Mode : Sandbox (test)           ║
  ╚══════════════════════════════════╝
  `);
});
