const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const {
  Permissions, MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const embedbuilder = require('../utility/embedbuilder');
const commandregistration = require('../utility/commandregistration');
const commandpermissions = require('../utility/commandpermissions');
const botfeatures = require('../utility/botfeatures');

module.exports = {
  getCommandData() {
    return new SlashCommandBuilder()
      .setName('start')
      .setDescription('Start the setup of your HAZELnet.io bot.');
  },
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const serverWhitelistString = await interaction.client.services.globalsettings.getGlobalSetting('WHITELISTED_GUILDS');
    const serverWhitelist = serverWhitelistString?.split(',') ?? [];
    if (serverWhitelist.length && !serverWhitelist.includes(interaction.guild.id)) {
      await this.editReplyWithNotWhitelistedMessage(interaction, discordServer);
    } else if (interaction.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      await this.editReplyWithSetupMessage(interaction);
    } else {
      await interaction.editReply({ content: i18n.__({ phrase: 'errors.permissionDeniedChanges', locale: discordServer.getBotLanguage() }), ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId) {
      await interaction.deferUpdate();
      switch (interaction.customId) {
        case 'start/language':
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'BOT_LANGUAGE', interaction.values[0]);
          break;
        case 'start/adminRole':
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'ADMIN_ROLES', interaction.values[0]);
          break;
        case 'start/userRole':
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'USER_ROLES', interaction.values[0]);
          break;
        case 'start/features':
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'ENABLED_COMMAND_TAGS', interaction.values.join(','));
          break;
        default:
          break;
      }
      await this.editReplyWithSetupMessage(interaction);
    }
  },
  async buildSetupMessage(discordServer, guild) {
    const components = [];
    const useLocale = discordServer.getBotLanguage();
    const message = i18n.__({ phrase: 'start.configureMessage', locale: useLocale });
    const languageOptions = this.getLanguageOptions(discordServer);
    let selectedLanguage = '';
    let selectedAdminRoles = '';
    let selectedUserRoles = '';
    let selectedFeatures = '';
    let disabled = false;
    if (!discordServer.settings?.BOT_LANGUAGE || !discordServer.settings?.BOT_LANGUAGE.length) {
      disabled = true;
      components.push(new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('start/language')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseLanguage', locale: useLocale }))
            .addOptions(languageOptions),
        ));
    } else {
      selectedLanguage = `\n\n${i18n.__({ phrase: 'start.selectedLanguage', locale: useLocale }, { language: languageOptions.find((lang) => lang.value === useLocale).label })}`;
    }
    const guildRoles = await guild.roles.fetch();
    const roleOptions = guildRoles.map((role) => ({ label: role.name, value: role.id })).slice(0, 25); // Can have max 25 options
    const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
    if (!adminRoleIds.length) {
      disabled = true;
      components.push(new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('start/adminRole')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseAdminRole', locale: useLocale }))
            .addOptions(roleOptions),
        ));
    } else {
      selectedAdminRoles = `\n\n${i18n.__({ phrase: 'start.selectedAdminRoles', locale: useLocale })}\n`;
      selectedAdminRoles += adminRoleIds.map((roleId) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale: useLocale }, { roleId }))).join('\n');
    }
    const userRoleIds = (discordServer?.settings?.USER_ROLES?.split(',')) ?? [];
    if (!userRoleIds.length) {
      disabled = true;
      components.push(new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('start/userRole')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseUserRole', locale: useLocale }))
            .addOptions(roleOptions),
        ));
    } else {
      selectedUserRoles = `\n\n${i18n.__({ phrase: 'start.selectedUserRoles', locale: useLocale })}\n`;
      selectedUserRoles += userRoleIds.map((roleId) => (i18n.__({ phrase: 'configure.useraccess.list.userEntry', locale: useLocale }, { roleId }))).join('\n');
    }
    if (!discordServer.settings?.ENABLED_COMMAND_TAGS || !discordServer.settings?.ENABLED_COMMAND_TAGS.length) {
      disabled = true;
      const featureOptions = botfeatures.getFeatureOptions(discordServer);
      components.push(new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('start/features')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseFeatures', locale: useLocale }))
            .addOptions(featureOptions)
            .setMinValues(1)
            .setMaxValues(featureOptions.length),
        ));
    } else {
      const selectedCommandTagsPhrases = discordServer.settings.ENABLED_COMMAND_TAGS.split(',').map((commandTag) => (`features.${commandTag}`));
      const selectedFeatureList = selectedCommandTagsPhrases.map((phrase) => (i18n.__({ phrase: 'start.selectedFeatureItem', locale: useLocale }, { feature: i18n.__({ phrase, locale: useLocale }) }))).join('\n');
      selectedFeatures = `\n\n${i18n.__({ phrase: 'start.selectedFeatures', locale: useLocale }, { selectedFeatureList })}`;
    }
    components.push(new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('start/complete')
          .setDisabled(disabled)
          .setLabel(i18n.__({ phrase: 'start.finishSetupButton', locale: useLocale }))
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('start/reset')
          .setLabel(i18n.__({ phrase: 'start.resetSetupButton', locale: useLocale }))
          .setStyle('SECONDARY'),
      ));
    const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.welcomeTitle', locale: useLocale }), message, 'start', [
      { name: i18n.__({ phrase: 'start.configureLanguageTitle', locale: useLocale }), value: i18n.__({ phrase: 'start.configureLanguageText', locale: useLocale }) + selectedLanguage },
      { name: i18n.__({ phrase: 'start.configureAdminRoleTitle', locale: useLocale }), value: i18n.__({ phrase: 'start.configureAdminRoleText', locale: useLocale }) + selectedAdminRoles },
      { name: i18n.__({ phrase: 'start.configureUserRoleTitle', locale: useLocale }), value: i18n.__({ phrase: 'start.configureUserRoleText', locale: useLocale }) + selectedUserRoles },
      { name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale: useLocale }), value: i18n.__({ phrase: 'start.configureFeaturesText', locale: useLocale }) + selectedFeatures },
    ]);
    return {
      components,
      embed,
    };
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    if (interaction.customId === 'start/complete') {
      this.completeSetup(interaction, discordServer);
    } else if (interaction.customId === 'start/reset') {
      this.resetSetup(interaction);
    }
  },
  async completeSetup(interaction, discordServer) {
    await interaction.deferReply({ ephemeral: true });
    if (this.isSetupComplete(discordServer)) {
      const useLocale = discordServer.getBotLanguage();
      await commandregistration.registerMainCommands(discordServer.settings.ENABLED_COMMAND_TAGS.split(','), interaction.client, interaction.guild.id);
      await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);
      let successMessage = i18n.__({ phrase: 'start.setupCompleteMessage', locale: useLocale });
      if (await this.isBotLackingRequiredPermissions(interaction)) {
        successMessage = `\n\n${i18n.__({ phrase: 'start.setupRoleWarningMessage', locale: useLocale })}`;
      }
      const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.completeTitle', locale: useLocale }), successMessage, 'start');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } else {
      await this.editReplyWithSetupMessage(interaction);
    }
  },
  isSetupComplete(discordServer) {
    return discordServer.settings?.BOT_LANGUAGE?.length
     && discordServer.settings?.ADMIN_ROLES?.length
     && discordServer.settings?.USER_ROLES?.length
     && discordServer.settings?.ENABLED_COMMAND_TAGS?.length;
  },
  async isBotLackingRequiredPermissions(interaction) {
    const botMember = await interaction.guild.members.fetch(interaction.applicationId);
    const hasManageRolesPermission = botMember.roles.cache.some((role) => role.permissions.has(Permissions.FLAGS.MANAGE_ROLES));
    const hasSendMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(Permissions.FLAGS.SEND_MESSAGES));
    const hasManageMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES));
    const hasReadMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(Permissions.FLAGS.READ_MESSAGE_HISTORY));
    return !(hasManageRolesPermission && hasSendMessagesPermission && hasManageMessagesPermission && hasReadMessagesPermission);
  },
  async resetSetup(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild.id, 'BOT_LANGUAGE');
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild.id, 'ADMIN_ROLES');
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild.id, 'USER_ROLES');
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild.id, 'ENABLED_COMMAND_TAGS');
    await this.editReplyWithSetupMessage(interaction);
  },
  async editReplyWithNotWhitelistedMessage(interaction, discordServer) {
    const useLocale = discordServer.getBotLanguage();
    const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.welcomeTitle', locale: useLocale }), i18n.__({ phrase: 'errors.notWhitelisted', locale: useLocale }), 'start');
    const components = [new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel(i18n.__({ phrase: 'about.twitter.bot', locale: useLocale }))
          .setURL('https://twitter.com/HAZELnet_io')
          .setStyle('LINK'),
        new MessageButton()
          .setLabel(i18n.__({ phrase: 'about.twitter.author', locale: useLocale }))
          .setURL('https://twitter.com/NilsCodes')
          .setStyle('LINK'),
      )];
    await interaction.editReply({ embeds: [embed], components, ephemeral: true });
  },
  async editReplyWithSetupMessage(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const guild = await interaction.client.guilds.fetch(discordServer.guildId);
    const { components, embed } = await this.buildSetupMessage(discordServer, guild);
    await interaction.editReply({ components, embeds: [embed], ephemeral: true });
  },
  getLanguageOptions(discordServer) {
    const useLocale = discordServer.getBotLanguage();
    return [{
      label: i18n.__({ phrase: 'languages.en', locale: useLocale }),
      value: 'en',
    }, {
      label: i18n.__({ phrase: 'languages.de', locale: useLocale }),
      value: 'de',
    }];
  },
};
