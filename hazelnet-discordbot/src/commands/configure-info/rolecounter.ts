import { BotSubcommand } from "../../utility/commandtypes";
import i18n from 'i18n';
import { BaseGuildVoiceChannel, ChannelType } from "discord.js";
import embedBuilder from '../../utility/embedbuilder';
import roleassignments from '../../utility/roleassignments';

export default <BotSubcommand> {
  async execute(interaction) {
    const role = interaction.options.getRole('role', true);
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const roleCountChannel = interaction.options.getChannel('channel', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (roleCountChannel.type === ChannelType.GuildVoice || newStatus === false) {
        try {
          const freeFeatures = discordServer.settings?.FREE_FEATURES?.split(',') ?? [];
          if (discordServer.premium || freeFeatures.includes('configure-info-rolecounter')) {
            if (newStatus !== false) {
              const guild = await interaction.client.guilds.fetch(interaction.guild!.id);
              const roleCountChannelName = await roleassignments.getRoleCountChannelName(guild, role);
              await (roleCountChannel as BaseGuildVoiceChannel).setName(roleCountChannelName);
            }
            if (newStatus) {
              await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, `WIDGET_ROLE_COUNTER_${role.id}`, `${roleCountChannel.id}`);
            } else {
              await interaction.client.services.discordserver.deleteDiscordServerSetting(interaction.guild!.id, `WIDGET_ROLE_COUNTER_${role.id}`);
            }
            const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.info.rolecounter.rolecounterOn' : 'configure.info.rolecounter.rolecounterOff'), locale }, { rolecounter: roleCountChannel.id, roleId: role.id });
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info rolecounter', changeMessage, 'configure-info-rolecounter');
            await interaction.editReply({ embeds: [embed] });
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info rolecounter', i18n.__({ phrase: 'configure.info.rolecounter.noPremium', locale }), 'configure-info-rolecounter');
        await interaction.editReply({ embeds: [embed] });
          }
        } catch (error) {
          interaction.client.logger.info(error);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info rolecounter', i18n.__({ phrase: 'configure.info.rolecounter.errorChannelPermissions', locale }), 'configure-info-rolecounter');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info rolecounter', i18n.__({ phrase: 'configure.info.rolecounter.errorWrongChannelType', locale }), 'configure-info-rolecounter');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding a role counter to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};


