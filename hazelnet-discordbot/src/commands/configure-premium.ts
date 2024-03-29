import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-premium', locale);
    return new SlashCommandBuilder()
      .setName('configure-premium')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('status')
        .setDescription(ci18n.subDescription('status')))
      .addSubcommand((subcommand) => subcommand
        .setName('refill')
        .setDescription(ci18n.subDescription('refill'))
        .addIntegerOption((option) => option.setName('refill-amount').setDescription(ci18n.option('refill-amount')).setRequired(true)));
  },
  commandTags: ['premium'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
