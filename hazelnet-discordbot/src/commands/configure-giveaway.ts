import { BotCommand } from "src/utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-giveaway', locale);
    return new SlashCommandBuilder()
    .setName('configure-giveaway')
    .setDescription(ci18n.description())
    .addSubcommand((subcommand) => subcommand
      .setName('add')
      .setDescription(ci18n.subDescription('add'))
      .addStringOption((option) => option.setName('giveaway-displayname').setDescription(ci18n.option('poll-displayname')).setRequired(true))
      .addStringOption((option) => option.setName('giveaway-name').setDescription(ci18n.option('poll-name')).setRequired(true))
      .addStringOption((option) => option.setName('giveaway-opentime').setDescription(ci18n.option('poll-opentime')).setRequired(false))
      .addStringOption((option) => option.setName('giveaway-closetime').setDescription(ci18n.option('poll-closetime')).setRequired(false))
      .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(false))
      .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(false)))
    .addSubcommand((subcommand) => subcommand
      .setName('list')
      .setDescription(ci18n.subDescription('list')))
    .addSubcommand((subcommand) => subcommand
      .setName('announce')
      .setDescription(ci18n.subDescription('announce'))
      .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('end')
      .setDescription(ci18n.subDescription('end'))
      .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('remove')
      .setDescription(ci18n.subDescription('remove')));
  },
  commandTags: ['giveaway'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
