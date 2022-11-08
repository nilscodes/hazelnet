const i18n = require('i18n');
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const roleassignments = require('../../utility/roleassignments');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccountOfOtherUser = await interaction.client.services.externalaccounts.getExternalDiscordAccount(user.id);
      if (externalAccountOfOtherUser) {
        const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccountOfOtherUser.id);
        if (mainAccount.settings?.BLACKLISTED !== 'true') {
          const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild.id);
          const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccountOfOtherUser.id);
          if (currentMemberData) {
            const roleAssignments = await interaction.client.services.discordserver.getEligibleDelegatorRolesOfUser(interaction.guild.id, externalAccountOfOtherUser.id);
            const member = await interaction.guild.members.fetch(user.id);
            const { roleData, missingRoleField } = roleassignments.getEligibleAndMissingRoles(roleAssignments, member, locale, 'delegatorroles');
            const components = [];
            if (missingRoleField !== null) {
              components.push(new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(`configure-delegatorroles/test/assignroles.${externalAccountOfOtherUser.id}`)
                    .setLabel(i18n.__({ phrase: 'configure.delegatorroles.test.assignRoles', locale }))
                    .setStyle(ButtonStyle.Primary),
                ));
            }
            const embed = embedBuilder.buildForAdmin(
              discordServer,
              '/configure-delegatorroles test',
              i18n.__({ phrase: 'configure.delegatorroles.test.purpose', locale }, { user, roleData }),
              'configure-delegatorroles-test',
              missingRoleField,
            );
            await interaction.editReply({ embeds: [embed], components });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles test', i18n.__({ phrase: 'configure.delegatorroles.test.notLinkedError', locale }), 'configure-delegatorroles-test');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles test', i18n.__({ phrase: 'configure.delegatorroles.test.blacklistedError', locale }), 'configure-delegatorroles-test');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles test', i18n.__({ phrase: 'configure.delegatorroles.test.notLinkedError', locale }), 'configure-delegatorroles-test');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while testing role assignments for user with ID ${user.id} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId.indexOf('configure-delegatorroles/test/assignroles') === 0) {
      await interaction.deferUpdate();
      await interaction.editReply({ components: [] });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccountIdOfOtherUser = interaction.customId.split('.')[1];
      await interaction.client.services.discordserver.queueDelegatorRoleAssignments(interaction.guild.id, externalAccountIdOfOtherUser);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-delegatorroles test', i18n.__({ phrase: 'configure.delegatorroles.test.queueSuccess', locale }), 'configure-delegatorroles-test');
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};
