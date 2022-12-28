import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const refillAmount = interaction.options.getInteger('refill-amount', true);

      const existingIncomingPayment = await interaction.client.services.discordserver.getCurrentPayment(interaction.guild!.id);

      if (!existingIncomingPayment) {
        if (refillAmount >= 5) {
          const incomingPayment = await interaction.client.services.discordserver.requestIncomingPayment(interaction.guild!.id, refillAmount * 1000000);
          const expirationDateTimestamp = Math.floor(new Date(incomingPayment.validBefore).getTime() / 1000);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.success', locale }, { incomingPayment, amount: incomingPayment.amount / 1000000, expirationDateTimestamp } as any), 'configure-premium-refill');
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.errorAmountToSmall', locale }, { minimumAmount: 5, refillAmount } as any), 'configure-premium-refill');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('configure-premium/refill/canceloutstanding')
              .setLabel(i18n.__({ phrase: 'configure.premium.refill.cancelOutstanding', locale }))
              .setStyle(ButtonStyle.Danger),
          ),
        ];
        const expirationDateTimestamp = Math.floor(new Date(existingIncomingPayment.validBefore).getTime() / 1000);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.errorAlreadyPending', locale }, { existingIncomingPayment, amount: existingIncomingPayment.amount / 1000000, expirationDateTimestamp } as any), 'configure-premium-refill');
        await interaction.editReply({ embeds: [embed], components });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Error while refilling premium balance on this server.' });
      } else {
        await interaction.followUp({ content: 'Error while refilling premium balance on this server.', ephemeral: true });
      }
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-premium/refill/canceloutstanding') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      await interaction.client.services.discordserver.cancelIncomingPayment(interaction.guild!.id);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-premium refill', i18n.__({ phrase: 'configure.premium.refill.cancelSuccess', locale }), 'configure-premium-refill');
      await interaction.editReply({ components: [], embeds: [embed] });
    }
  },
};
