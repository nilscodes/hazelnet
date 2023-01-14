import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { DelegatorRole, DiscordServer } from '../../utility/sharedtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';

interface DelegatorRoleAddCommand extends BotSubcommand {
  cache: NodeCache
  createDelegatorRole(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, poolHash: string | null, minimumStakeAda: number, roleId: string): any
  confirm(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToAdd: DelegatorRole): void
  cancel(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, roleToAdd: DelegatorRole): void
}

export default <DelegatorRoleAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const minimumStakeAda = interaction.options.getInteger('minimum-stake', true);
    const poolHash = interaction.options.getString('pool-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const delegatorRoles = await interaction.client.services.discordserver.listDelegatorRoles(interaction.guild!.id) as DelegatorRole[];
      const locale = discordServer.getBotLanguage();
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
      if (stakepools.length) {
        if (poolHash === null || stakepools.find((stakepool) => stakepool.poolHash === poolHash)) {
          if (discordServer.premium || delegatorRoles.length === 0) {
            if (minimumStakeAda > 0) {
              const minimumStake = minimumStakeAda * 1000000;
              const guild = await interaction.client.guilds.fetch(interaction.guild!.id);
              const allUsers = await guild.members.fetch();
              const usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
              if (usersWithRole.size === 0) {
                const embed = await this.createDelegatorRole(interaction, discordServer, poolHash, minimumStake, role.id);
                await interaction.editReply({ embeds: [embed] });
              } else {
                // Register add data in cache, as we cannot send it along with the button data.
                this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                  poolHash,
                  minimumStake,
                  roleId: role.id,
                });

                const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('configure-delegatorroles/add/confirm')
                      .setLabel(i18n.__({ phrase: 'configure.delegatorroles.add.confirmRole', locale }))
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId('configure-delegatorroles/add/cancel')
                      .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                      .setStyle(ButtonStyle.Secondary),
                  )];

                const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.delegatorroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.delegatorroles.add.roleInUseDetails', locale }, { roleId: role.id, memberCount: usersWithRole.size } as any), 'configure-delegatorroles-add');
                await interaction.editReply({ components, embeds: [embed] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.errorMinimumStake', locale }), 'configure-delegatorroles-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.noPremium', locale }), 'configure-delegatorroles-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.noMatchingStakepool', locale }, { poolHash }), 'configure-delegatorroles-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.noStakepools', locale }), 'configure-delegatorroles-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding delegator role to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async createDelegatorRole(interaction, discordServer, poolHash, minimumStake, roleId) {
    const locale = discordServer.getBotLanguage();
    const newDelegatorRolePromise = await interaction.client.services.discordserver.createDelegatorRole(interaction.guild!.id, poolHash, minimumStake, roleId);
    const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
    const newDelegatorRole = newDelegatorRolePromise.data;

    let fieldHeader = 'configure.delegatorroles.list.stakepoolNameInofficial';
    const officialStakepool = stakepools.find((stakepool) => stakepool.poolHash === newDelegatorRole.poolHash);
    if (!newDelegatorRole.poolHash) {
      fieldHeader = 'configure.delegatorroles.list.stakepoolNameAny';
    } else if (officialStakepool) {
      fieldHeader = 'configure.delegatorroles.list.stakepoolNameOfficial';
    }
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles add', i18n.__({ phrase: 'configure.delegatorroles.add.success', locale }), 'configure-delegatorroles-add', [
      {
        name: i18n.__({ phrase: fieldHeader, locale }, { delegatorRole: newDelegatorRole, officialStakepool } as any),
        value: i18n.__({ phrase: 'configure.delegatorroles.list.delegatorRoleDetails', locale }, { delegatorRole: newDelegatorRole, minimumStake: newDelegatorRole.minimumStake / 1000000 } as any),
      },
    ]);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const roleToAdd = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as DelegatorRole;
    if (roleToAdd) {
      if (interaction.customId === 'configure-delegatorroles/add/confirm') {
        this.confirm(interaction, discordServer, roleToAdd);
      } else if (interaction.customId === 'configure-delegatorroles/add/cancel') {
        this.cancel(interaction, discordServer, roleToAdd);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a delegator role for guild ${interaction.guild!.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createDelegatorRole(interaction, discordServer, roleToAdd.poolHash ?? null, roleToAdd.minimumStake, roleToAdd.roleId);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.delegatorroles.add.canceled', locale }, roleToAdd as any), 'configure-delegatorroles-add');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
