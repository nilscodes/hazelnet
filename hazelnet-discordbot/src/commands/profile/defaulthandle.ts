import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder,
} from 'discord.js';
import i18n from 'i18n';
import { Account, DiscordServer, adahandle } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import { AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';

interface DefaultHandleCommand extends BotSubcommand {
  getInteractionComponents(availableHandles: string[], currentDefaultHandle: string, locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
  setNewDefaultHandle(interaction: AugmentedSelectMenuInteraction | AugmentedCommandInteraction, mainAccount: Account, newDefaultHandle: string, discordServer: DiscordServer): Promise<EmbedBuilder>
}

const DEFAULT_HANDLE_SETTING = 'DEFAULT_HANDLE';

export default <DefaultHandleCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      let newDefaultHandle = interaction.options.getString('handle');
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      const allAvailableHandles: string[] = (await interaction.client.services.accounts.getHandlesForAccount(mainAccount.id))
        .map((handleData) => `$${handleData.handle}`)
        .sort((handleA: string, handleB: string) => handleA.length - handleB.length);
      const availableHandles = allAvailableHandles.slice(0, 25);
      const handleFields = [];
      if (newDefaultHandle !== null && newDefaultHandle[0] !== '$') {
        newDefaultHandle = `$${newDefaultHandle}`;
      }
      const currentDefaultHandle = mainAccount.settings[DEFAULT_HANDLE_SETTING];
      if (newDefaultHandle) {
        if (adahandle.isHandle(newDefaultHandle)) {
          if (allAvailableHandles.includes(newDefaultHandle)) {
            const embed = await this.setNewDefaultHandle(interaction, mainAccount, newDefaultHandle, discordServer);
            await interaction.editReply({ embeds: [embed] });
          } else {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.defaulthandle.messageTitle', locale }), i18n.__({ phrase: 'profile.defaulthandle.errorNotOwned', locale }, { handle: newDefaultHandle }), 'profile-defaulthandle');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.defaulthandle.messageTitle', locale }), i18n.__({ phrase: 'profile.defaulthandle.errorNoHandle', locale }, { handle: newDefaultHandle }), 'profile-defaulthandle');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        if (currentDefaultHandle) {
          const currentDefaultHandleOwned = availableHandles.includes(currentDefaultHandle);
          handleFields.push({
            name: i18n.__({ phrase: 'profile.defaulthandle.currentDefaultHandleTitle', locale }),
            value: i18n.__({ phrase: 'profile.defaulthandle.currentDefaultHandle', locale }, { handle: currentDefaultHandle }) + (!currentDefaultHandleOwned ? `\n${i18n.__({ phrase: 'profile.defaulthandle.currentDefaultHandleNotOwned', locale })}` : ''),
          });
        }
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.defaulthandle.messageTitle', locale }), i18n.__({ phrase: 'profile.defaulthandle.purpose', locale }), 'profile-defaulthandle', handleFields);
        const components = this.getInteractionComponents(availableHandles, currentDefaultHandle, locale);
        await interaction.editReply({ components, embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error({ guildId: interaction.guild?.id, error });
      await interaction.editReply({ content: 'Error while setting default handle for user. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  getInteractionComponents(availableHandles, currentDefaultHandle, locale) {
    const actions = [];
    if (availableHandles.length) {
      actions.push(new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('profile/defaulthandle/complete')
            .setPlaceholder(i18n.__({ phrase: 'profile.defaulthandle.chooseHandle', locale }))
            .addOptions(availableHandles.map((handle) => ({
              label: handle,
              value: handle,
            }))),
        ));
    }
    if (currentDefaultHandle) {
      actions.push(new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('profile/defaulthandle/reset')
            .setLabel(i18n.__({ phrase: 'profile.defaulthandle.removeDefaultHandle', locale }))
            .setStyle(ButtonStyle.Danger),
        ));
    }
    return actions;
  },
  async executeButton(interaction) {
    if (interaction.customId === 'profile/defaulthandle/reset') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      await interaction.client.services.accounts.deleteAccountSetting(mainAccount.id, DEFAULT_HANDLE_SETTING);
      const handle = mainAccount.settings[DEFAULT_HANDLE_SETTING]
      delete mainAccount.settings[DEFAULT_HANDLE_SETTING];
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.defaulthandle.messageTitle', locale }), i18n.__({ phrase: 'profile.defaulthandle.resetSuccess', locale }, { handle }), 'profile-defaulthandle');
      await interaction.update({ components: [], embeds: [embed] });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'profile/defaulthandle/complete') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);

      const newDefaultHandle = interaction.values[0];
      const embed = await this.setNewDefaultHandle(interaction, mainAccount, newDefaultHandle, discordServer);
      await interaction.update({ components: [], embeds: [embed] });
    }
  },
  async setNewDefaultHandle(interaction, mainAccount, newDefaultHandle, discordServer) {
    const locale = discordServer.getBotLanguage();
    await interaction.client.services.accounts.updateAccountSetting(mainAccount.id, DEFAULT_HANDLE_SETTING, newDefaultHandle);
    mainAccount.settings[DEFAULT_HANDLE_SETTING] = newDefaultHandle;
    return embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'profile.defaulthandle.messageTitle', locale }), i18n.__({ phrase: 'profile.defaulthandle.success', locale }, { handle: newDefaultHandle }), 'profile-defaulthandle');
  },
};
