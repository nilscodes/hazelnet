const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('configure-adminaccess')
      .setDescription('Configure roles that can administer the bot')
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription('Adds a role that is allowed to administer the bot.')
        .addRoleOption((option) => option.setName('admin-role').setDescription('Role to make an admin on this Discord server.').setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription('List all roles that are allowed to administer the bot.'))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription('Remove a role that is currently allowed to administer the bot.')
        .addRoleOption((option) => option.setName('admin-role').setDescription('Role to remove as an admin on this Discord server.').setRequired(true)));
  },
  execute: commandbase.executeSubcommandIfAdmin,
};
