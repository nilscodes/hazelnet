/* eslint-disable no-await-in-loop */
import { SlashCommandBuilder, GuildMember, GuildTextBasedChannel, APIEmbedField } from 'discord.js';
import { AugmentedCommandInteraction } from '../utility/hazelnetclient';
import { DelegatorRole, DiscordServer, MarketplaceChannel, TokenOwnershipRole } from '../utility/sharedtypes';
import { BotCommand } from '../utility/commandtypes';
import i18n from 'i18n';
import commandbase from '../utility/commandbase';
import embedBuilder from '../utility/embedbuilder';
import commandpermissions from '../utility/commandpermissions';
import CommandTranslations from '../utility/commandtranslations';
import discordpermissions from '../utility/discordpermissions';

interface ConfigureHealthCheckCommand extends BotCommand {
  healthCheckRoles(interaction: AugmentedCommandInteraction, healthCheckFields: APIEmbedField[], locale: string, roleProperty: string, roles: DelegatorRole[] | TokenOwnershipRole[], botObject: GuildMember): Promise<Boolean>
  healthCheckAuditChannel(interaction: AugmentedCommandInteraction, discordServer: DiscordServer, healthCheckFields: APIEmbedField[]): Promise<Boolean>
  healthCheckBlackEdition(interaction: AugmentedCommandInteraction, discordServer: DiscordServer, healthCheckFields: APIEmbedField[], tokenRoles: TokenOwnershipRole[], delegatorRoles: DelegatorRole[], marketplaceChannels: MarketplaceChannel[]): Promise<Boolean>
  healthCheckMarketplacePermissions(interaction: AugmentedCommandInteraction, discordServer: DiscordServer, healthCheckFields: APIEmbedField[], marketplaceChannels: MarketplaceChannel[]): Promise<Boolean>
}

export default<ConfigureHealthCheckCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('configure-healthcheck', locale);
    return new SlashCommandBuilder()
      .setName('configure-healthcheck')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsAdmin,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const locale = discordServer.getBotLanguage();
    const isAdminUser = await commandpermissions.isBotAdmin(discordServer, interaction.client, interaction.user.id);
    if (isAdminUser) {
      try {
        const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
        const delegatorRoles = await interaction.client.services.discordserver.listDelegatorRoles(interaction.guild!.id);
        const marketplaceChannels = await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id);
        const healthCheckFields = [] as APIEmbedField[];
        const botObject = await interaction.guild!.members.fetch(interaction.client.application!.id);
        const tokenRoleProblem = await this.healthCheckRoles(interaction, healthCheckFields, locale, 'tokenRoles', tokenRoles, botObject);
        const delegatorRoleProblem = await this.healthCheckRoles(interaction, healthCheckFields, locale, 'delegatorRoles', delegatorRoles, botObject);
        const auditChannelProblem = await this.healthCheckAuditChannel(interaction, discordServer, healthCheckFields);
        const blackEditionProblem = await this.healthCheckBlackEdition(interaction, discordServer, healthCheckFields, tokenRoles, delegatorRoles, marketplaceChannels);
        const marketplaceProblem = await this.healthCheckMarketplacePermissions(interaction, discordServer, healthCheckFields, marketplaceChannels);
        if (!tokenRoleProblem && !delegatorRoleProblem && !auditChannelProblem && !blackEditionProblem && !marketplaceProblem) {
          healthCheckFields.push({
            name: i18n.__({ phrase: 'configure.healthcheck.success', locale }),
            value: i18n.__({ phrase: 'configure.healthcheck.successInfo', locale }),
          });
        }
        const CHUNK_SIZE = 20;
        const firstFields = healthCheckFields.splice(0, CHUNK_SIZE);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-healthcheck', i18n.__({ phrase: 'configure.healthcheck.purpose', locale }), 'configure-healthcheck', firstFields);
        await interaction.editReply({ embeds: [embed] });
        while (healthCheckFields.length) {
          const additionalHealthChecks = healthCheckFields.splice(0, CHUNK_SIZE);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-healthcheck', i18n.__({ phrase: 'configure.healthcheck.purpose', locale }), 'configure-healthcheck', additionalHealthChecks);
          await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
      }
    } else {
      const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'errors.permissionDeniedTitle', locale: discordServer.getBotLanguage() }), i18n.__({ phrase: 'errors.permissionDeniedInformation', locale: discordServer.getBotLanguage() }));
      await interaction.editReply({ embeds: [embed] });
    }
  },
  async healthCheckRoles(interaction, healthCheckFields, locale, roleProperty, roles, botObject) {
    let problems = false;
    const roleIds = [...new Set(roles.map((role) => role.roleId))];
    const highestRole = botObject.roles.highest;
    const unassignableRoles = [];
    for (let i = 0, len = roleIds.length; i < len; i += 1) {
      const guildRole = await interaction.guild!.roles.fetch(roleIds[i]);
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
  async healthCheckAuditChannel(interaction, discordServer, healthCheckFields) {
    const locale = discordServer.getBotLanguage();
    let problems = false;
    const auditChannel = discordServer.settings?.PROTECTION_AUDIT_CHANNEL;
    if (auditChannel?.length) {
      try {
        const auditChannelObject = await interaction.guild!.channels.fetch(auditChannel) as GuildTextBasedChannel;
        const auditChannelPermissions = auditChannelObject.permissionsFor(interaction.client.application!.id);
        if (!discordpermissions.hasBasicEmbedSendPermissions(auditChannelPermissions)) {
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
  async healthCheckBlackEdition(interaction, discordServer, healthCheckFields, tokenRoles, delegatorRoles, marketplaceChannels) {
    const locale = discordServer.getBotLanguage();
    let problems = false;
    if (!discordServer.premium) {
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const blackEditionIssues = [];
      if (polls.length) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssuePolls', locale }));
      }
      if (marketplaceChannels.length) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueMarketplaceChannels', locale }));
      }
      if (whitelists.length) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueWhitelists', locale }));
      }
      if (tokenRoles.length > 1) {
        blackEditionIssues.push(i18n.__({ phrase: 'configure.healthcheck.blackEditionIssueTokenRoles', locale }));
      }
      if (delegatorRoles.length > 1) {
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
  async healthCheckMarketplacePermissions(interaction, discordServer, healthCheckFields, marketplaceChannels) {
    const locale = discordServer.getBotLanguage();
    let problems = false;
    for (let i = 0, len = marketplaceChannels.length; i < len; i += 1) {
      const marketplaceChannel = marketplaceChannels[i];
      const announcementType = i18n.__({ phrase: `configure.healthcheck.marketplaceChannel${marketplaceChannel.type}`, locale });
      try {
        const marketplaceChannelObject = await interaction.guild!.channels.fetch(marketplaceChannel.channelId) as GuildTextBasedChannel;
        const marketplaceChannelPermissions = marketplaceChannelObject.permissionsFor(interaction.client.application!.id);
        if (!discordpermissions.hasBasicEmbedSendAndAttachPermissions(marketplaceChannelPermissions)) {
          problems = true;
          healthCheckFields.push({
            name: i18n.__({ phrase: 'configure.healthcheck.marketplaceChannel', locale }),
            value: i18n.__({ phrase: 'configure.healthcheck.marketplaceChannelNotWritable', locale }, { marketplaceChannel: marketplaceChannel.channelId, announcementType, marketplaceChannelId: `${marketplaceChannel.id}` }),
          });
        }
      } catch (e) {
        problems = true;
        healthCheckFields.push({
          name: i18n.__({ phrase: 'configure.healthcheck.marketplaceChannel', locale }),
          value: i18n.__({ phrase: 'configure.healthcheck.marketplaceChannelDeleted', locale }, { announcementType, marketplaceChannelId: `${marketplaceChannel.id}` }),
        });
      }
    }
    return problems;
  },
};
