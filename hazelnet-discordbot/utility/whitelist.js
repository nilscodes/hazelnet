const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('./embedbuilder');
const datetime = require('./datetime');
const cardanoaddress = require('./cardanoaddress');

module.exports = {
  getDetailsText(discordServer, whitelist, noCurrentNumbers) {
    const locale = discordServer.getBotLanguage();
    const started = this.hasSignupStarted(whitelist);
    const ended = this.hasSignupEnded(whitelist);
    const running = started && !ended;
    const datePhrase = this.getDatePhrase(whitelist, ended, started, running);

    const datePart = i18n.__({ phrase: datePhrase, locale }, {
      signupAfterTimestamp: whitelist.signupAfter ? Math.floor(new Date(whitelist.signupAfter).getTime() / 1000) : 0,
      signupUntilTimestamp: whitelist.signupUntil ? Math.floor(new Date(whitelist.signupUntil).getTime() / 1000) : 0,
    });
    const roleAndDatePart = i18n.__({ phrase: 'whitelist.list.whitelistRoleRequirement', locale }, { whitelist, datePart });

    const memberPhrase = this.getMemberPhrase(whitelist, noCurrentNumbers);
    const lockIcon = running && !whitelist.closed ? '🔓' : '🔒';
    const memberPart = i18n.__({ phrase: memberPhrase, locale }, { whitelist });

    const launchDate = whitelist.launchDate ? i18n.__({ phrase: 'whitelist.list.whitelistLaunchDate', locale }, {
      launchDateTimestamp: Math.floor(new Date(whitelist.launchDate).getTime() / 1000),
    }) : '';
    const manualClose = whitelist.closed ? i18n.__({ phrase: 'whitelist.list.whitelistManuallyClosed', locale }) : '';

    return `${lockIcon} ${roleAndDatePart} ${memberPart} ${launchDate} ${manualClose}`;
  },
  hasSignupEnded(whitelist) {
    if (whitelist.signupUntil) {
      return new Date(whitelist.signupUntil) < new Date();
    }
    return false;
  },
  hasSignupStarted(whitelist) {
    if (whitelist.signupAfter) {
      return new Date(whitelist.signupAfter) < new Date();
    }
    return true;
  },
  isSignupPaused(whitelist) {
    return !!whitelist.closed;
  },
  getDatePhrase(whitelist, ended, started, running) {
    let datePhrase = 'whitelist.list.openWhitelist';
    if (whitelist.signupUntil && !whitelist.signupAfter) {
      datePhrase = 'whitelist.list.whitelistWithEndDateOpen';
      if (ended) {
        datePhrase = 'whitelist.list.whitelistWithEndDateClosed';
      }
    } else if (whitelist.signupAfter && !whitelist.signupUntil) {
      datePhrase = 'whitelist.list.whitelistWithStartDateOpen';
      if (!started) {
        datePhrase = 'whitelist.list.whitelistWithStartDateClosed';
      }
    } else if (whitelist.signupAfter && whitelist.signupUntil) {
      datePhrase = 'whitelist.list.whitelistWithStartDateClosedAndOpenEndDate';
      if (running) {
        datePhrase = 'whitelist.list.whitelistWithStartDateOpenAndOpenEndDate';
      } else if (ended) {
        datePhrase = 'whitelist.list.whitelistWithStartDateOpenAndClosedEndDate';
      }
    }
    return datePhrase;
  },
  getMemberPhrase(whitelist, noCurrentNumbers) {
    let memberPhrase = 'whitelist.list.whitelistMembersNoLimit';
    if (whitelist.maxUsers > 0) {
      if (noCurrentNumbers) {
        memberPhrase = 'whitelist.list.whitelistMembersLimitNoCurrent';
      } else {
        memberPhrase = 'whitelist.list.whitelistMembersLimit';
        if (whitelist.currentUsers >= whitelist.maxUsers) {
          memberPhrase = 'whitelist.list.whitelistMembersLimitReached';
        }
      }
    }
    return memberPhrase;
  },
  async userQualifies(interaction, whitelist, existingSignup) {
    if (!existingSignup) {
      if (!this.isSignupPaused(whitelist) && !this.hasSignupEnded(whitelist) && this.hasSignupStarted(whitelist) && !(whitelist.maxUsers > 0 && whitelist.currentUsers >= whitelist.maxUsers)) {
        const { guild } = interaction;
        const guildRole = await guild.roles.fetch(whitelist.requiredRoleId);
        if (guildRole) {
          const member = await guild.members.fetch(interaction.user.id);
          const hasRequiredRole = await member.roles.cache.some((role) => role.id === whitelist.requiredRoleId);
          return hasRequiredRole;
        }
      }
    }
    return false;
  },
  async getQualifyText(interaction, discordServer, whitelist, existingSignup, includeFullAddress) {
    if (existingSignup) {
      const phrase = 'whitelist.list.youAreRegisteredWithAddress';
      return `\n${i18n.__({ phrase, locale: discordServer.getBotLanguage() }, {
        signupTime: Math.floor(new Date(existingSignup.signupTime).getTime() / 1000),
        address: includeFullAddress ? existingSignup.address : cardanoaddress.shorten(existingSignup.address),
      })}`;
    }
    if (this.hasSignupEnded(whitelist) || !this.hasSignupStarted(whitelist) || (whitelist.maxUsers > 0 && whitelist.currentUsers >= whitelist.maxUsers)) {
      return ''; // Signup closed
    }
    const { guild } = interaction;
    const guildRole = await guild.roles.fetch(whitelist.requiredRoleId);
    if (!guildRole) {
      return ''; // Role does not exist
    }
    const member = await guild.members.fetch(interaction.user.id);
    const hasRequiredRole = await member.roles.cache.some((role) => role.id === whitelist.requiredRoleId);
    if (hasRequiredRole) {
      return `\n${i18n.__({ phrase: 'whitelist.list.youQualify', locale: discordServer.getBotLanguage() }, { whitelist })}`;
    }
    return `\n${i18n.__({ phrase: 'whitelist.list.youDontQualify', locale: discordServer.getBotLanguage() })}`;
  },
  async getExistingSignups(externalAccount, discordServer, interaction) {
    if (externalAccount) {
      const signupsPromise = discordServer.whitelists.map((whitelist) => interaction.client.services.discordserver.getWhitelistSignupsForExternalAccount(interaction.guild.id, whitelist.id, externalAccount.id));
      return Promise.all(signupsPromise.map((p) => p.catch(() => undefined)));
    }
    return [];
  },
  isValidName(whitelistName) {
    const whitelistNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return whitelistNameRegex.test(whitelistName);
  },
  async getGuildNames(discordServer, interaction) {
    const guildNameMap = {};
    const sharedServers = discordServer.whitelists
      .filter((whitelist) => whitelist.sharedWithServer > 0)
      .map((whitelist) => whitelist.sharedWithServer);
    for (let i = 0; i < sharedServers.length; i += 1) {
      const serverId = sharedServers[i];
      if (!guildNameMap[serverId]) {
        // eslint-disable-next-line no-await-in-loop
        const discordServerWithId = await interaction.client.services.discordserver.getDiscordServerByInternalId(serverId);
        guildNameMap[serverId] = discordServerWithId.guildName;
      }
    }
    return guildNameMap;
  },
  getSignupComponents(discordServer, whitelist) {
    const locale = discordServer.getBotLanguage();
    return [new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`whitelist/register/widgetsignup-${whitelist.id}`)
          .setLabel(i18n.__({ phrase: 'whitelist.register.registerButton', locale }))
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('verify/add/widgetverify')
          .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
          .setStyle('SECONDARY'),
      ),
    ];
  },
  getWhitelistErrorEmbed(discordServer, commandTitle, commandId, signupAfter, signupUntil, launchDate, logoUrl) {
    const locale = discordServer.getBotLanguage();
    if (signupAfter && !datetime.isValidISOTimestamp(signupAfter)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'signup-start', value: signupAfter }), commandId);
    }
    if (signupUntil && !datetime.isValidISOTimestamp(signupUntil)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'signup-end', value: signupUntil }), commandId);
    }
    if (launchDate && !datetime.isValidISOTimestamp(launchDate)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'launch-date', value: launchDate }), commandId);
    }
    if (logoUrl && !/(https:(?:\/\/)?)/i.test(logoUrl)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidHttpsUrl', locale }, { parameter: 'logo-url', value: logoUrl }), commandId);
    }
    return null;
  },
};
