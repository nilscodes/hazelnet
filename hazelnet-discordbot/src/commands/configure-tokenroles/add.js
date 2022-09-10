const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const cardanotoken = require('../../utility/cardanotoken');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const minimumTokenQuantity = interaction.options.getString('count');
    const maximumTokenQuantity = interaction.options.getString('max-count');
    const policyId = interaction.options.getString('policy-id');
    const assetFingerprint = interaction.options.getString('asset-fingerprint');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const maxTokenRoles = discordServer.settings?.MAXIMUM_TOKEN_ROLES ?? 30;
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium || !discordServer.tokenRoles || discordServer.tokenRoles.length === 0) {
        if (parseInt(minimumTokenQuantity, 10) > 0) {
          if (maximumTokenQuantity === null || (parseInt(maximumTokenQuantity, 10) > 0 && parseInt(maximumTokenQuantity, 10) >= minimumTokenQuantity)) {
            if (cardanotoken.isValidPolicyId(policyId)) {
              if (assetFingerprint === null || cardanotoken.isValidAssetFingerprint(assetFingerprint)) {
                if (discordServer.tokenRoles.length <= maxTokenRoles) {
                  const guild = await interaction.client.guilds.fetch(interaction.guild.id);
                  const allUsers = await guild.members.fetch();
                  const usersWithRole = allUsers.filter((member) => member?.roles.cache.some((memberRole) => memberRole.id === role.id)); // Can't use role.members.size since not all members might be cached
                  if (usersWithRole.size === 0) {
                    const embed = await this.createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, maximumTokenQuantity, role.id, assetFingerprint);
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                  } else {
                    // Register add data in cache, as we cannot send it along with the button data.
                    this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
                      policyId,
                      minimumTokenQuantity,
                      maximumTokenQuantity,
                      roleId: role.id,
                      assetFingerprint,
                    });

                    const components = [new MessageActionRow()
                      .addComponents(
                        new MessageButton()
                          .setCustomId('configure-tokenroles/add/confirm')
                          .setLabel(i18n.__({ phrase: 'configure.tokenroles.add.confirmRole', locale }))
                          .setStyle('PRIMARY'),
                        new MessageButton()
                          .setCustomId('configure-tokenroles/add/cancel')
                          .setLabel(i18n.__({ phrase: 'generic.cancel', locale }))
                          .setStyle('SECONDARY'),
                      )];

                    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'configure.tokenroles.add.roleInUseWarning', locale }), i18n.__({ phrase: 'configure.tokenroles.add.roleInUseDetails', locale }, { roleId: role.id, memberCount: usersWithRole.size }), 'configure-tokenroles-add');
                    await interaction.editReply({ components, embeds: [embed], ephemeral: true });
                  }
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorLimitReached', locale }, { maxTokenRoles }), 'configure-tokenroles-add');
                  await interaction.editReply({ embeds: [embed], ephemeral: true });
                }
              } else {
                const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorAssetFingerprint', locale }), 'configure-tokenroles-add');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorPolicyId', locale }), 'configure-tokenroles-add');
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMaximumTokens', locale }), 'configure-tokenroles-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale }), 'configure-tokenroles-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.noPremium', locale }), 'configure-tokenroles-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async createTokenRole(interaction, discordServer, policyId, minimumTokenQuantity, maximumTokenQuantity, roleId, assetFingerprint) {
    const locale = discordServer.getBotLanguage();
    const newTokenRolePromise = await interaction.client.services.discordserver.createTokenRole(interaction.guild.id, policyId, minimumTokenQuantity, maximumTokenQuantity, roleId, assetFingerprint);
    const tokenRole = newTokenRolePromise.data;

    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.success', locale }), 'configure-tokenroles-add', [
      tokenroles.getTokenRoleDetailsText(tokenRole, discordServer, locale),
    ]);
    return embed;
  },
  async executeButton(interaction) {
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const roleToAdd = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
    if (roleToAdd) {
      if (interaction.customId === 'configure-tokenroles/add/confirm') {
        this.confirm(interaction, discordServer, roleToAdd);
      } else if (interaction.customId === 'configure-tokenroles/add/cancel') {
        this.cancel(interaction, discordServer, roleToAdd);
      }
    } else {
      interaction.client.logger.warn(`User ${interaction.user.id} tried to add a token role for guild ${interaction.guild.id}, but the role add cache was empty.`);
    }
  },
  async confirm(interaction, discordServer, roleToAdd) {
    const embed = await this.createTokenRole(interaction, discordServer, roleToAdd.policyId, roleToAdd.minimumTokenQuantity, roleToAdd.maximumTokenQuantity, roleToAdd.roleId, roleToAdd.assetFingerprint);
    await interaction.update({ embeds: [embed], components: [] });
  },
  async cancel(interaction, discordServer, roleToAdd) {
    const locale = discordServer.getBotLanguage();
    const embed = embedBuilder.buildForAdmin(discordServer, i18n.__({ phrase: 'generic.cancel', locale }), i18n.__({ phrase: 'configure.tokenroles.add.canceled', locale }, roleToAdd), 'configure-tokenroles-add');
    await interaction.update({ embeds: [embed], components: [] });
  },
};
