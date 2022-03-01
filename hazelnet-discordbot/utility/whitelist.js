const i18n = require('i18n');

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

    const signupAfterFormatted = this.getSignupDateFormatted(whitelist, 'signupAfter');
    const signupUntilFormatted = this.getSignupDateFormatted(whitelist, 'signupUntil');
    const datePart = i18n.__({ phrase: datePhrase, locale }, { signupAfterFormatted, signupUntilFormatted });
    const roleAndDatePart = i18n.__({ phrase: 'whitelist.list.whitelistRoleRequirement', locale }, { whitelist, datePart });

    let memberPhrase = 'whitelist.list.whitelistMembersNoLimit';
    if (whitelist.maxUsers > 0) {
      memberPhrase = 'whitelist.list.whitelistMembersLimit';
      if (whitelist.currentUsers >= whitelist.maxUsers) {
        memberPhrase = 'whitelist.list.whitelistMembersLimitReached';
      }
    }
    const lockIcon = running ? '🔓' : '🔒';
    const memberPart = i18n.__({ phrase: memberPhrase, locale }, { whitelist });

    return `${lockIcon} ${roleAndDatePart} ${memberPart}`;
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
  async userQualifies(interaction, whitelist, existingSignup) {
    if (!existingSignup) {
      if (!this.hasSignupEnded(whitelist) && this.hasSignupStarted(whitelist) && !(whitelist.maxUsers > 0 && whitelist.currentUsers >= whitelist.maxUsers)) {
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
  getSignupDateFormatted(whitelist, dateType) {
    if (whitelist[dateType]) {
      return new Date(whitelist[dateType]).toISOString().replace('.000Z', '').replace('T', ' ');
    }
    return '';
  },
  isValidName(whitelistName) {
    const whitelistNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return whitelistNameRegex.test(whitelistName);
  },
};
