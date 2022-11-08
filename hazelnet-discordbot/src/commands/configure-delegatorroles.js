const { SlashCommandBuilder } = require('discord.js');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-delegatorroles', locale);
    return new SlashCommandBuilder()
      .setName('configure-delegatorroles')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(true))
        .addIntegerOption((option) => option.setName('minimum-stake').setDescription(ci18n.option('minimum-stake')).setRequired(true))
        .addStringOption((option) => option.setName('pool-id').setDescription(ci18n.option('pool-id')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addIntegerOption((option) => option.setName('delegator-role-id').setDescription(ci18n.option('role')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('test')
        .setDescription(ci18n.subDescription('test'))
        .addUserOption((option) => option.setName('user').setDescription(ci18n.option('user')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['stakepool'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
