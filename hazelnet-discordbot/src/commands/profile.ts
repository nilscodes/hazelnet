import { SlashCommandBuilder } from "@discordjs/builders";
import { BotCommand } from "src/utility/commandtypes";
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

export default <BotCommand> {
  getCommandData(locale, commandsToEnable) {
    const ci18n = new CommandTranslations('profile', locale);
    const builder = new SlashCommandBuilder();
    builder.setName('profile')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('toggle')
        .setDescription(ci18n.subDescription('toggle')));
    if (!commandsToEnable || commandsToEnable.includes('handle')) {
      builder.addSubcommand((subcommand) => subcommand
        .setName('defaulthandle')
        .setDescription(ci18n.subDescription('defaulthandle'))
        .addStringOption((option) => option.setName('handle').setDescription(ci18n.option('handle')).setRequired(false)));
    }
    return builder;
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  execute: commandbase.executeSubcommand,
  executeSelectMenu: commandbase.executeSubcommandSelectMenu,
  executeButton: commandbase.executeButtonIfUser,
};
