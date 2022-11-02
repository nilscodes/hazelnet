const { SlashCommandBuilder } = require('discord.js');
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-tokenroles', locale);
    return new SlashCommandBuilder()
      .setName('configure-tokenroles')
      .setDescription(ci18n.description())
      .addSubcommand((subcommand) => subcommand
        .setName('add')
        .setDescription(ci18n.subDescription('add'))
        .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(true))
        .addStringOption((option) => option.setName('count').setDescription(ci18n.option('count')).setRequired(true))
        .addStringOption((option) => option.setName('max-count').setDescription(ci18n.option('max-count')).setRequired(false))
        .addStringOption((option) => option.setName('asset-fingerprint').setDescription(ci18n.option('asset-fingerprint')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('update')
        .setDescription(ci18n.subDescription('update'))
        .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true))
        .addStringOption((option) => option.setName('aggregation-type').setDescription(ci18n.option('aggregation-type'))
          .addChoices(
            { name: ci18n.choice('ANY_POLICY_FILTERED_AND'), value: 'ANY_POLICY_FILTERED_AND' },
            { name: ci18n.choice('ANY_POLICY_FILTERED_OR'), value: 'ANY_POLICY_FILTERED_OR' },
            { name: ci18n.choice('ANY_POLICY_FILTERED_ONE_EACH'), value: 'ANY_POLICY_FILTERED_ONE_EACH' },
            { name: ci18n.choice('EVERY_POLICY_FILTERED_OR'), value: 'EVERY_POLICY_FILTERED_OR' },
          )
          .setRequired(false))
        .addRoleOption((option) => option.setName('role').setDescription(ci18n.option('role')).setRequired(false))
        .addStringOption((option) => option.setName('count').setDescription(ci18n.option('count')).setRequired(false))
        .addStringOption((option) => option.setName('max-count').setDescription(ci18n.option('max-count')).setRequired(false)))
      .addSubcommand((subcommand) => subcommand
        .setName('list')
        .setDescription(ci18n.subDescription('list')))
      .addSubcommand((subcommand) => subcommand
        .setName('details')
        .setDescription(ci18n.subDescription('details'))
        .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true)))
      .addSubcommandGroup((group) => group
        .setName('metadatafilter')
        .setDescription(ci18n.subDescription('metadatafilter'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('metadatafilter-add'))
          .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true))
          .addStringOption((option) => option.setName('attribute-path').setDescription(ci18n.option('attribute-path')).setRequired(true))
          .addStringOption((option) => option.setName('operator').setDescription(ci18n.option('operator'))
            .addChoices(
              { name: ci18n.choice('EQUALS'), value: 'EQUALS' },
              { name: ci18n.choice('NOTEQUALS'), value: 'NOTEQUALS' },
              { name: ci18n.choice('CONTAINS'), value: 'CONTAINS' },
              { name: ci18n.choice('NOTCONTAINS'), value: 'NOTCONTAINS' },
              { name: ci18n.choice('STARTSWITH'), value: 'STARTSWITH' },
              { name: ci18n.choice('ENDSWITH'), value: 'ENDSWITH' },
              { name: ci18n.choice('REGEX'), value: 'REGEX' },
            )
            .setRequired(true))
          .addStringOption((option) => option.setName('attribute-value').setDescription(ci18n.option('attribute-value')).setRequired(true)))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('metadatafilter-remove'))
          .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true))))
      .addSubcommandGroup((group) => group
        .setName('policies')
        .setDescription(ci18n.subDescription('policies'))
        .addSubcommand((subcommand) => subcommand
          .setName('add')
          .setDescription(ci18n.subDescription('policies-add'))
          .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true))
          .addStringOption((option) => option.setName('policy-id').setDescription(ci18n.option('policy-id')).setRequired(true))
          .addStringOption((option) => option.setName('asset-fingerprint').setDescription(ci18n.option('asset-fingerprint')).setRequired(false)))
        .addSubcommand((subcommand) => subcommand
          .setName('remove')
          .setDescription(ci18n.subDescription('policies-remove'))
          .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true))))
      .addSubcommand((subcommand) => subcommand
        .setName('remove')
        .setDescription(ci18n.subDescription('remove'))
        .addIntegerOption((option) => option.setName('token-role-id').setDescription(ci18n.option('token-role-id')).setRequired(true)))
      .addSubcommand((subcommand) => subcommand
        .setName('test')
        .setDescription(ci18n.subDescription('test'))
        .addUserOption((option) => option.setName('user').setDescription(ci18n.option('user')).setRequired(true)));
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  commandTags: ['token'],
  execute: commandbase.executeSubcommandIfAdmin,
  executeSelectMenu: commandbase.executeSelectMenuIfAdmin,
  executeButton: commandbase.executeButtonIfAdmin,
};
