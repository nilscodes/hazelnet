import NodeCache from 'node-cache';
import i18n from 'i18n';
import {
  ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder,
} from 'discord.js';
import { DiscordServer, TokenOwnershipRole } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction } from '../../utility/hazelnetclient';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';
import cardanotoken from '../../utility/cardanotoken';

interface ConfigureTokenRoleAddCommand extends BotSubcommand {
  cache: NodeCache
  createTokenRole(
    interaction: AugmentedCommandInteraction | AugmentedButtonInteraction,
    discordServer: DiscordServer,
    policyId: string,
    minimumTokenQuantity: string,
    maximumTokenQuantity: string | null,
    roleId: string,
    assetFingerprint: string | null,
  ): APIEmbed
  confirm(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToUpdate: TokenOwnershipRole): void
  cancel(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToUpdate: TokenOwnershipRole): void
}

export default <ConfigureTokenRoleAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const minimumTokenQuantity = interaction.options.getString('count', true);
    const maximumTokenQuantity = interaction.options.getString('max-count');
    const policyId = interaction.options.getString('policy-id', true);
    const assetFingerprint = interaction.options.getString('asset-fingerprint');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const maxTokenRoles = +(discordServer.settings?.MAXIMUM_TOKEN_ROLES ?? 30);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium || tokenRoles.length === 0) {
        if (parseInt(minimumTokenQuantity, 10) > 0) {
          if (maximumTokenQuantity === null || (parseInt(maximumTokenQuantity, 10) > 0 && parseInt(maximumTokenQuantity, 10) >= +minimumTokenQuantity)) {
            if (cardanotoken.isValidPolicyId(policyId)) {
              if (assetFingerprint === null || cardanotoken.isValidAssetFingerprint(assetFingerprint)) {
                if (tokenRoles.length <= maxTokenRoles) {
                  const guild = await interaction.client.guilds.fetch(interaction.guild!.id);
                  const allUsers = await guild.members.fetch();
                  const usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
                  if (usersWithRole.size === 0) {
                    const embed = await this.createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, maximumTokenQuantity, role.id, assetFingerprint);
                    await interaction.editReply({ embeds: [embed] });
                  } else {
                    // Register add data in cache, as we cannot send it along with the button data.
                    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                      acceptedAssets: [{ policyId, assetFingerprint }],
                      minimumTokenQuantity,
                      maximumTokenQuantity,
                      roleId: role.id,
                    } as TokenOwnershipRole);

                    const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                      .addComponents(
                        new ButtonBuilder()
                          .setCustomId('configure-tokenroles/add/confirm')
                          .setLabel(i18n.__({ phrase: 'configure.tokenroles.add.confirmRole', locale }))
                          .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                          .setCustomId('configure-tokenroles/add/cancel')
                          .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                          .setStyle(ButtonStyle.Secondary),
                      )];

                    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.tokenroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.tokenroles.add.roleInUseDetails', locale }, { roleId: `${role.id}`, memberCount: `${usersWithRole.size}` }), 'configure-tokenroles-add');
                    await interaction.editReply({ components, embeds: [embed] });
                  }
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorLimitReached', locale }, { maxTokenRoles: `${maxTokenRoles}` }), 'configure-tokenroles-add');
                  await interaction.editReply({ embeds: [embed] });
                }
              } else {
                const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorAssetFingerprint', locale }), 'configure-tokenroles-add');
                await interaction.editReply({ embeds: [embed] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorPolicyId', locale }), 'configure-tokenroles-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMaximumTokens', locale }), 'configure-tokenroles-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale }), 'configure-tokenroles-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.noPremium', locale }), 'configure-tokenroles-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, maximumTokenQuantity, roleId, assetFingerprint) {
    const locale = discordServer.getBotLanguage();
    const newTokenRolePromise = await interaction.client.services.discordserver.createTokenRole(interaction.guild!.id, policyId, minimumTokenQuantity, maximumTokenQuantity, roleId, assetFingerprint);
    const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
    const tokenRole = newTokenRolePromise.data;
    const addNextStepsField = {
      name: i18n.__({ phrase: 'configure.tokenroles.add.nextStepsTitle', locale }),
      value: i18n.__({ phrase: 'configure.tokenroles.add.nextStepsDetails', locale }),
    };

    const embed = embedBuilder.buildForAdmin(
      discordServer,
      '/configure-tokenroles add',
      i18n.__({ phrase: 'configure.tokenroles.add.success', locale }),
      'configure-tokenroles-add',
      [...tokenroles.getTokenRoleDetailsFields(tokenRole, tokenPolicies, locale), addNextStepsField],
    );
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const roleToAdd = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as TokenOwnershipRole;
    if (roleToAdd) {
      if (interaction.customId === 'configure-tokenroles/add/confirm') {
        this.confirm(interaction, discordServer, roleToAdd);
      } else if (interaction.customId === 'configure-tokenroles/add/cancel') {
        this.cancel(interaction, discordServer, roleToAdd);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a token role for guild ${interaction.guild!.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createTokenRole(interaction, discordServer, roleToAdd.acceptedAssets[0].policyId, roleToAdd.minimumTokenQuantity, roleToAdd.maximumTokenQuantity, roleToAdd.roleId, roleToAdd.acceptedAssets[0].assetFingerprint);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.tokenroles.add.canceled', locale }, roleToAdd as any), 'configure-tokenroles-add');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
