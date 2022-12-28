import { BotCommand } from "../utility/commandtypes";
import { SlashCommandBuilder } from 'discord.js';
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-stakepool', locale);
    return new SlashCommandBuilder()
      .setName('configure-stakepool')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('pool-id').setDescription(ci18n.option('pool-id')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addStringOption((option) => option.setName('pool-id').setDescription(ci18n.option('pool-id')).setRequired(true)));
    /*
      .addSubcommand((subcommand) => subcommand
        .setName('infochannel')
        .setDescription('Toggle the stakepool update feed for the given channel.')
        .addChannelOption((option) => option.setName('infochannel').setDescription('The channel to send pool update messages to.').setRequired(true))
        .addStringOption((option) => option.setName('off').setDescription('Set this parameter to off when disabling the info channel').setRequired(false)));
        */
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['stakepool'],
  execute: commandbase.executeSubcommandIfAdmin,
};
