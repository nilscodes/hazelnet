/* eslint-disable global-require */
export default {
  discordserver: require('./services/discordserver'),
  globalsettings: require('./services/globalsettings'),
  accounts: require('./services/accounts'),
  externalaccounts: require('./services/externalaccounts'),
  pings: require('./services/pings'),
  verifications: require('./services/verifications'),
  cardanoinfo: require('./services/cardanoinfo'),
  claimlists: require('./services/claimlists'),
  snapshots: require('./services/snapshots'),
};
