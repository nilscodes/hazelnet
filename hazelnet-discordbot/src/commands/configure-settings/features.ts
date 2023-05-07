import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { DiscordServer } from '@vibrantnet/core';
import { AugmentedButtonInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';
import botfeatures from '../../utility/botfeatures';
import commandregistration from '../../utility/commandregistration';
import { EmbedAndComponents } from '../../utility/sharedtypes';

interface ConfigureSettingsFeaturesCommand extends BotSubcommand {
  cache: NodeCache
  buildInterface(discordServer: DiscordServer, commands: string[]): EmbedAndComponents
  buildFeatureList(commands: string[], locale: string): string
  saveSettings(interaction: AugmentedButtonInteraction | AugmentedSelectMenuInteraction, newFeatures: string[], discordServer: DiscordServer): void
}

export default <ConfigureSettingsFeaturesCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const features = discordServer.settings.ENABLED_COMMAND_TAGS.split(',');
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, features);
      const { components, embed } = this.buildInterface(discordServer, features);
      await interaction.editReply({ components, embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server features. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  buildInterface(discordServer, commands) {
    const locale = discordServer.getBotLanguage();
    const selectedFeatures = this.buildFeatureList(commands, locale);

    const featureOptions = botfeatures.getFeatureOptions(discordServer);
    const components = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-settings/features/change')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseFeatures', locale }))
            .addOptions(featureOptions)
            .setMinValues(1)
            .setMaxValues(featureOptions.length),
        ),
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('configure-settings/features/confirm')
            .setLabel(i18n.__({ phrase: 'configure.settings.features.saveSettings', locale }))
            .setStyle(ButtonStyle.Primary),
        ),
    ];

    const settingFields = [
      {
        name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale }),
        value: `${i18n.__({ phrase: 'start.configureFeaturesText', locale })}\n\n${selectedFeatures}\n\n${i18n.__({ phrase: 'configure.settings.features.chooseFeatures', locale })}`,
      },
    ];

    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings features', i18n.__({ phrase: 'configure.settings.features.purpose', locale }), 'configure-settings-features', settingFields);
    return { components, embed };
  },
  buildFeatureList(commands, locale) {
    const selectedCommandTagsPhrases = commands.map((commandTag) => (`features.${commandTag}`));
    const selectedFeatureList = selectedCommandTagsPhrases.map((phrase) => (i18n.__({ phrase: 'start.selectedFeatureItem', locale }, { feature: i18n.__({ phrase, locale }) }))).join('\n');
    const selectedFeatures = i18n.__({ phrase: 'start.selectedFeatures', locale }, { selectedFeatureList });
    return selectedFeatures;
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-settings/features/change') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      try {
        const newFeatures = interaction.values;
        const { embed } = this.buildInterface(discordServer, interaction.values);
        await interaction.editReply({ embeds: [embed], components: [] });
        this.saveSettings(interaction, newFeatures, discordServer);
      } catch (error) {
        interaction.client.logger.error(error);
      }
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-settings/features/confirm') {
      await interaction.deferUpdate();
      await interaction.editReply({ components: [] });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const newFeatures = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as string[];
      await this.saveSettings(interaction, newFeatures, discordServer);
    }
  },
  async saveSettings(interaction, newFeatures, discordServer) {
    const locale = discordServer.getBotLanguage();
    await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ENABLED_COMMAND_TAGS', newFeatures.join(','));
    await commandregistration.registerMainCommands(newFeatures, interaction.client, interaction.guild!.id);
    const selectedFeatures = this.buildFeatureList(newFeatures, locale);
    const settingFields = [
      {
        name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale }),
        value: selectedFeatures,
      },
    ];
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings features', i18n.__({ phrase: 'configure.settings.features.success', locale }), 'configure-settings-features', settingFields);
    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },
};
