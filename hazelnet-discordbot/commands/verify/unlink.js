const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      if (mainAccount.settings?.BLACKLISTED !== 'true') {
        const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild.id);
        const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
        if (currentMemberData) {
          await interaction.client.services.discordserver.disconnectExternalAccount(interaction.guild.id, currentMemberData.externalAccountId);
          const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.unlink.messageTitle', locale }), i18n.__({ phrase: 'verify.unlink.success', locale }), 'verify-unlink');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.unlink.messageTitle', locale }), i18n.__({ phrase: 'verify.unlink.notLinked', locale }), 'verify-unlink');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-link');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while unlinking your account.', ephemeral: true });
    }
  },
};
