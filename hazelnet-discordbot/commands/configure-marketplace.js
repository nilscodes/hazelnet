const { SlashCommandBuilder } = require('@discordjs/builders');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-marketplace', locale);
    return new SlashCommandBuilder()
      .setName('configure-marketplace')
      .setDescription(ci18n.description())
      .addSubcommandGroup((group) => group
        .setName('sales')
        .setDescription(ci18n.subDescription('sales'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('sales-add'))
          .addStringOption((option) => option.setName('marketplace').setDescription(ci18n.option('marketplace'))
            .addChoices(
              { name: ci18n.choice('JPGSTORE'), value: 'JPGSTORE' },
            )
            .setRequired(true))
          .addIntegerOption((option) => option.setName('minimum-price').setDescription(ci18n.option('minimum-price')).setRequired(true))
          .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
          .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(false)))
        .addSubcommand((subcommand) => subcommand
          .setName('list')
          .setDescription(ci18n.subDescription('sales-list')))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('sales-remove'))))
      .addSubcommandGroup((group) => group
        .setName('listings')
        .setDescription(ci18n.subDescription('listings'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('listings-add'))
          .addStringOption((option) => option.setName('marketplace').setDescription(ci18n.option('marketplace'))
            .addChoices(
              { name: ci18n.choice('JPGSTORE'), value: 'JPGSTORE' },
            )
            .setRequired(true))
          .addIntegerOption((option) => option.setName('minimum-price').setDescription(ci18n.option('minimum-price')).setRequired(true))
          .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
          .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(false)))
        .addSubcommand((subcommand) => subcommand
          .setName('list')
          .setDescription(ci18n.subDescription('listings-list')))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('listings-remove'))))
      .addSubcommandGroup((group) => group
        .setName('mint')
        .setDescription(ci18n.subDescription('mint'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('mint-add'))
          .addChannelOption((option) => option.setName('channel').setDescription(ci18n.option('channel')).setRequired(true))
          .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(false)))
        .addSubcommand((subcommand) => subcommand
          .setName('list')
          .setDescription(ci18n.subDescription('mint-list')))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('mint-remove'))));
  },
  commandTags: ['marketplace'],
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
};
