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
        .setName('status')
        .setDescription(ci18n.subDescription('status')))
      .addSubcommand((subcommand) => subcommand
        .setName('refill')
        .setDescription(ci18n.subDescription('refill'))
        .addIntegerOption((option) => option.setName('refill-amount').setDescription(ci18n.option('refill-amount')).setRequired(true)));
  },
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
