const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-api', locale);
    return new SlashCommandBuilder()
      .setName('configure-api')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('generatetoken')
        .setDescription(ci18n.subDescription('generatetoken')))
      .addSubcommand((subcommand) => subcommand
        .setName('removetoken')
        .setDescription(ci18n.subDescription('removetoken')));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
