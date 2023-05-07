import i18n from 'i18n';
import { BanResponseType, BanType, cardanoaddress } from '@vibrantnet/core';
import bans from '../../utility/bans';
import cardanotoken from '../../utility/cardanotoken';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const type = interaction.options.getString('ban-type', true) as BanType;
    const pattern = interaction.options.getString('ban-pattern', true);
    const reason = interaction.options.getString('ban-reason', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const proposedBanFields = [{
        name: i18n.__({ phrase: 'configure.bans.add.proposedBanReason', locale }),
        value: reason.length ? reason : i18n.__({ phrase: 'configure.bans.list.banReasonNoneGiven', locale }),
      }];
      if (type === BanType.ASSET_FINGERPRINT_BAN && !cardanotoken.isValidAssetFingerprint(pattern)) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans add', i18n.__({ phrase: 'configure.bans.add.banFailAssetFingerprint', locale }, { pattern }), 'configure-bans-add', proposedBanFields);
        await interaction.editReply({ embeds: [embed] });
      } else if (type === BanType.STAKE_ADDRESS_BAN && !cardanoaddress.isStakeAddress(pattern)) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans add', i18n.__({ phrase: 'configure.bans.add.banFailStakeAddress', locale }, { pattern }), 'configure-bans-add', proposedBanFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
        const newBanData = {
          id: 0,
          creator: externalAccount.id,
          type,
          responseType: BanResponseType.PREVENT_ROLES,
          pattern,
          reason,
        };
        const newBan = await interaction.client.services.discordbans.addBan(interaction.guild!.id, newBanData);
        const banFields = bans.getBanDetailsFields(newBan, externalAccount, locale);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans add', i18n.__({ phrase: 'configure.bans.add.success', locale }), 'configure-bans-add', banFields);
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding ban to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
