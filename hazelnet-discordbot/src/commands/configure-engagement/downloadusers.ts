import i18n from 'i18n';
import { stringify } from 'csv-stringify/sync';
import { AttachmentBuilder, GuildMember, Role } from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

interface ConfigureInfoDownloadusersCommand extends BotSubcommand {
  buildFileToDownload(users: GuildMember[], role: Role): AttachmentBuilder
  getCsvContent(users: GuildMember[]): any[]
}

export default <ConfigureInfoDownloadusersCommand> {
  async execute(interaction) {
    const targetRole = interaction.options.getRole('target-role', true) as Role;
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const guild = await interaction.client.guilds.fetch(discordServer.guildId);
      const allUsers = await guild.members.fetch();
      const usersToDownload = [];
      for (let i = 0; i < allUsers.size; i += 1) {
        try {
          const member = allUsers.at(i)!;
          if (member.roles.cache.some((role) => role.id === targetRole.id)) {
            usersToDownload.push(member);
          }
        } catch (error) {
          // Ignore
        }
      }
      if (usersToDownload.length) {
        const fileToDownload = this.buildFileToDownload(usersToDownload, targetRole);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-engagement downloadusers', i18n.__({ phrase: 'configure.engagement.downloadusers.success', locale }, { userCount: `${usersToDownload.length}`, role: targetRole.id }), 'configure-engagement-downloadusers');
        await interaction.editReply({
          components: [],
          embeds: [embed],
          files: [fileToDownload],
        });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-engagement downloadusers', i18n.__({ phrase: 'configure.engagement.downloadusers.noUsersInRole', locale }, { role: targetRole.id }), 'configure-engagement-downloadusers');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while downloading user list from role. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  buildFileToDownload(users, role) {
    const csvList = this.getCsvContent(users);
    const csv = stringify(csvList);
    const csvBuffer = Buffer.from(csv, 'utf8');
    const fileToDownload = new AttachmentBuilder(csvBuffer, { name: `hazelnet-${role.guild.id}-userlist-role-${role.name}.csv` });
    fileToDownload.setDescription('Vibrant Users by Role Download');
    return fileToDownload;
  },
  getCsvContent(users) {
    return [['member', 'joinedAt'], ...users.map((member) => ([member.user.tag, member.joinedAt?.toISOString()]))];
  },
};
