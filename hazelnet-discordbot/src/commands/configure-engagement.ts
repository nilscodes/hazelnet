import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

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
        .addBooleanOption((option) => option.setName('status').setDescription(ci18n.option('status')).setRequired(false)));
  },
  commandTags: ['engagement'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
};
