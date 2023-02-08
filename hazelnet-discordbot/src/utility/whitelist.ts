import i18n from 'i18n';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, SelectMenuBuilder,
} from 'discord.js';
import { DiscordServer, ExternalAccount, Whitelist, WhitelistSignup, WhitelistSignupContainer } from './sharedtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from './hazelnetclient';
import cardanoaddress from './cardanoaddress';
import embedBuilder from './embedbuilder';
import datetime from './datetime';

export default {
  getDetailsText(discordServer: DiscordServer, whitelist: Whitelist, noCurrentNumbers: boolean = false): string {
    const locale = discordServer.getBotLanguage();
    const started = this.hasSignupStarted(whitelist);
    const ended = this.hasSignupEnded(whitelist);
    const running = started && !ended;
    const datePhrase = this.getDatePhrase(whitelist, ended, started, running);

    const datePart = i18n.__({ phrase: datePhrase, locale }, {
      signupAfterTimestamp: whitelist.signupAfter ? Math.floor(new Date(whitelist.signupAfter).getTime() / 1000) : 0,
      signupUntilTimestamp: whitelist.signupUntil ? Math.floor(new Date(whitelist.signupUntil).getTime() / 1000) : 0,
    } as any);
    const rolePart = this.getRolePart(locale, whitelist);

    const memberPhrase = this.getMemberPhrase(whitelist, noCurrentNumbers);
    const lockIcon = running && !whitelist.closed ? '🔓' : '🔒';
    const memberPart = i18n.__({ phrase: memberPhrase, locale }, { whitelist } as any);

    const launchDate = whitelist.launchDate ? i18n.__({ phrase: 'whitelist.list.whitelistLaunchDate', locale }, {
      launchDateTimestamp: Math.floor(new Date(whitelist.launchDate).getTime() / 1000),
    } as any) : '';
    const manualClose = whitelist.closed ? i18n.__({ phrase: 'whitelist.list.whitelistManuallyClosed', locale }) : '';

    return `${lockIcon} ${rolePart}${datePart} ${memberPart} ${launchDate} ${manualClose}`;
  },
  hasSignupEnded(whitelist: Whitelist): boolean {
    if (whitelist.signupUntil) {
      return new Date(whitelist.signupUntil) < new Date();
    }
    return false;
  },
  hasSignupStarted(whitelist: Whitelist): boolean {
    if (whitelist.signupAfter) {
      return new Date(whitelist.signupAfter) < new Date();
    }
    return true;
  },
  isSignupPaused(whitelist: Whitelist): boolean {
    return !!whitelist.closed;
  },
  getDatePhrase(whitelist: Whitelist, ended: boolean, started: boolean, running: boolean): string {
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
  getRolePart(locale: string, whitelist: Whitelist): string {
    let rolePart = i18n.__({ phrase: 'whitelist.list.whitelistNoRoleRequirement', locale });
    if (whitelist.requiredRoles?.length === 1) {
      rolePart = `${i18n.__({ phrase: 'whitelist.list.whitelistRoleRequirementSingle', locale }, whitelist.requiredRoles[0])} `;
    } else if (whitelist.requiredRoles?.length > 1) {
      rolePart = `${i18n.__({ phrase: 'whitelist.list.whitelistRoleRequirementMultiple', locale })}\n${whitelist.requiredRoles.map((requiredRole) => i18n.__({ phrase: 'whitelist.list.whitelistRoleEntry', locale }, requiredRole)).join('\n')}\n`;
    }
    if (whitelist.awardedRole) {
      rolePart += i18n.__({ phrase: 'whitelist.list.whitelistRoleAwarded', locale }, { whitelist } as any);
    }
    return rolePart;
  },
  getMemberPhrase(whitelist: Whitelist, noCurrentNumbers: boolean): string {
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
  async userQualifies(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction | AugmentedSelectMenuInteraction, whitelist: Whitelist, existingSignup: WhitelistSignupContainer | undefined): Promise<boolean> {
    if (!existingSignup) {
      if (!this.isSignupPaused(whitelist) && !this.hasSignupEnded(whitelist) && this.hasSignupStarted(whitelist) && !(whitelist.maxUsers > 0 && whitelist.currentUsers >= whitelist.maxUsers)) {
        return this.userHasRequiredRole(interaction, whitelist);
      }
    }
    return false;
  },
  async userHasRequiredRole(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction | AugmentedSelectMenuInteraction, whitelist: Whitelist): Promise<boolean> {
    if (whitelist.requiredRoles?.length) {
      const needsAnyOfRoleIds = whitelist.requiredRoles.map((role) => role.roleId);
      const { guild } = interaction;
      const member = await guild!.members.fetch(interaction.user.id);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return true;
  },
  async getQualifyText(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, whitelist: Whitelist, existingSignup: WhitelistSignup | undefined, includeFullAddress: boolean): Promise<string> {
    const isAddressBasedWhitelist = whitelist.type === 'CARDANO_ADDRESS';
    if (existingSignup) {
      const phrase = `whitelist.list.${isAddressBasedWhitelist ? 'youAreRegisteredWithAddress' : 'youAreRegistered'}`;
      return `\n${i18n.__({ phrase, locale: discordServer.getBotLanguage() }, {
        signupTime: Math.floor(new Date(existingSignup.signupTime).getTime() / 1000),
        address: includeFullAddress || !isAddressBasedWhitelist ? existingSignup.address : cardanoaddress.shorten(existingSignup.address!),
      } as any)}`;
    }
    if (this.hasSignupEnded(whitelist) || !this.hasSignupStarted(whitelist) || (whitelist.maxUsers > 0 && whitelist.currentUsers >= whitelist.maxUsers)) {
      return ''; // Signup closed
    }
    const hasRequiredRole = await this.userHasRequiredRole(interaction, whitelist);
    if (hasRequiredRole) {
      return `\n${i18n.__({ phrase: 'whitelist.list.youQualify', locale: discordServer.getBotLanguage() }, { whitelist } as any)}`;
    }
    return `\n${i18n.__({ phrase: 'whitelist.list.youDontQualify', locale: discordServer.getBotLanguage() })}`;
  },
  async getExistingSignups(externalAccount: ExternalAccount, whitelists: Whitelist[], interaction: AugmentedCommandInteraction | AugmentedButtonInteraction | AugmentedSelectMenuInteraction): Promise<(WhitelistSignupContainer | undefined)[]> {
    if (externalAccount) {
      const signupsPromise = whitelists.map((whitelist) => interaction.client.services.discordserver.getWhitelistSignupsForExternalAccount(interaction.guild!.id, whitelist.id, externalAccount.id));
      return Promise.all(signupsPromise.map((p) => p.catch(() => undefined)));
    }
    return [];
  },
  isValidName(whitelistName: string) {
    const whitelistNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return whitelistNameRegex.test(whitelistName);
  },
  async getGuildNames(whitelists: Whitelist[], interaction: AugmentedCommandInteraction) {
    const guildNameMap = {} as { [index: string]: string };
    const sharedServers = whitelists
      .filter((whitelist) => +whitelist.sharedWithServer > 0)
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
  getSignupComponents(discordServer: DiscordServer, whitelist: Whitelist) {
    const locale = discordServer.getBotLanguage();
    const buttons = [
      new ButtonBuilder()
        .setCustomId(`whitelist/register/widgetsignup-${whitelist.id}`)
        .setLabel(i18n.__({ phrase: 'whitelist.register.registerButton', locale }))
        .setStyle(ButtonStyle.Primary),
    ];
    if (whitelist.type === 'CARDANO_ADDRESS') {
      buttons.push(new ButtonBuilder()
        .setCustomId('verify/add/widgetverify')
        .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
        .setStyle(ButtonStyle.Secondary));
    }
    return [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons)];
  },
  getWhitelistErrorEmbed(discordServer: DiscordServer, commandTitle: string, commandId: string, signupAfter: string | null, signupUntil: string | null, launchDate: string | null, logoUrl: string | null) {
    const locale = discordServer.getBotLanguage();
    if (signupAfter && !datetime.isValidISOTimestamp(signupAfter)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'signup-start', value: signupAfter }), commandId);
    }
    if (signupUntil && !datetime.isValidISOTimestamp(signupUntil)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'signup-end', value: signupUntil }), commandId);
    }
    if (launchDate && !datetime.isValidISOTimestamp(launchDate)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'launch-date', value: `${launchDate}` }), commandId);
    }
    if (logoUrl && !/(https:(?:\/\/)?)/i.test(logoUrl)) {
      return embedBuilder.buildForAdmin(discordServer, commandTitle, i18n.__({ phrase: 'errors.invalidHttpsUrl', locale }, { parameter: 'logo-url', value: logoUrl }), commandId);
    }
    return null;
  },
  getDiscordWhitelistListParts(discordServer: DiscordServer, whitelists: Whitelist[], customId: string, selectionPhrase: string) {
    const locale = discordServer.getBotLanguage();
    const sortedWhitelists = whitelists.sort((whitelistA, whitelistB) => whitelistA.displayName.localeCompare(whitelistB.displayName));
    const components = this.getWhitelistChoices(locale, sortedWhitelists, customId, selectionPhrase);
    return { components };
  },
  getWhitelistChoices(locale: string, whitelists: Whitelist[], customId: string, selectionPhrase: string) {
    if (whitelists.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(i18n.__({ phrase: selectionPhrase, locale }))
            .addOptions(whitelists.map((whitelist) => ({
              label: i18n.__({ phrase: 'configure.whitelist.list.adminName', locale }, { whitelist } as any),
              value: `configure-whitelist-${whitelist.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
};
