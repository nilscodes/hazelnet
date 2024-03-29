import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      if (mainAccount.settings?.BLACKLISTED !== 'true') {
        const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild!.id);
        const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
        const importedVerifications = await interaction.client.services.externalaccounts.importVerifications(externalAccount.id);
        const importedFields = [];
        if (importedVerifications.length) {
          const importedVerificationsText = importedVerifications.map((importedVerification) => i18n.__({ phrase: 'verify.link.importEntry', locale }, { address: importedVerification.address.substring(0, 15), source: importedVerification.source })).join('\n');
          importedFields.push({
            name: i18n.__({ phrase: 'verify.link.importSuccessTitle', locale }),
            value: i18n.__({ phrase: 'verify.link.importSuccess', locale }, { importedVerificationsText }),
          });
        }
        if (!currentMemberData) {
          await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
          const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), i18n.__({ phrase: 'verify.link.success', locale }), 'verify-link', importedFields);
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), i18n.__({ phrase: 'verify.link.notLinked', locale }), 'verify-link', importedFields);
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-link');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while linking your account.' });
    }
  },
};
