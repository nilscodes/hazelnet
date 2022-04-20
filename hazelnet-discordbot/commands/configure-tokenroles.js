const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-tokenroles', locale);
    return new SlashCommandBuilder()
      .setName('configure-tokenroles')
      .setDescription(ci18n.description())
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(true))
        .addStringOption((option) => option.setName('count').setDescription(ci18n.option('count')).setRequired(true))
        .addStringOption((option) => option.setName('max-count').setDescription(ci18n.option('max-count')).setRequired(false))
        .addStringOption((option) => option.setName('asset-fingerprint').setDescription(ci18n.option('asset-fingerprint')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true)));
  },
  commandTags: ['token'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
