import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-info', locale);
    return new SlashCommandBuilder()
      .setName('configure-info')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('epochclock')
        .setDescription(ci18n.subDescription('epochclock'))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('rolecounter')
        .setDescription(ci18n.subDescription('rolecounter'))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(true))
        .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
