import { SlashCommandBuilder } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-drep', locale);
    return new SlashCommandBuilder()
      .setName('configure-drep')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('drep-id').setDescription(ci18n.option('drep-id')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addStringOption((option) => option.setName('drep-id').setDescription(ci18n.option('drep-id')).setRequired(true)));
    /*
      .addSubcommand((subcommand) => subcommand
        .setName('infochannel')
        .setDescription('Toggle the dRep update feed for the given channel.')
        .addChannelOption((option) => option.setName('infochannel').setDescription('The channel to send dRep update messages to.').setRequired(true))
        .addStringOption((option) => option.setName('off').setDescription('Set this parameter to off when disabling the info channel').setRequired(false)));
        */
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['governance'],
  execute: commandbase.executeSubcommandIfAdmin,
};
