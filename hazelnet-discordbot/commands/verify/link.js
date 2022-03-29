const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild.id);
      const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
      if (!currentMemberData) {
        await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.link.success', locale: useLocale }), 'verify-link');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.link.notLinked', locale: useLocale }), 'verify-link');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while linking your account.', ephemeral: true });
    }
  },
};
