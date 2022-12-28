import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const inactivityDays = interaction.options.getInteger('inactivity-days', true);
    const reminderChannel = interaction.options.getChannel('reminderchannel', true);
    const reminderMessage = interaction.options.getString('remindermessage');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const freeFeatures = discordServer.settings?.FREE_FEATURES?.split(',') ?? [];
      if (discordServer.premium || freeFeatures.includes('configure-engagement-activityreminder')) {
        if (!newStatus || inactivityDays >= 1) {
          if (newStatus) {
            const reminderSettings = `${reminderChannel.id},${inactivityDays * 86400}`;
            await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ACTIVITY_REMINDER', reminderSettings);
            if (reminderMessage) {
              await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ACTIVITY_REMINDER_MESSAGE', reminderMessage);
            } else {
              await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'ACTIVITY_REMINDER_MESSAGE');
            }
          } else {
            await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'ACTIVITY_REMINDER');
            await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, 'ACTIVITY_REMINDER_MESSAGE');
          }
          const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.engagement.activityreminder.activityreminderOn' : 'configure.engagement.activityreminder.activityreminderOff'), locale }, { reminderChannel: reminderChannel.id, inactivityDays } as any);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-engagement activityreminder', changeMessage, 'configure-engagement-activityreminder');
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-engagement activityreminder', i18n.__({ phrase: 'configure.engagement.activityreminder.minimumActivityDays', locale }), 'configure-engagement-activityreminder');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-engagement activityreminder', i18n.__({ phrase: 'configure.engagement.activityreminder.noPremium', locale }), 'configure-engagement-activityreminder');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adjusting activity reminder setting for your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
