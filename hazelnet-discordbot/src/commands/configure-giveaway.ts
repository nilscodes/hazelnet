import { BotCommand } from '../utility/commandtypes';
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
      .addStringOption((option) => option.setName('giveaway-displayname').setDescription(ci18n.option('giveaway-displayname')).setRequired(true))
      .addStringOption((option) => option.setName('giveaway-name').setDescription(ci18n.option('giveaway-name')).setRequired(true))
      .addStringOption((option) => option.setName('giveaway-opentime').setDescription(ci18n.option('giveaway-opentime')).setRequired(false))
      .addStringOption((option) => option.setName('giveaway-closetime').setDescription(ci18n.option('giveaway-closetime')).setRequired(false))
      .addStringOption((option) => option.setName('snapshot-time').setDescription(ci18n.option('snapshot-time')).setRequired(false))
      .addStringOption((option) => option.setName('image-url').setDescription(ci18n.option('image-url')).setRequired(false))
      .addIntegerOption((option) => option.setName('winner-count').setDescription(ci18n.option('winner-count')).setRequired(false))
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
      .setDescription(ci18n.subDescription('end')))
    .addSubcommand((subcommand) => subcommand
      .setName('remove')
      .setDescription(ci18n.subDescription('remove')))
    .addSubcommandGroup((group) => group
      .setName('update')
      .setDescription(ci18n.subDescription('update'))
      .addSubcommand((subcommand) => subcommand
        .setName('addrole')
        .setDescription(ci18n.subDescription('update-addrole'))
        .addRoleOption((option) => option.setName('required-role').setDescription(ci18n.option('required-role')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('removerole')
        .setDescription(ci18n.subDescription('update-removerole'))));
  },
  commandTags: ['giveaway'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
