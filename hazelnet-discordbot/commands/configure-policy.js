const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-policy')
      .setDescription('Manage asset policies that are officially represented by this server')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Add a Cardano policy ID and associated project name to the list of official projects on this server.')
        .addStringOption((option) => option.setName('policy-id').setDescription('Policy ID to add as an official token policy on this server').setRequired(true))
        .addStringOption((option) => option.setName('project-name').setDescription('The project name to list this policy ID under').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all Cardano policy IDs configured as official policies for projects on this server.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove the Cardano policy ID from this server\'s official policy list.')
        .addStringOption((option) => option.setName('policy-id').setDescription('Policy ID to remove as official token policy from this server').setRequired(true)));
  },
  commandTags: ['token'],
  execute: commandbase.executeSubcommandIfAdmin,
};
