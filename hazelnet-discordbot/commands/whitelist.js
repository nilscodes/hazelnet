const i18n = require('i18n');
const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.whitelist', locale }))
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('register')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.whitelist-register', locale }))
        .addStringOption((option) => option.setName('address').setDescription(i18n.__({ phrase: 'commands.options.whitelist.address', locale })).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.whitelist-list', locale }))
        .addBooleanOption((option) => option.setName('includeaddress').setDescription(i18n.__({ phrase: 'commands.options.whitelist.includeaddress', locale })).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('unregister')
        .setDescription(i18n.__({ phrase: 'commands.descriptions.whitelist-unregister', locale })));
  },
  commandTags: ['whitelist'],
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
};
