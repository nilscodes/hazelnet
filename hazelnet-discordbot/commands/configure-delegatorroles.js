const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-delegatorroles')
      .setDescription('Configure delegator-roles')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Adds an auto-assignment for the given role.')
        .addRoleOption((option) => option.setName('role').setDescription('Role to assign users with the given amount of stake for configured pools.').setRequired(true))
        .addIntegerOption((option) => option.setName('minimum-stake').setDescription('The minimum stake (in ADA) required for this role (0 for any amount).').setRequired(true))
        .addStringOption((option) => option.setName('pool-id').setDescription('Pool ID (not ticker) required to be delegating to, or ignore for all pools of this server.').setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all auto-assigned roles for delegators of the pools configured for this server.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove all auto-assignments (for all stake amounts) for the given role for delegators.')
        .addIntegerOption((option) => option.setName('delegator-role-id').setDescription('Role to remove auto-assignments for (get ID from list command)').setRequired(true)));
  },
  commandTags: ['pool'],
  execute: commandbase.executeSubcommandIfAdmin,
};
