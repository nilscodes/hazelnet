const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const datetime = require('../../utility/datetime');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const premiumInfo = await interaction.client.services.discordserver.getPremiumInfo(interaction.guild.id);
      const premiumUntilFormatted = datetime.getUTCDateFormatted(premiumInfo, 'premiumUntil');
      const premiumFields = [{
        name: i18n.__({ phrase: 'configure.premium.status.premiumStatus', locale }),
        value: i18n.__({ phrase: (premiumInfo.premiumUntil ? 'configure.premium.status.premiumStatusYes' : 'configure.premium.status.premiumStatusNo'), locale }, { premiumUntilFormatted }),
      }];
      if (premiumInfo.lastBillingTime) {
        const lastBillingTimeFormatted = datetime.getUTCDateFormatted(premiumInfo, 'lastBillingTime');
        premiumFields.push({
          name: i18n.__({ phrase: 'configure.premium.status.lastBill', locale }),
          value: i18n.__({ phrase: 'configure.premium.status.lastBillInfo', locale }, { ...premiumInfo, lastBillingAmount: Math.round(premiumInfo.lastBillingAmount / 100000) / 10, lastBillingTimeFormatted }),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium status', i18n.__({ phrase: 'configure.premium.status.purpose', locale }), 'configure-premium-status', premiumFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while viewing premium status. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
