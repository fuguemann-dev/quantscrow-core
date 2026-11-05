const MetaApi = require('metaapi-cloud-sdk').default;
const token = process.env.META_API_TOKEN;
const api = new MetaApi(token);

async function conectarNuevaCuentaMT5({ login, password, server, nombreInversor }) {
  try {
    const account = await api.accountApi.createAccount({
      name: `Quantscrow - ${nombreInversor}`,
      type: 'cloud',
      login: login.toString(),
      password: password,
      server: server,
      platform: 'mt5',
      application: 'QuantscrowCore'
    });

    await account.deploy();
    return { exito: true, metaAccountId: account.id };
  } catch (error) {
    return { exito: false, error: error.message };
  }
}

module.exports = { conectarNuevaCuentaMT5 };
