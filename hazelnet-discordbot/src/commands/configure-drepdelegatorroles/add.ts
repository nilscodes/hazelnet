import NodeCache from 'node-cache';
import i18n from 'i18n';
import { ActionRowBuilder, APIEmbed, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { DRepDelegatorRole, DiscordServer } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';

interface DelegatorRoleAddCommand extends BotSubcommand {
  cache: NodeCache
  createDRepDelegatorRole(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, dRepHash: string | null, minimumStake: number, maximumStake: number | null, roleId: string): APIEmbed
  confirm(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToAdd: DRepDelegatorRole): void
  cancel(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToAdd: DRepDelegatorRole): void
}

export default <DelegatorRoleAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const minimumStakeAda = interaction.options.getInteger('minimum-stake', true);
    const maximumStakeAda = interaction.options.getInteger('maximum-stake');
    const dRepHash = interaction.options.getString('drep-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDRepDelegatorRoles(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;
      if (dReps.length) {
        if (dRepHash === null || dReps.find((dRep) => dRep.dRepHash === dRepHash)) {
          if (discordServer.premium || delegatorRoles.length === 0) {
            if (minimumStakeAda > 0) {
              const minimumStake = minimumStakeAda * 1000000;
              const maximumStake = maximumStakeAda ? maximumStakeAda * 1000000 : null;
              const guild = await interaction.client.guilds.fetch(interaction.guild!.id);
              const allUsers = await guild.members.fetch();
              const usersWithRole = allUsers.filter((member) => member.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
              if (usersWithRole.size === 0) {
                const embed = await this.createDRepDelegatorRole(interaction, discordServer, dRepHash, minimumStake, maximumStake, role.id);
                await interaction.editReply({ embeds: [embed] });
              } else {
                // Register add data in cache, as we cannot send it along with the button data.
                this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                  dRepHash,
                  minimumStake,
                  maximumStake,
                  roleId: role.id,
                });

                const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('configure-drepdelegatorroles/add/confirm')
                      .setLabel(i18n.__({ phrase: 'configure.drepdelegatorroles.add.confirmRole', locale }))
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId('configure-drepdelegatorroles/add/cancel')
                      .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                      .setStyle(ButtonStyle.Secondary),
                  )];

                const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.drepdelegatorroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.drepdelegatorroles.add.roleInUseDetails', locale }, { roleId: role.id, memberCount: usersWithRole.size } as any), 'configure-drepdelegatorroles-add');
                await interaction.editReply({ components, embeds: [embed] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles add', i18n.__({ phrase: 'configure.drepdelegatorroles.add.errorMinimumStake', locale }), 'configure-drepdelegatorroles-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles add', i18n.__({ phrase: 'configure.drepdelegatorroles.add.noPremium', locale }), 'configure-drepdelegatorroles-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles add', i18n.__({ phrase: 'configure.drepdelegatorroles.add.noMatchingDRep', locale }, { dRepHash }), 'configure-drepdelegatorroles-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles add', i18n.__({ phrase: 'configure.drepdelegatorroles.add.noDReps', locale }), 'configure-drepdelegatorroles-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding delegator role to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async createDRepDelegatorRole(interaction, discordServer, dRepHash, minimumStake, maximumStake, roleId) {
    const locale = discordServer.getBotLanguage();
    const newDelegatorRole = await interaction.client.services.discordserver.createDRepDelegatorRole(interaction.guild!.id, dRepHash, minimumStake, maximumStake, roleId);
    const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);;

    let fieldHeader = 'configure.drepdelegatorroles.list.dRepNameInofficial';
    const officialDRep = dReps.find((dRep) => dRep.dRepHash === newDelegatorRole.dRepHash);
    if (!newDelegatorRole.dRepHash) {
      fieldHeader = 'configure.drepdelegatorroles.list.dRepNameAny';
    } else if (officialDRep) {
      fieldHeader = 'configure.drepdelegatorroles.list.dRepNameOfficial';
    }
    const maxInfo = newDelegatorRole.maximumStake ? i18n.__({ phrase: 'configure.drepdelegatorroles.list.maxInfo', locale }, { maximumStake: newDelegatorRole.maximumStake / 1000000 } as any) : '';
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-drepdelegatorroles add', i18n.__({ phrase: 'configure.drepdelegatorroles.add.success', locale }), 'configure-drepdelegatorroles-add', [
      {
        name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole: newDelegatorRole, officialDRep } as any),
        value: i18n.__({ phrase: 'configure.drepdelegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole: newDelegatorRole, minimumStake: newDelegatorRole.minimumStake / 1000000, maxInfo } as any),
      },
    ]);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const roleToAdd = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as DRepDelegatorRole;
    if (roleToAdd) {
      if (interaction.customId === 'configure-drepdelegatorroles/add/confirm') {
        this.confirm(interaction, discordServer, roleToAdd);
      } else if (interaction.customId === 'configure-drepdelegatorroles/add/cancel') {
        this.cancel(interaction, discordServer, roleToAdd);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a dRep delegator role for guild ${interaction.guild!.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createDRepDelegatorRole(interaction, discordServer, roleToAdd.dRepHash ?? null, roleToAdd.minimumStake, roleToAdd.maximumStake ?? null, roleToAdd.roleId);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.drepdelegatorroles.add.canceled', locale }, roleToAdd as any), 'configure-drepdelegatorroles-add');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
