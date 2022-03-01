const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-settings')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-settings', locale }))
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('features')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.configure-settings-features', locale })));
  },
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
