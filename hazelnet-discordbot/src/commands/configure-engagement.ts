import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-engagement', locale);
    return new SlashCommandBuilder()
      .setName('configure-engagement')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('activityreminder')
        .setDescription(ci18n.subDescription('activityreminder'))
        .addIntegerOption((option) => option.setName('inactivity-days').setDescription(ci18n.option('inactivity-days')).setRequired(true))
        .addChannelOption((option) => option.setName('reminderchannel').setDescription(ci18n.option('reminderchannel')).setRequired(true))
        .addStringOption((option) => option.setName('remindermessage').setDescription(ci18n.option('remindermessage')).setRequired(false))
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('downloadusers')
        .setDescription(ci18n.subDescription('downloadusers'))
        .addRoleOption((option) => option.setName('target-role').setDescription(ci18n.option('target-role')).setRequired(true)));
  },
  commandTags: ['engagement'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
