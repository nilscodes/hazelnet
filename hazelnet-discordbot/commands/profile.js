const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('profile', locale);
    return new SlashCommandBuilder()
      .setName('profile')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('toggle')
        .setDescription(ci18n.subDescription('toggle'))
        .addStringOption((option) => option.setName('option').setDescription(ci18n.option('option'))
          .addChoices(
            { name: ci18n.choice('OPTION_RECEIVEPINGS'), value: 'OPTION_RECEIVEPINGS' },
          )
          .setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
  executeButton: commandbase.executeButtonIfUser,
};
