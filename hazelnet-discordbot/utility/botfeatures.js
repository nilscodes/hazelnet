const i18n = require('i18n');

module.exports = {
  getFeatureOptions(discordServer) {
    const locale = discordServer.getBotLanguage();
    return [{
      label: i18n.__({ phrase: 'features.stakepoolTitle', locale }),
      description: i18n.__({ phrase: 'features.stakepool', locale }),
      value: 'stakepool',
      emoji: { id: null, name: '🌊' },
    }, {
      label: i18n.__({ phrase: 'features.tokenTitle', locale }),
      description: i18n.__({ phrase: 'features.token', locale }),
      value: 'token',
      emoji: { id: null, name: '📃' },
    }, {
      label: i18n.__({ phrase: 'features.pollTitle', locale }),
      description: i18n.__({ phrase: 'features.poll', locale }),
      value: 'poll',
      emoji: { id: null, name: '✏' },
    }, {
      label: i18n.__({ phrase: 'features.pollVoteaireTitle', locale }),
      description: i18n.__({ phrase: 'features.pollvoteaire', locale }),
      value: 'pollvoteaire',
      emoji: { id: null, name: '☑' },
    }, {
      label: i18n.__({ phrase: 'features.whitelistTitle', locale }),
      description: i18n.__({ phrase: 'features.whitelist', locale }),
      value: 'whitelist',
      emoji: { id: null, name: '🤍' },
    }, {
      label: i18n.__({ phrase: 'features.marketplaceTitle', locale }),
      description: i18n.__({ phrase: 'features.marketplace', locale }),
      value: 'marketplace',
      emoji: { id: null, name: '🛒' },
    }];
  },
};
