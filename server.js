const express = require('express');
const cors = require('cors');
const uuid = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────
//  MIDDLEWARE
// ──────────────────────────────────────

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ──────────────────────────────────────
//  MOCK DATA
// ──────────────────────────────────────

const users = new Map();
const transactions = new Map();
const sessions = new Map();

// Utilisateur de test
users.set('test@viteapi.com', {
  id: 'user_001',
  email: 'test@viteapi.com',
  password: 'password123',
  nom: 'Test Developer',
  app_nom: 'MathWin CI',
  app_type: 'SaaS',
  statut_compte: 'actif',
  cle_api: 'vite_sk_a3981b7c21f1f8067f46cd9d',
  operateurs: ['wave', 'orange', 'moov', 'mtn'],
  soldes: {
    wave: 50000,
    orange: 25000,
    moov: 15000,
    mtn: 10000
  },
  limite_jour: 1000000,
  tx_total: 0,
  date_creation: new Date('2026-07-20').toISOString()
});

// ──────────────────────────────────────
//  ROUTES PUBLIQUES
// ──────────────────────────────────────

// Health Check
app.get('/health', (req, res) => {
  res.json({
    statut: 'succes',
    message: 'VITE API is running',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/v1/connexion', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Email et mot de passe requis'
    });
  }

  const user = users.get(email);

  if (!user || user.password !== password) {
    return res.status(401).json({
      statut: 'erreur',
      message: 'Email ou mot de passe incorrect'
    });
  }

  res.json({
    statut: 'succes',
    cle_api: user.cle_api,
    nom: user.nom,
    email: user.email,
    app_nom: user.app_nom,
    statut_compte: user.statut_compte,
    date_creation: user.date_creation
  });
});

// ──────────────────────────────────────
//  MIDDLEWARE AUTHENTIFICATION
// ──────────────────────────────────────

function authenticate(req, res, next) {
  const apiKey = req.headers['x-vite-key'];

  if (!apiKey) {
    return res.status(401).json({
      statut: 'erreur',
      message: 'Clé API manquante'
    });
  }

  // Chercher l'utilisateur par clé API
  let currentUser = null;
  for (let user of users.values()) {
    if (user.cle_api === apiKey) {
      currentUser = user;
      break;
    }
  }

  if (!currentUser) {
    return res.status(401).json({
      statut: 'erreur',
      message: 'Clé API invalide'
    });
  }

  req.user = currentUser;
  next();
}

// ──────────────────────────────────────
//  ROUTES PROTÉGÉES
// ──────────────────────────────────────

// Paiement
app.post('/api/v1/payer', authenticate, (req, res) => {
  const { numero, montant, operateur, description } = req.body;

  // Validation
  if (!numero || !montant || !operateur) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Données manquantes (numero, montant, operateur)'
    });
  }

  if (!/^0[0-9]{9}$/.test(numero)) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Numéro invalide (format: 0XXXXXXXXX)'
    });
  }

  if (montant <= 0 || montant > 1000000) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Montant invalide (1-1000000 FCFA)'
    });
  }

  if (!['wave', 'orange', 'moov', 'mtn'].includes(operateur.toLowerCase())) {
    return res.status(400).json({
      statut: 'erreur',
      message: 'Opérateur invalide'
    });
  }

  // Vérifier solde
  if (req.user.soldes[operateur] < montant) {
    return res.status(400).json({
      statut: 'erreur',
      message: `Solde insuffisant pour ${operateur}`
    });
  }

  // Créer transaction
  const transactionId = `VT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const transaction = {
    transaction_id: transactionId,
    user_id: req.user.id,
    numero,
    montant,
    operateur: operateur.toLowerCase(),
    description: description || 'Paiement VITE API',
    statut: 'succes',
    reference: uuid.v4().substring(0, 8).toUpperCase(),
    date: new Date().toISOString()
  };

  transactions.set(transactionId, transaction);

  // Mettre à jour solde
  req.user.soldes[operateur] -= montant;
  req.user.tx_total += 1;

  res.json({
    statut: 'succes',
    transaction_id: transactionId,
    montant,
    operateur,
    numero,
    solde_restant: req.user.soldes[operateur],
    reference: transaction.reference,
    date: transaction.date
  });
});

// Soldes
app.get('/api/v1/solde', authenticate, (req, res) => {
  res.json({
    statut: 'succes',
    soldes: req.user.soldes,
    devise: 'FCFA',
    mise_a_jour: new Date().toISOString()
  });
});

// Transactions
app.get('/api/v1/transactions', authenticate, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const userTransactions = Array.from(transactions.values())
    .filter(tx => tx.user_id === req.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  res.json({
    statut: 'succes',
    transactions: userTransactions,
    total: Array.from(transactions.values()).filter(tx => tx.user_id === req.user.id).length
  });
});

// Statut transaction
app.get('/api/v1/statut/:id', authenticate, (req, res) => {
  const transaction = transactions.get(req.params.id);

  if (!transaction || transaction.user_id !== req.user.id) {
    return res.status(404).json({
      statut: 'erreur',
      message: 'Transaction non trouvée'
    });
  }

  res.json({
    statut: 'succes',
    ...transaction
  });
});

// Compte
app.get('/api/v1/compte', authenticate, (req, res) => {
  res.json({
    statut: 'succes',
    nom: req.user.nom,
    email: req.user.email,
    app_nom: req.user.app_nom,
    app_type: req.user.app_type,
    statut_compte: req.user.statut_compte,
    operateurs: req.user.operateurs,
    soldes: req.user.soldes,
    tx_total: req.user.tx_total,
    limite_jour: req.user.limite_jour,
    date_creation: req.user.date_creation
  });
});

// ──────────────────────────────────────
//  GESTION ERREURS
// ──────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    statut: 'erreur',
    message: 'Route non trouvée',
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    statut: 'erreur',
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ──────────────────────────────────────
//  DÉMARRAGE
// ──────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     VITE API Server v3.0.0             ║
║     Running on port ${PORT}              ║
║     Mode: ${process.env.NODE_ENV || 'development'}          ║
╚════════════════════════════════════════╝

📍 API: http://localhost:${PORT}/api/v1
🏥 Health: http://localhost:${PORT}/health

Test credentials:
  Email: test@viteapi.com
  Password: password123
  API Key: vite_sk_a3981b7c21f1f8067f46cd9d
  `);
});

module.exports = app;
