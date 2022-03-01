const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const botfeatures = require('../../utility/botfeatures');
const commandregistration = require('../../utility/commandregistration');
const commandpermissions = require('../../utility/commandpermissions');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const features = discordServer.settings.ENABLED_COMMAND_TAGS.split(',');
      const { components, embed } = this.buildInterface(discordServer, useLocale, features);
      await interaction.editReply({ components, embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server features. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  buildInterface(discordServer, useLocale, commands) {
    const selectedFeatures = this.buildFeatureList(commands, useLocale);

    const featureOptions = botfeatures.getFeatureOptions(discordServer);
    const components = [
      new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-settings/features/change')
            .setPlaceholder(i18n.__({ phrase: 'start.chooseFeatures', locale: useLocale }))
            .addOptions(featureOptions)
            .setMinValues(1)
            .setMaxValues(featureOptions.length),
        ),
      new MessageActionRow()
        .addComponents(
          new MessageButton()
            .setCustomId('configure-settings/features/confirm')
            .setLabel(i18n.__({ phrase: 'configure.settings.features.saveSettings', locale: useLocale }))
            .setStyle('PRIMARY'),
        ),
    ];

    const settingFields = [
      {
        name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale: useLocale }),
        value: `${i18n.__({ phrase: 'start.configureFeaturesText', locale: useLocale })}\n\n${selectedFeatures}\n\n${i18n.__({ phrase: 'configure.settings.features.chooseFeatures', locale: useLocale })}`,
      },
    ];

    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings features', i18n.__({ phrase: 'configure.settings.features.purpose', locale: useLocale }), 'configure-settings-features', settingFields);
    return { components, embed };
  },
  buildFeatureList(commands, useLocale) {
    const selectedCommandTagsPhrases = commands.map((commandTag) => (`features.${commandTag}`));
    const selectedFeatureList = selectedCommandTagsPhrases.map((phrase) => (i18n.__({ phrase: 'start.selectedFeatureItem', locale: useLocale }, { feature: i18n.__({ phrase, locale: useLocale }) }))).join('\n');
    const selectedFeatures = i18n.__({ phrase: 'start.selectedFeatures', locale: useLocale }, { selectedFeatureList });
    return selectedFeatures;
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-settings/features/change') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      try {
        this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, interaction.values);
        const { embed } = this.buildInterface(discordServer, useLocale, interaction.values);
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        interaction.client.logger.error(error);
      }
    }
  },
  async executeButton(interaction) {
    if (interaction.customId === 'configure-settings/features/confirm') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const newFeatures = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
      await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'ENABLED_COMMAND_TAGS', newFeatures);
      await commandregistration.registerMainCommands(newFeatures, interaction.client, interaction.guild.id);
      await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);
      const selectedFeatures = this.buildFeatureList(newFeatures, useLocale);
      const settingFields = [
        {
          name: i18n.__({ phrase: 'start.configureFeaturesTitle', locale: useLocale }),
          value: selectedFeatures,
        },
      ];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-settings features', i18n.__({ phrase: 'configure.settings.features.success', locale: useLocale }), 'configure-settings-features', settingFields);
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
  },
};
