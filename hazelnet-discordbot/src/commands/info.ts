import { SlashCommandBuilder, APIEmbedField, ActionRowBuilder, ButtonBuilder, MessageActionRowComponentBuilder, ButtonStyle, } from 'discord.js';
import i18n from 'i18n';
import { BotCommand } from '../utility/commandtypes';
import embedBuilder from '../utility/embedbuilder';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';

export default <BotCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('info', locale);
    return new SlashCommandBuilder()
      .setName('info')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const stakepools = await interaction.client.services.discordserver.listStakepools(interaction.guild!.id);;
      const dReps = await interaction.client.services.discordserver.listDReps(interaction.guild!.id);
      const guild = await interaction.client.guilds.fetch(discordServer.guildId);
      const locale = discordServer.getBotLanguage();
      let infoText = i18n.__({ phrase: 'info.infoBaseText', locale });
      if (discordServer.premium && discordServer.settings?.INFO_CONTENT_TEXT) {
        infoText = discordServer.settings?.INFO_CONTENT_TEXT;
      }
      let stakepoolFields = [] as APIEmbedField[];
      if (stakepools.length) {
        infoText += `\n\n${i18n.__n({ singular: 'info.stakepoolsBaseText.one', plural: 'info.stakepoolsBaseText.other', locale }, stakepools.length)}`;
        const infoMessageType = stakepools.length > 6 ? 'info.stakepoolDetailsShort' : 'info.stakepoolDetails';
        stakepoolFields = stakepools.map((stakepool) => ({
          name: `${stakepool.info?.name} (${stakepool.info?.ticker})`,
          value: i18n.__({ phrase: infoMessageType, locale }, stakepool.info),
        }));
      }

      let dRepFields = [] as APIEmbedField[];
      if (dReps.length) {
        infoText += `\n\n${i18n.__n({ singular: 'info.dRepsBaseText.one', plural: 'info.dRepsBaseText.other', locale }, dReps.length)}`;
        const infoMessageType = dReps.length > 6 ? 'info.dRepDetailsShort' : 'info.dRepDetails';
        dRepFields = dReps.map((dRep) => ({
          name: `${dRep.info?.name || i18n.__({ phrase: 'configure.drep.list.dRepNameEmpty', locale })}`,
          value: i18n.__({ phrase: infoMessageType, locale }, dRep.info),
        }));
      }

      const infoFields = [...stakepoolFields, ...dRepFields];

      let infoImage;
      let infoTitle = i18n.__({ phrase: 'info.welcomeTitle', locale }, { guildName: guild.name });
      let components;

      if (!discordServer.premium) {
        infoFields.push({
          name: i18n.__({ phrase: 'about.title', locale }),
          value: i18n.__({ phrase: 'about.info', locale }),
        });
      } else {
        infoImage = discordServer.settings?.INFO_CONTENT_IMAGE;
        if (discordServer.settings?.INFO_CONTENT_TITLE) {
          infoTitle = discordServer.settings?.INFO_CONTENT_TITLE;
        }
        if (discordServer.settings?.INFO_CONTENT_BUTTONS) {
          try {
            const buttonData = JSON.parse(discordServer.settings.INFO_CONTENT_BUTTONS) as any[];
            if (buttonData.length) {
              components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                  buttonData.map((button) => (
                    new ButtonBuilder()
                      .setLabel(button.label)
                      .setURL(button.url)
                      .setStyle(ButtonStyle.Link)
                  )),
                )];
            }
          } catch (badJson) {
            interaction.client.logger.warn({ msg: `Problem when parsing JSON for custom buttons for /info command for guild ${guild.id}`, err: badJson });
          }
        }
      }
      const embed = embedBuilder.buildForUser(discordServer, infoTitle, infoText, 'info', infoFields, infoImage);
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server info.' });
    }
  },
};
