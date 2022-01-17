const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-pool')
      .setDescription('Configure pools')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Add a Cardano stakepool ID for which this Discord server is assigning auto-roles.')
        .addStringOption((option) => option.setName('pool-id').setDescription('Pool ID (not ticker) for the pool you want to add').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all Cardano stakepool IDs for which this Discord server is assigning auto-roles for delegators.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove the Cardano stakepool ID from the list of pools this server is configured for.')
        .addStringOption((option) => option.setName('pool-id').setDescription('Pool ID (not ticker) for the pool you want to remove').setRequired(true)));
    /*
      .addSubcommand((subcommand) => subcommand
        .setName('infochannel')
        .setDescription('Toggle the stakepool update feed for the given channel.')
        .addChannelOption((option) => option.setName('infochannel').setDescription('The channel to send pool update messages to.').setRequired(true))
        .addStringOption((option) => option.setName('off').setDescription('Set this parameter to off when disabling the info channel').setRequired(false)));
        */
  },
  commandTags: ['pool'],
  execute: commandbase.executeSubcommandIfAdmin,
};
