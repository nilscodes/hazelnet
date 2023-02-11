import { SlashCommandBuilder } from 'discord.js';
import i18n from 'i18n';
import { BotCommand } from '../utility/commandtypes';
import embedBuilder from '../utility/embedbuilder';
import commandbase from '../utility/commandbase';
import commandPermissions from '../utility/commandpermissions';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('help', locale);
    return new SlashCommandBuilder()
      .setName('help')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const isBotAdmin = await commandPermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
      const enabledFeatures = discordServer.settings.ENABLED_COMMAND_TAGS.split(',');
      // const isBotUser = await commandPermissions.isBotUser(discordServer, interaction.client, interaction.user.id);

      const helpTexts = [];

      helpTexts.push('✅ **/verify**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify', locale })}\n`);
      helpTexts.push('🌊 **/info**');
      helpTexts.push(`${i18n.__({ phrase: 'help.stakepoolCommands.info', locale })}\n`);
      helpTexts.push('🧑 **/profile**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.profile', locale })}\n`);
      if (enabledFeatures.includes('token')) {
        helpTexts.push('📃 **/policyid**');
        helpTexts.push(`${i18n.__({ phrase: 'help.nftCommands.policyid', locale })}\n`);
      }
      if (enabledFeatures.includes('poll')) {
        helpTexts.push('🗳 **/vote**');
        helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.vote', locale })}\n`);
      }
      if (enabledFeatures.includes('whitelist')) {
        helpTexts.push('🤍 **/whitelist**');
        helpTexts.push(`${i18n.__({ phrase: 'help.whitelistCommands.whitelist', locale })}\n`);
      }
      helpTexts.push('📫 **/ping**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.ping', locale })}\n`);
      helpTexts.push('🐈 **/premium**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.premium', locale })}\n`);
      helpTexts.push('❔ **/help**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.help', locale })}`);

      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'help.messageTitle', locale }, { botName: 'HAZELnet.io Bot' }), helpTexts.join('\n'), 'help');
      await interaction.editReply({ embeds: [embed] });

      if (isBotAdmin) {
        const adminHelpTexts = [];
        adminHelpTexts.push(`\n\n${i18n.__({ phrase: 'help.adminCommands.title', locale })}\n`);
        adminHelpTexts.push('🔒 **/configure-protection**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-protection', locale })}\n`);
        adminHelpTexts.push('💓 **/configure-healthcheck**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-healthcheck', locale })}\n`);
        adminHelpTexts.push('⚙ **/configure-settings**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-settings', locale })}\n`);
        adminHelpTexts.push('💥 **/configure-bans**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-bans', locale })}\n`);
        if (enabledFeatures.includes('stakepool')) {
          adminHelpTexts.push('🌊 **/configure-stakepool**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-stakepool', locale })}\n`);
          adminHelpTexts.push('🧡 **/configure-delegatorroles**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-delegatorroles', locale })}\n`);
        }
        if (enabledFeatures.includes('token')) {
          adminHelpTexts.push('📃 **/configure-policy**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-policy', locale })}\n`);
          adminHelpTexts.push('🖐 **/configure-tokenroles**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-tokenroles', locale })}\n`);
        }
        if (enabledFeatures.includes('poll')) {
          adminHelpTexts.push('🗳 **/configure-poll**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-poll', locale })}\n`);
        }
        if (enabledFeatures.includes('whitelist')) {
          adminHelpTexts.push('🤍 **/configure-whitelist**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-whitelist', locale })}\n`);
        }
        if (enabledFeatures.includes('marketplace')) {
          adminHelpTexts.push('🛒 **/configure-marketplace**');
          adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-marketplace', locale })}\n`);
        }
        adminHelpTexts.push('📛 **/configure-adminaccess**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-adminaccess', locale })}\n`);
        adminHelpTexts.push('🔄 **/start**');
        adminHelpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.start', locale })}`);

        const adminembed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'help.messageTitleAdmin', locale }, { botName: 'HAZELnet.io Bot' }), adminHelpTexts.join('\n'), 'help');
        await interaction.followUp({ embeds: [adminembed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting help information.' });
    }
  },
};
