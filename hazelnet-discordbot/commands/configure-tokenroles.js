const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-tokenroles')
      .setDescription('Manage auto-role assignments for NFT and other token-holders')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Adds an auto-assignment for the given role based on NFTs and FTs in a users verified wallets.')
        .addStringOption((option) => option.setName('policy-id').setDescription('Policy ID (Does not need to be an official policy of this server)').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Role to assign users with the given amount of tokens').setRequired(true))
        .addStringOption((option) => option.setName('count').setDescription('Minimum amount of tokens to qualify for this role').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all roles that will auto-assigned to verified holders of NFTs and FTs of configured policy IDs'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove the auto-assignment for the given role for NFT and FT holders.')
        .addIntegerOption((option) => option.setName('token-role-id').setDescription('Role to remove auto-assignments for (get ID from list command)').setRequired(true)));
  },
  commandTags: ['token'],
  execute: commandbase.executeSubcommandIfAdmin,
};
