const chalk = require('chalk');
const ora = require('ora');
const Table = require('cli-table3');
const { apiCall } = require('../utils/api');
const { getApiKey } = require('../utils/config');
const { showError } = require('../../utils/templates');
const { formatCurrency, formatDate, formatStatus } = require('../utils/format');

async function transactionsCommand(options) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return showError('Pas connecté. Tapez: vite login');
    }

    const limit = parseInt(options.limit) || 10;
    const format = options.format || 'table';

    const spinner = ora(chalk.yellow('⏳ Chargement des transactions...')).start();

    const response = await apiCall('GET', `/api/v1/transactions?limit=${limit}`);

    spinner.stop();

    if (response.statut !== 'succes') {
      return showError(response.message);
    }

    if (!response.transactions || response.transactions.length === 0) {
      console.log(chalk.yellow('\n⚠️  Aucune transaction trouvée\n'));
      return;
    }

    if (format === 'json') {
      console.log(JSON.stringify(response.transactions, null, 2));
      return;
    }

    console.log(chalk.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║               HISTORIQUE DES TRANSACTIONS                     ║'));
    console.log(chalk.cyan('╠══════════════════════════════════════════════════════════════╣'));

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('Montant'),
        chalk.cyan('Opérateur'),
        chalk.cyan('Statut'),
        chalk.cyan('Date')
      ],
      style: {
        head: [],
        border: ['cyan'],
        compact: true
      },
      wordWrap: true,
      colWidths: [18, 12, 12, 10, 20]
    });

    response.transactions.forEach(tx => {
      table.push([
        chalk.gray(tx.transaction_id.substring(0, 17)),
        chalk.green(formatCurrency(tx.montant)),
        chalk.yellow(tx.operateur.toUpperCase()),
        formatStatus(tx.statut),
        chalk.gray(formatDate(tx.date).split(' ')[0])
      ]);
    });

    console.log(table.toString());
    console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));

    console.log(chalk.gray(`\n📊 Total: ${response.total} transactions`));
    console.log(chalk.gray(`💾 Affichage: ${Math.min(limit, response.transactions.length)} dernières\n`));

  } catch (error) {
    showError(error.message);
    process.exit(1);
  }
}

module.exports = transactionsCommand;
