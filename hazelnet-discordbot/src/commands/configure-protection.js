const { SlashCommandBuilder } = require('discord.js');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-protection', locale);
    return new SlashCommandBuilder()
      .setName('configure-protection')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('status')
        .setDescription(ci18n.subDescription('status')))
      .addSubcommand((subcommand) => subcommand
        .setName('addressremove')
        .setDescription(ci18n.subDescription('addressremove'))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('auditchannel')
        .setDescription(ci18n.subDescription('auditchannel'))
        .addChannelOption((option) => option.setName('auditchannel').setDescription(ci18n.option('auditchannel')).setRequired(true))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
