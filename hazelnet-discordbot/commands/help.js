const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');
const commandbase = require('../utility/commandbase');
const commandPermissions = require('../utility/commandpermissions');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('help')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.help', locale }));
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const isBotAdmin = await commandPermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
      const enabledFeatures = discordServer.settings.ENABLED_COMMAND_TAGS.split(',');
      // const isBotUser = await commandPermissions.isBotUser(discordServer, interaction.client, interaction.user.id);

      const helpTexts = [];

      helpTexts.push('✅ **/verify**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.verify', locale: useLocale })}\n`);
      helpTexts.push('🌊 **/info**');
      helpTexts.push(`${i18n.__({ phrase: 'help.stakepoolCommands.info', locale: useLocale })}\n`);
      if (enabledFeatures.includes('token')) {
        helpTexts.push('📃 **/policyid**');
        helpTexts.push(`${i18n.__({ phrase: 'help.nftCommands.policyid', locale: useLocale })}\n`);
      }
      if (enabledFeatures.includes('whitelist')) {
        helpTexts.push('🤍 **/whitelist**');
        helpTexts.push(`${i18n.__({ phrase: 'help.whitelistCommands.whitelist', locale: useLocale })}\n`);
      }
      helpTexts.push('❔ **/help**');
      helpTexts.push(`${i18n.__({ phrase: 'help.generalCommands.help', locale: useLocale })}`);

      if (isBotAdmin) {
        helpTexts.push(`\n\n${i18n.__({ phrase: 'help.adminCommands.title', locale: useLocale })}\n`);
        helpTexts.push('🔒 **/configure-protection**');
        helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-protection', locale: useLocale })}\n`);
        if (enabledFeatures.includes('stakepool')) {
          helpTexts.push('🌊 **/configure-stakepool**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-stakepool', locale: useLocale })}\n`);
          helpTexts.push('🧡 **/configure-delegatorroles**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-delegatorroles', locale: useLocale })}\n`);
        }
        if (enabledFeatures.includes('token')) {
          helpTexts.push('📃 **/configure-policy**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-policy', locale: useLocale })}\n`);
          helpTexts.push('🖐 **/configure-tokenroles**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-tokenroles', locale: useLocale })}\n`);
        }
        if (enabledFeatures.includes('poll')) {
          helpTexts.push('🌊 **/configure-poll**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-poll', locale: useLocale })}\n`);
        }
        if (enabledFeatures.includes('whitelist')) {
          helpTexts.push('🤍 **/configure-whitelist**');
          helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-whitelist', locale: useLocale })}\n`);
        }
        helpTexts.push('⚙ **/configure-adminaccess**');
        helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-adminaccess', locale: useLocale })}\n`);
        helpTexts.push('👤 **/configure-useraccess**');
        helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.configure-useraccess', locale: useLocale })}\n`);
        helpTexts.push('🔄 **/start**');
        helpTexts.push(`${i18n.__({ phrase: 'help.adminCommands.start', locale: useLocale })}`);
      }

      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'help.messageTitle', locale: useLocale }, { botName: 'HAZELnet.io Bot' }), helpTexts.join('\n'), 'help');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting help information.', ephemeral: true });
    }
  },
};
