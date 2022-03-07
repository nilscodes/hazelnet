/* eslint-disable global-require */
module.exports = {
  discordserver: require('./services/discordserver'),
  globalsettings: require('./services/globalsettings'),
  externalaccounts: require('./services/externalaccounts'),
  verifications: require('./services/verifications'),
  cardanoinfo: require('./services/cardanoinfo'),
  claimlists: require('./services/claimlists'),
  snapshots: require('./services/snapshots'),
};
