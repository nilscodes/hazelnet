const i18n = require('i18n');
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const datetime = require('../../utility/datetime');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const refillAmount = interaction.options.getInteger('refill-amount');

      const existingIncomingPayment = await interaction.client.services.discordserver.getCurrentPayment(interaction.guild.id);

      if (!existingIncomingPayment) {
        if (refillAmount >= 5) {
          const incomingPayment = await interaction.client.services.discordserver.requestIncomingPayment(interaction.guild.id, refillAmount * 1000000);
          const expirationDateFormatted = datetime.getUTCDateFormatted(incomingPayment, 'validBefore');
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.success', locale }, { incomingPayment, amount: incomingPayment.amount / 1000000, expirationDateFormatted }), 'configure-premium-refill');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.errorAmountToSmall', locale }, { minimumAmount: 5, refillAmount }), 'configure-premium-refill');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('configure-premium/refill/canceloutstanding')
              .setLabel(i18n.__({ phrase: 'configure.premium.refill.cancelOutstanding', locale }))
              .setStyle('DANGER'),
          ),
        ];
        const expirationDateFormatted = datetime.getUTCDateFormatted(existingIncomingPayment, 'validBefore');
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.errorAlreadyPending', locale }, { existingIncomingPayment, amount: existingIncomingPayment.amount / 1000000, expirationDateFormatted }), 'configure-premium-refill');
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Error while refilling premium balance on this server.', ephemeral: true });
      } else {
        await interaction.followUp({ content: 'Error while refilling premium balance on this server.', ephemeral: true });
      }
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-premium/refill/canceloutstanding') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      await interaction.client.services.discordserver.cancelIncomingPayment(interaction.guild.id);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.cancelSuccess', locale }), 'configure-premium-refill');
      await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
    }
  },
};
