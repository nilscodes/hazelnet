import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
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
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('announce')
        .setDescription(ci18n.subDescription('announce'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addStringOption((option) => option.setName('info-text').setDescription(ci18n.option('info-text')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('mintcounter')
        .setDescription(ci18n.subDescription('mintcounter'))
        .addChannelOption((option) => option.setName('voice-channel').setDescription(ci18n.option('voice-channel')).setRequired(true))
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true))
        .addIntegerOption((option) => option.setName('max-count').setDescription(ci18n.option('max-count')).setRequired(false))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false))
        .addBooleanOption((option) => option.setName('cip68').setDescription(ci18n.option('cip68')).setRequired(false)));
  },
  commandTags: ['token', 'marketplace'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
