const i18n = require('i18n');
const datetime = require('./datetime');

module.exports = {
  getDetailsText(discordServer, whitelist) {
    const locale = discordServer.getBotLanguage();
    let datePhrase = 'whitelist.list.openWhitelist';
    const started = this.hasSignupStarted(whitelist);
    const ended = this.hasSignupEnded(whitelist);
    const running = started && !ended;
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

    const signupAfterFormatted = datetime.getUTCDateFormatted(whitelist, 'signupAfter');
    const signupUntilFormatted = datetime.getUTCDateFormatted(whitelist, 'signupUntil');
    const datePart = i18n.__({ phrase: datePhrase, locale }, { signupAfterFormatted, signupUntilFormatted });
    const roleAndDatePart = i18n.__({ phrase: 'whitelist.list.whitelistRoleRequirement', locale }, { whitelist, datePart });

    let memberPhrase = 'whitelist.list.whitelistMembersNoLimit';
    if (whitelist.maxUsers > 0) {
      memberPhrase = 'whitelist.list.whitelistMembersLimit';
      if (whitelist.currentUsers >= whitelist.maxUsers) {
        memberPhrase = 'whitelist.list.whitelistMembersLimitReached';
      }
    }
    const lockIcon = running && !whitelist.closed ? '🔓' : '🔒';
    const memberPart = i18n.__({ phrase: memberPhrase, locale }, { whitelist });

    const manualClose = whitelist.closed ? i18n.__({ phrase: 'whitelist.list.whitelistManuallyClosed', locale }) : '';

    return `${lockIcon} ${roleAndDatePart} ${memberPart} ${manualClose}`;
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
  async getQualifyText(interaction, discordServer, whitelist, existingSignup, includeAddress) {
    if (existingSignup) {
      const phrase = includeAddress ? 'whitelist.list.youAreRegisteredWithAddress' : 'whitelist.list.youAreRegistered';
      return `\n${i18n.__({ phrase, locale: discordServer.getBotLanguage() }, {
        signupTime: new Date(existingSignup.signupTime).toISOString().replace(/\.[0-9]{3}Z/, '').replace('T', ' '),
        address: existingSignup.address,
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
      const signupsPromise = discordServer.whitelists.map(async (whitelist) => interaction.client.services.discordserver.getWhitelistRegistration(interaction.guild.id, whitelist.id, externalAccount.id));
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
};
