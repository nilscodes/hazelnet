/* eslint-disable no-await-in-loop */
const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const commandbase = require('../utility/commandbase');
const embedBuilder = require('../utility/embedbuilder');
const commandpermissions = require('../utility/commandpermissions');
const CommandTranslations = require('../utility/commandtranslations');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-healthcheck', locale);
    return new SlashCommandBuilder()
      .setName('configure-healthcheck')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const locale = discordServer.getBotLanguage();
    const isAdminUser = await commandpermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
    if (isAdminUser) {
      try {
        const healthCheckFields = [];
        const botObject = await interaction.guild.members.fetch(interaction.client.application.id);
        const tokenRoleProblem = await this.healthCheckRoles(discordServer, interaction, healthCheckFields, locale, 'tokenRoles', botObject);
        const delegatorRoleProblem = await this.healthCheckRoles(discordServer, interaction, healthCheckFields, locale, 'delegatorRoles', botObject);
        const auditChannelProblem = await this.healthCheckAuditChannel(discordServer, interaction, healthCheckFields, locale);
        const blackEditionProblem = await this.healthCheckBlackEdition(discordServer, interaction, healthCheckFields, locale);
        if (!tokenRoleProblem && !delegatorRoleProblem && !auditChannelProblem && !blackEditionProblem) {
          healthCheckFields.push({
            name: i18n.__({ phrase: 'configure.healthcheck.success', locale }),
            value: i18n.__({ phrase: 'configure.healthcheck.successInfo', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-healthcheck', i18n.__({ phrase: 'configure.healthcheck.purpose', locale }), 'configure-healthcheck', healthCheckFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
      }
    } else {
      const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'errors.permissionDeniedTitle', locale: discordServer.getBotLanguage() }), i18n.__({ phrase: 'errors.permissionDeniedInformation', locale: discordServer.getBotLanguage() }));
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    }
  },
  async healthCheckRoles(discordServer, interaction, healthCheckFields, locale, roleProperty, botObject) {
    let problems = false;
    const roleIds = [...new Set(discordServer[roleProperty].map((role) => role.roleId))];
    const highestRole = botObject.roles.highest;
    const unassignableRoles = [];
    for (let i = 0, len = roleIds.length; i < len; i += 1) {
      const guildRole = await interaction.guild.roles.fetch(roleIds[i]);
      if (guildRole) {
        if (guildRole.position > highestRole.position) {
          unassignableRoles.push(guildRole.id);
        }
      } else {
        problems = true;
        healthCheckFields.push({
          name: i18n.__({ phrase: `configure.healthcheck.${roleProperty}`, locale }),
          value: i18n.__({ phrase: 'configure.healthcheck.rolesDeleted', locale }),
        });
      }
    }
    if (unassignableRoles.length) {
      problems = true;
      healthCheckFields.push({
        name: i18n.__({ phrase: `configure.healthcheck.${roleProperty}`, locale }),
        value: i18n.__({ phrase: 'configure.healthcheck.assignmentPermissionDenied', locale }, {
          roleList: unassignableRoles.map((roleId) => i18n.__({ phrase: 'configure.healthcheck.deniedRoleEntry', locale }, { roleId })).join('\n'),
        }),
      });
    }
    return problems;
  },
  async healthCheckAuditChannel(discordServer, interaction, healthCheckFields, locale) {
    let problems = false;
    const auditChannel = discordServer.settings?.PROTECTION_AUDIT_CHANNEL;
    if (auditChannel?.length) {
      try {
        const auditChannelObject = await interaction.guild.channels.fetch(auditChannel);
        const auditChannelPermissions = auditChannelObject.permissionsFor(interaction.client.application.id);
        if (!auditChannelPermissions.has('SEND_MESSAGES') || !auditChannelPermissions.has('VIEW_CHANNEL')) {
          problems = true;
          healthCheckFields.push({
            name: i18n.__({ phrase: 'configure.healthcheck.auditChannel', locale }),
            value: i18n.__({ phrase: 'configure.healthcheck.auditChannelNotWritable', locale }, { auditChannel }),
          });
        }
      } catch (e) {
        problems = true;
        healthCheckFields.push({
          name: i18n.__({ phrase: 'configure.healthcheck.auditChannel', locale }),
          value: i18n.__({ phrase: 'configure.healthcheck.auditChannelDeleted', locale }),
        });
      }
    }
    return problems;
  },
  async healthCheckBlackEdition(discordServer, interaction, healthCheckFields, locale) {
    let problems = false;
    if (!discordServer.premium) {
      const polls = (await interaction.client.services.discordserver.getPolls(interaction.guild.id));
      const blackEditionIssues = [];
      if (polls.length) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssuePolls', locale }));
      }
      if (discordServer.whitelists.length) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueWhitelists', locale }));
      }
      if (discordServer.tokenRoles.length > 1) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueTokenRoles', locale }));
      }
      if (discordServer.delegatorRoles.length > 1) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueDelegatorRoles', locale }));
      }
      if (blackEditionIssues.length) {
        problems = true;
        healthCheckFields.push({
          name: i18n.__({ phrase: 'configure.healthcheck.blackEdition', locale }),
          value: i18n.__({ phrase: 'configure.healthcheck.blackEditionNotAvailable', locale }) + blackEditionIssues.map((blackEditionIssue) => i18n.__({ phrase: 'configure.healthcheck.blackEditionEntry', locale }, { blackEditionIssue })).join('\n'),
        });
      }
    }
    return problems;
  },
};
