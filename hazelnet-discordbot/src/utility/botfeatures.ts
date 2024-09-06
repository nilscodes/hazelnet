import i18n from 'i18n';
import { DiscordServer } from '@vibrantnet/core';

export default {
  getFeatureOptions(discordServer: DiscordServer) {
    const locale = discordServer.getBotLanguage();
    // TODO can get additional features enabled for specific server via settings
    return [{
      label: i18n.__({ phrase: 'features.stakepoolTitle', locale }),
      description: i18n.__({ phrase: 'features.stakepool', locale }),
      value: 'stakepool',
      emoji: { name: '🌊' },
    }, {
      label: i18n.__({ phrase: 'features.tokenTitle', locale }),
      description: i18n.__({ phrase: 'features.token', locale }),
      value: 'token',
      emoji: { name: '📃' },
    }, {
      label: i18n.__({ phrase: 'features.pollTitle', locale }),
      description: i18n.__({ phrase: 'features.poll', locale }),
      value: 'poll',
      emoji: { name: '✏' },
    }, {
      label: i18n.__({ phrase: 'features.pollVoteaireTitle', locale }),
      description: i18n.__({ phrase: 'features.pollvoteaire', locale }),
      value: 'pollvoteaire',
      emoji: { name: '☑' },
    }, {
      label: i18n.__({ phrase: 'features.giveawayTitle', locale }),
      description: i18n.__({ phrase: 'features.giveaway', locale }),
      value: 'giveaway',
      emoji: { name: '🎁' },
    // }, {
    //   label: i18n.__({ phrase: 'features.quizzesTitle', locale }),
    //   description: i18n.__({ phrase: 'features.quiz', locale }),
    //   value: 'quiz',
    //   emoji: { name: '❔' },
    }, {
      label: i18n.__({ phrase: 'features.whitelistTitle', locale }),
      description: i18n.__({ phrase: 'features.whitelist', locale }),
      value: 'whitelist',
      emoji: { name: '🤍' },
    }, {
      label: i18n.__({ phrase: 'features.marketplaceTitle', locale }),
      description: i18n.__({ phrase: 'features.marketplace', locale }),
      value: 'marketplace',
      emoji: { name: '🛒' },
    }, {
      label: i18n.__({ phrase: 'features.governanceTitle', locale }),
      description: i18n.__({ phrase: 'features.governance', locale }),
      value: 'governance',
      emoji: { name: '🏛️' },
    }];
  },
};
