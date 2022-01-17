const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-useraccess')
      .setDescription('Configure roles that can use the bot')
      .setDefaultPermission(false)
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Adds a role that is allowed to use the bot.')
        .addRoleOption((option) => option.setName('user-role').setDescription('Role to make a user on this Discord server.').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all roles that are allowed to use the bot.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove a role that is currently allowed to use the bot.')
        .addRoleOption((option) => option.setName('user-role').setDescription('Role to remove as a user of this bot on this Discord server.').setRequired(true)));
  },
  execute: commandbase.executeSubcommandIfAdmin,
};
