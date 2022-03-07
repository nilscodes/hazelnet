const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('whitelist', locale);
    return new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription(ci18n.description())
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('register')
        .setDescription(ci18n.subDescription('register'))
        .addStringOption((option) => option.setName('address-or-handle').setDescription(ci18n.option('address-or-handle')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list'))
        .addBooleanOption((option) => option.setName('includeaddress').setDescription(ci18n.option('includeaddress')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('unregister')
        .setDescription(ci18n.subDescription('unregister')));
  },
  commandTags: ['whitelist'],
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
};
