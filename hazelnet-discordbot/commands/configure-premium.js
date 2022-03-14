const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-premium', locale);
    return new SlashCommandBuilder()
      .setName('configure-premium')
      .setDescription(ci18n.description())
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('stake')
        .setDescription(ci18n.subDescription('stake')));
  },
  execute: commandbase.executeSubcommandIfAdmin,
};
