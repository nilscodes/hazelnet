const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-policy', locale);
    return new SlashCommandBuilder()
      .setName('configure-policy')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true))
        .addStringOption((option) => option.setName('project-name').setDescription(ci18n.option('project-name')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true)));
  },
  commandTags: ['token', 'marketplace'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
