const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('verify')
      .setDescription('Starts a verification process or let\'s you manage your current verifications on this server.')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Starts a transaction-based verification of a staking address')
        .addStringOption((option) => option.setName('address-or-handle').setDescription('Enter the Cardano wallet address or $handle to verify.').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('help')
        .setDescription('Get help about the verification features'))
      .addSubcommand((subcommand) => subcommand
        .setName('link')
        .setDescription('Link your verified addresses to this Discord server to enable additional features'))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all staking addresses and link status associated with this Discord user and server'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Removes a verified wallet address')
        .addStringOption((option) => option.setName('address').setDescription('Enter the Cardano wallet address to remove from the verified address list.').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('unlink')
        .setDescription('Unlink your verified addresses from this server (verifications will remain)'));
  },
  commandTags: ['token', 'stakepool', 'poll', 'claimphysical'],
  execute: commandbase.executeSubcommand,
  executeButton: commandbase.executeButtonIfUser,
};
