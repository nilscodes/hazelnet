import {
  PermissionsBitField, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, SlashCommandBuilder, MessageActionRowComponentBuilder, SelectMenuComponentOptionData, Guild, ButtonStyle,
} from 'discord.js';
import i18n from 'i18n';
import { DiscordServer } from '@vibrantnet/core';
import { BotCommand } from '../utility/commandtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../utility/hazelnetclient';
import commandbase from '../utility/commandbase';
import embedbuilder from '../utility/embedbuilder';
import botfeatures from '../utility/botfeatures';
import commandregistration from '../utility/commandregistration';
import { EmbedAndComponents } from '../utility/sharedtypes';

interface StartCommand extends BotCommand {
  completeSetup(interaction: AugmentedButtonInteraction, discordServer: DiscordServer): void
  resetSetup(interaction: AugmentedButtonInteraction): void
  buildSetupMessage(discordServer: DiscordServer, guild: Guild): Promise<EmbedAndComponents>
  isSetupComplete(discordServer: DiscordServer): boolean
  isBotLackingRequiredPermissions(interaction: AugmentedButtonInteraction): Promise<boolean>
  editReplyWithNotWhitelistedMessage(interaction: AugmentedCommandInteraction, discordServer: DiscordServer): void
  editReplyWithSetupMessage(interaction: AugmentedCommandInteraction | AugmentedSelectMenuInteraction | AugmentedButtonInteraction): void
  getLanguageOptions(discordServer: DiscordServer): SelectMenuComponentOptionData[]
}

export default <StartCommand> {
  getCommandData() {
    return new SlashCommandBuilder()
      .setName('start')
      .setDescription('Start the setup of your VibrantNet.io bot.');
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const serverWhitelistString = await interaction.client.services.globalsettings.getGlobalSetting('WHITELISTED_GUILDS');
    const serverWhitelist = serverWhitelistString?.split(',') ?? [];
    if (serverWhitelist.length && !serverWhitelist.includes(interaction.guild!.id)) {
      await this.editReplyWithNotWhitelistedMessage(interaction, discordServer);
    } else if ((interaction.member!.permissions as Readonly<PermissionsBitField>).has(PermissionsBitField.Flags.ManageGuild)) {
      await this.editReplyWithSetupMessage(interaction);
    } else {
      await interaction.editReply({ content: i18n.__({ phrase: 'errors.permissionDeniedChanges', locale: discordServer.getBotLanguage() }) });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      if (interaction.customId) {
        await interaction.deferUpdate();
        switch (interaction.customId) {
          case 'start/language':
            await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'BOT_LANGUAGE', interaction.values[0]);
            break;
          case 'start/adminRole':
            await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ADMIN_ROLES', interaction.values[0]);
            break;
          case 'start/features':
            await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ENABLED_COMMAND_TAGS', interaction.values.join(','));
            break;
          default:
            break;
        }
        await this.editReplyWithSetupMessage(interaction);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.followUp({ content: 'Error while configuring bot via the /start command. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
  async buildSetupMessage(discordServer, guild) {
    const components = [];
    const locale = discordServer.getBotLanguage();
    const message = i18n.__({ phrase: 'start.configureMessage', locale });
    const languageOptions = this.getLanguageOptions(discordServer);
    let selectedLanguage = '';
    let selectedAdminRoles = '';
    let selectedFeatures = '';
    let disabled = false;
    if (!discordServer.settings?.BOT_LANGUAGE || !discordServer.settings?.BOT_LANGUAGE.length) {
      disabled = true;
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('start/language')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseLanguage', locale }))
            .addOptions(languageOptions),
        ));
    } else {
      selectedLanguage = `\n\n${i18n.__({ phrase: 'start.selectedLanguage', locale }, { language: languageOptions.find((lang) => lang.value === locale)!.label })}`;
    }
    const guildRoles = await guild.roles.fetch();
    const roleOptions = guildRoles.map((role) => ({ label: role.name, value: role.id })).slice(0, 25); // Can have max 25 options
    const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
    if (!adminRoleIds.length) {
      disabled = true;
      components.push(new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('start/adminRole')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseAdminRole', locale }))
            .addOptions(roleOptions),
        ));
    } else {
      selectedAdminRoles = `\n\n${i18n.__({ phrase: 'start.selectedAdminRoles', locale })}\n`;
      selectedAdminRoles += adminRoleIds.map((roleId) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale }, { roleId }))).join('\n');
    }
    if (!discordServer.settings?.ENABLED_COMMAND_TAGS || !discordServer.settings?.ENABLED_COMMAND_TAGS.length) {
      disabled = true;
      const featureOptions = botfeatures.getFeatureOptions(discordServer);
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('start/features')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseFeatures', locale }))
            .addOptions(featureOptions)
            .setMinValues(1)
            .setMaxValues(featureOptions.length),
        ));
    } else {
      const selectedCommandTagsPhrases = discordServer.settings.ENABLED_COMMAND_TAGS.split(',').map((commandTag: string) => (`features.${commandTag}`)) as string[];
      const selectedFeatureList = selectedCommandTagsPhrases.map((phrase) => (i18n.__({ phrase: 'start.selectedFeatureItem', locale }, { feature: i18n.__({ phrase, locale }) }))).join('\n');
      selectedFeatures = `\n\n${i18n.__({ phrase: 'start.selectedFeatures', locale }, { selectedFeatureList })}`;
    }
    components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('start/complete')
          .setDisabled(disabled)
          .setLabel(i18n.__({ phrase: 'start.finishSetupButton', locale }))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('start/reset')
          .setLabel(i18n.__({ phrase: 'start.resetSetupButton', locale }))
          .setStyle(ButtonStyle.Secondary),
      ));
    const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.welcomeTitle', locale }), message, 'start', [
      { name: i18n.__({ phrase: 'start.configureLanguageTitle', locale }), value: i18n.__({ phrase: 'start.configureLanguageText', locale }) + selectedLanguage },
      { name: i18n.__({ phrase: 'start.configureAdminRoleTitle', locale }), value: i18n.__({ phrase: 'start.configureAdminRoleText', locale }) + selectedAdminRoles },
      { name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale }), value: i18n.__({ phrase: 'start.configureFeaturesText', locale }) + selectedFeatures },
    ]);
    return {
      components,
      embed,
    };
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    if (interaction.customId === 'start/complete') {
      this.completeSetup(interaction, discordServer);
    } else if (interaction.customId === 'start/reset') {
      this.resetSetup(interaction);
    }
  },
  async completeSetup(interaction, discordServer) {
    try {
      if (this.isSetupComplete(discordServer)) {
        await interaction.update({ components: [] });
        const locale = discordServer.getBotLanguage();
        await commandregistration.registerMainCommands(discordServer.settings.ENABLED_COMMAND_TAGS.split(','), interaction.client, interaction.guild!.id);
        // await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);

        // Update the bot name if applicable
        if (discordServer?.settings?.BOT_NAME) {
          const botObject = await interaction.guild!.members.fetch(interaction.client.application!.id);
          await botObject.setNickname(discordServer.settings.BOT_NAME);
        }

        // Turn the bot back on if it was turned off
        if (!discordServer.active) {
          await interaction.client.services.discordserver.updateDiscordServer(interaction.guild!.id, { active: true });
        }

        let successMessage = i18n.__({ phrase: 'start.setupCompleteMessage', locale });
        if (await this.isBotLackingRequiredPermissions(interaction)) {
          successMessage = i18n.__({ phrase: 'start.setupRoleWarningMessage', locale });
        }
        const nextStepsFields = [{
          name: i18n.__({ phrase: 'start.nextStepsTitle', locale }),
          value: i18n.__({ phrase: 'start.nextStepsDetails', locale }),
        }];
        const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.completeTitle', locale }), successMessage, 'start', nextStepsFields);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.deferReply({ ephemeral: true });
        await this.editReplyWithSetupMessage(interaction);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.followUp({ content: 'Error while configuring bot via the /start command. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
  isSetupComplete(discordServer) {
    return discordServer.settings?.BOT_LANGUAGE?.length > 0
     && discordServer.settings?.ADMIN_ROLES?.length > 0
     && discordServer.settings?.ENABLED_COMMAND_TAGS?.length > 0;
  },
  async isBotLackingRequiredPermissions(interaction) {
    const botMember = await interaction.guild!.members.fetch(interaction.applicationId);
    const hasManageRolesPermission = botMember.roles.cache.some((role) => role.permissions.has(PermissionsBitField.Flags.ManageRoles));
    const hasSendMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(PermissionsBitField.Flags.SendMessages));
    const hasManageMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(PermissionsBitField.Flags.ManageMessages));
    const hasReadMessagesPermission = botMember.roles.cache.some((role) => role.permissions.has(PermissionsBitField.Flags.ReadMessageHistory));
    return !(hasManageRolesPermission && hasSendMessagesPermission && hasManageMessagesPermission && hasReadMessagesPermission);
  },
  async resetSetup(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'BOT_LANGUAGE');
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'ADMIN_ROLES');
    await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'ENABLED_COMMAND_TAGS');
    await this.editReplyWithSetupMessage(interaction);
  },
  async editReplyWithNotWhitelistedMessage(interaction, discordServer) {
    const useLocale = discordServer.getBotLanguage();
    const embed = embedbuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'start.welcomeTitle', locale: useLocale }), i18n.__({ phrase: 'errors.notWhitelisted', locale: useLocale }), 'start');
    const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'about.twitter.bot', locale: useLocale }))
          .setURL('https://twitter.com/VibrantNet_io')
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'about.twitter.author', locale: useLocale }))
          .setURL('https://twitter.com/NilsCodes')
          .setStyle(ButtonStyle.Link),
      )];
    await interaction.editReply({ embeds: [embed], components });
  },
  async editReplyWithSetupMessage(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const guild = await interaction.client.guilds.fetch(discordServer.guildId);
    const { components, embed } = await this.buildSetupMessage(discordServer, guild);
    await interaction.editReply({ components, embeds: [embed] });
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
