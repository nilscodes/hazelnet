import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import roleassignments from '../../utility/roleassignments';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccountOfOtherUser = await interaction.client.services.externalaccounts.getExternalDiscordAccount(user.id);
      if (externalAccountOfOtherUser) {
        const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccountOfOtherUser.id);
        if (mainAccount.settings?.BLACKLISTED !== 'true') {
          const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild!.id);
          const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccountOfOtherUser.id);
          if (currentMemberData) {
            const roleAssignments = await interaction.client.services.discordserver.getEligibleTokenRolesOfUser(interaction.guild!.id, externalAccountOfOtherUser.id);
            const member = await interaction.guild!.members.fetch(user.id);
            const { roleData, missingRoleField } = roleassignments.getEligibleAndMissingRoles(roleAssignments, member, locale, 'tokenroles');
            const components = [];
            const missingRoleFields = [];
            if (missingRoleField !== null) {
              missingRoleFields.push(missingRoleField);
              components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(`configure-tokenroles/test/assignroles.${externalAccountOfOtherUser.id}`)
                    .setLabel(i18n.__({ phrase: 'configure.tokenroles.test.assignRoles', locale }))
                    .setStyle(ButtonStyle.Primary),
                ));
            } else {
              missingRoleFields.push({
                name: i18n.__({ phrase: `configure.tokenroles.test.noMissingRolesTitle`, locale }),
                value: i18n.__({ phrase: `configure.tokenroles.test.noMissingRoles`, locale }),
              });
            }
            const embed = embedBuilder.buildForAdmin(
              discordServer,
              '/configure-tokenroles test',
              i18n.__({ phrase: 'configure.tokenroles.test.purpose', locale }, { user, roleData } as any),
              'configure-tokenroles-test',
              missingRoleFields,
            );
            await interaction.editReply({ embeds: [embed], components });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles test', i18n.__({ phrase: 'configure.tokenroles.test.notLinkedError', locale }), 'configure-tokenroles-test');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles test', i18n.__({ phrase: 'configure.tokenroles.test.blacklistedError', locale }), 'configure-tokenroles-test');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles test', i18n.__({ phrase: 'configure.tokenroles.test.notLinkedError', locale }), 'configure-tokenroles-test');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while testing role assignments for user with ID ${user.id} from your server. Please contact your bot admin via https://www.vibrantnet.io.` });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId.indexOf('configure-tokenroles/test/assignroles') === 0) {
      await interaction.deferUpdate();
      await interaction.editReply({ components: [] });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccountIdOfOtherUser = interaction.customId.split('.')[1];
      await interaction.client.services.discordserver.queueTokenRoleAssignments(interaction.guild!.id, externalAccountIdOfOtherUser);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles test', i18n.__({ phrase: 'configure.tokenroles.test.queueSuccess', locale }), 'configure-tokenroles-test');
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};
