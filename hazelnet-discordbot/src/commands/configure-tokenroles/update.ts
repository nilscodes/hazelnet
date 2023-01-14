import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { DiscordServer, TokenOwnershipAggregationType, TokenOwnershipRole, TokenStakingType } from '../../utility/sharedtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction } from '../../utility/hazelnetclient';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';

interface ConfigureTokenRoleUpdateCommand extends BotSubcommand {
  cache: NodeCache
  updateTokenRole(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, tokenRoleId: number, minimumTokenQuantity: string | null, maximumTokenQuantity: string | null, roleId: string | undefined, aggregationType: TokenOwnershipAggregationType, stakingType: TokenStakingType): APIEmbed
  confirm(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToUpdate: TokenOwnershipRole): void
  cancel(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToUpdate: TokenOwnershipRole): void
}

export default <ConfigureTokenRoleUpdateCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id', true);
    const role = interaction.options.getRole('role');
    const minimumTokenQuantity = interaction.options.getString('count');
    const maximumTokenQuantity = interaction.options.getString('max-count');
    const aggregationType = interaction.options.getString('aggregation-type') as TokenOwnershipAggregationType;
    const stakingType = interaction.options.getString('staking-type') as TokenStakingType;
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      if (minimumTokenQuantity === null || parseInt(minimumTokenQuantity, 10) > 0) {
        if (maximumTokenQuantity === null || parseInt(maximumTokenQuantity, 10) === 0 || (minimumTokenQuantity && parseInt(maximumTokenQuantity, 10) > 0 && parseInt(maximumTokenQuantity, 10) >= +minimumTokenQuantity)) {
          let usersWithRole = null;
          if (role !== null) {
            const guild = await interaction.client.guilds.fetch(interaction.guild!.id);
            const allUsers = await guild.members.fetch();
            usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
          }
          if (usersWithRole === null || usersWithRole.size === 0) {
            const embed = await this.updateTokenRole(interaction, discordServer, tokenRoleId, minimumTokenQuantity, maximumTokenQuantity, role?.id, aggregationType, stakingType);
            await interaction.editReply({ embeds: [embed] });
          } else {
            // Register add data in cache, as we cannot send it along with the button data.
            this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
              id: tokenRoleId,
              minimumTokenQuantity,
              maximumTokenQuantity,
              roleId: role?.id,
              aggregationType,
              stakingType,
            } as TokenOwnershipRole);

            const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('configure-tokenroles/update/confirm')
                  .setLabel(i18n.__({ phrase: 'configure.tokenroles.add.confirmRole', locale }))
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId('configure-tokenroles/update/cancel')
                  .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                  .setStyle(ButtonStyle.Secondary),
              )];

            const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.tokenroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.tokenroles.add.roleInUseDetails', locale }, { roleId: role?.id, memberCount: usersWithRole.size } as any), 'configure-tokenroles-update');
            await interaction.editReply({ components, embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.add.errorMaximumTokens', locale }), 'configure-tokenroles-update');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale }), 'configure-tokenroles-update');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async updateTokenRole(interaction, discordServer, tokenRoleId, minimumTokenQuantity, maximumTokenQuantity, roleId, aggregationType, stakingType) {
    const locale = discordServer.getBotLanguage();
    const tokenRole = await interaction.client.services.discordserver.updateTokenRole(interaction.guild!.id, tokenRoleId, null, minimumTokenQuantity, maximumTokenQuantity, roleId, aggregationType, stakingType);
    const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
    const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(tokenRole, tokenPolicies, locale);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles update', i18n.__({ phrase: 'configure.tokenroles.update.success', locale }), 'configure-tokenroles-update', tokenRoleFields);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const roleToUpdate = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as TokenOwnershipRole;
    if (roleToUpdate) {
      if (interaction.customId === 'configure-tokenroles/update/confirm') {
        this.confirm(interaction, discordServer, roleToUpdate);
      } else if (interaction.customId === 'configure-tokenroles/update/cancel') {
        this.cancel(interaction, discordServer, roleToUpdate);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a token role for guild ${interaction.guild!.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToUpdate) {
    const embed = await this.updateTokenRole(interaction, discordServer, roleToUpdate.id, roleToUpdate.minimumTokenQuantity, roleToUpdate.maximumTokenQuantity, roleToUpdate.roleId, roleToUpdate.aggregationType, roleToUpdate.stakingType);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToUpdate) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.tokenroles.update.canceled', locale }, roleToUpdate as any), 'configure-tokenroles-update');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
