const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-settings', locale);
    return new SlashCommandBuilder()
      .setName('configure-settings')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('features')
        .setDescription(ci18n.subDescription('features')))
      .addSubcommand((subcommand) => subcommand
        .setName('customize')
        .setDescription(ci18n.subDescription('customize'))
        .addStringOption((option) => option.setName('element').setDescription(ci18n.option('element'))
          .addChoices(
            { name: ci18n.choice('THEME_TOP_LOGO'), value: 'THEME_TOP_LOGO' },
            { name: ci18n.choice('THEME_COLOR_USER'), value: 'THEME_COLOR_USER' },
            { name: ci18n.choice('THEME_AUTHOR_NAME'), value: 'THEME_AUTHOR_NAME' },
            { name: ci18n.choice('THEME_FOOTER_TEXT'), value: 'THEME_FOOTER_TEXT' },
            { name: ci18n.choice('THEME_FOOTER_ICON'), value: 'THEME_FOOTER_ICON' },
            { name: ci18n.choice('THEME_AUTHOR_ICON'), value: 'THEME_AUTHOR_ICON' },
            { name: ci18n.choice('INFO_CONTENT_TITLE'), value: 'INFO_CONTENT_TITLE' },
            { name: ci18n.choice('INFO_CONTENT_TEXT'), value: 'INFO_CONTENT_TEXT' },
            { name: ci18n.choice('INFO_CONTENT_IMAGE'), value: 'INFO_CONTENT_IMAGE' },
            { name: ci18n.choice('RESET'), value: 'RESET' },
          )
          .setRequired(true))
        .addStringOption((option) => option.setName('customization-value').setDescription(ci18n.option('customization-value')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
