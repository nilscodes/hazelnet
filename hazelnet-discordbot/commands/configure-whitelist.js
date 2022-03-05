const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-whitelist', locale);
    return new SlashCommandBuilder()
      .setName('configure-whitelist')
      .setDescription(ci18n.description())
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('whitelist-displayname').setDescription(ci18n.option('whitelist-displayname')).setRequired(true))
        .addStringOption((option) => option.setName('whitelist-name').setDescription(ci18n.option('whitelist-name')).setRequired(true))
        .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(true))
        .addIntegerOption((option) => option.setName('max-users').setDescription(ci18n.option('max-users')).setRequired(false))
        .addStringOption((option) => option.setName('signup-start').setDescription(ci18n.option('signup-start')).setRequired(false))
        .addStringOption((option) => option.setName('signup-end').setDescription(ci18n.option('signup-end')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('close')
        .setDescription(ci18n.subDescription('close')))
      .addSubcommand((subcommand) => subcommand
        .setName('open')
        .setDescription(ci18n.subDescription('open')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove')));
  },
  commandTags: ['whitelist'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
};
