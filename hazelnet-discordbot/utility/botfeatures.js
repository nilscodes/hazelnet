const i18n = require('i18n');

module.exports = {
  getFeatureOptions(discordServer) {
    const useLocale = discordServer.getBotLanguage();
    return [{
      label: i18n.__({ phrase: 'features.stakepoolTitle', locale: useLocale }),
      description: i18n.__({ phrase: 'features.stakepool', locale: useLocale }),
      value: 'stakepool',
      emoji: { id: null, name: '🌊' },
    }, {
      label: i18n.__({ phrase: 'features.tokenTitle', locale: useLocale }),
      description: i18n.__({ phrase: 'features.token', locale: useLocale }),
      value: 'token',
      emoji: { id: null, name: '📃' },
    }, {
      label: i18n.__({ phrase: 'features.pollTitle', locale: useLocale }),
      description: i18n.__({ phrase: 'features.poll', locale: useLocale }),
      value: 'poll',
      emoji: { id: null, name: '✏' },
    }, {
      label: i18n.__({ phrase: 'features.whitelistTitle', locale: useLocale }),
      description: i18n.__({ phrase: 'features.whitelist', locale: useLocale }),
      value: 'whitelist',
      emoji: { id: null, name: '🤍' },
    }];
  },
};
