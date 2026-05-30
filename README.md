# VITE API v1.0
## Sandbox de paiement mobile pour développeurs africains
**Aboudev Labs © 2026 — Côte d'Ivoire 🇨🇮**

---

## Installation (Termux ou Linux)

```bash
# 1. Décompresser le projet
unzip viteapi.zip
cd viteapi

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur
node server.js
```

Serveur disponible sur : http://localhost:3000

---

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | /api/v1/inscription | Créer un compte développeur |
| POST | /api/v1/connexion | Récupérer ses infos |
| POST | /api/v1/payer | Initier un paiement |
| GET | /api/v1/statut/:id | Vérifier une transaction |
| GET | /api/v1/solde | Voir les soldes sandbox |
| GET | /api/v1/transactions | Historique complet |
| POST | /api/v1/recharger | Recharger le solde sandbox |
| GET | /api/v1/compte | Infos du compte |

---

## Exemple d'intégration dans MathWin CI

```javascript
async function retirerArgent(numero, montant) {
  const res = await fetch('http://localhost:3000/api/v1/payer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-vite-key': 'VOTRE_CLE_API'
    },
    body: JSON.stringify({
      numero: numero,
      montant: montant,
      operateur: 'wave',
      description: 'Retrait MathWin CI'
    })
  });
  const data = await res.json();
  return data;
}
```

---

## Opérateurs supportés

- wave
- orange
- moov
- mtn

---

## Codes de réponse

- 200 → Succès
- 400 → Paramètre manquant ou invalide
- 401 → Clé API invalide
- 403 → Limite atteinte
- 404 → Introuvable
- 500 → Erreur serveur

---

Fait par Aboudev Labs — Côte d'Ivoire
