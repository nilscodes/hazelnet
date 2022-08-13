package io.hazelnet.community.services

import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.cnftjungle.AssetInfo
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
import io.hazelnet.community.services.external.CnftJungleService
import io.hazelnet.marketplace.data.SaleAnnouncement
import io.hazelnet.marketplace.data.SalesInfo
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import reactor.core.publisher.Mono

@Service
class DiscordMarketplaceChannelPublisher(
    private val discordMarketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val cnftJungleService: CnftJungleService,
    private val connectService: ConnectService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
) {

    @RabbitListener(queues = ["sales"])
    fun processSales(sale: SalesInfo) {
        val marketplaceChannelsForPolicy = discordMarketplaceService.listAllMarketplaceChannels(sale.policyId)
        val blockchainAssetInfo = connectService.getMultiAssetInfoSingle(sale.policyId, sale.assetNameHex)
        val cnftJungleAssetInfo = cnftJungleService.getAssetInfo(sale.policyId, sale.assetNameHex)
            .onErrorReturn(AssetInfo(assetId = "${sale.policyId}${sale.assetNameHex}", policyId = sale.policyId))
        val combinedAssetInfo = Mono.zip(blockchainAssetInfo, cnftJungleAssetInfo)
            .block()!!
        marketplaceChannelsForPolicy.mapNotNull {
            if (it.minimumValue == null || sale.price > it.minimumValue!!) {
                SaleAnnouncement(
                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                    channelId = it.channelId,
                    policyId = sale.policyId,
                    assetNameHex = sale.assetNameHex,
                    assetName = combinedAssetInfo.t1.assetName,
                    displayName = getItemNameFromAssetInfo(combinedAssetInfo.t1),
                    source = sale.source,
                    marketplaceAssetUrl = sale.marketplaceAssetUrl,
                    assetImageUrl = getImageUrlFromAssetInfo(config, combinedAssetInfo.t1),
                    price = sale.price,
                    saleDate = sale.saleDate,
                    rarityRank = combinedAssetInfo.t2.rarityRank,
                    type = sale.type,
                )
            } else {
                null
            }
        }
            .forEach { rabbitTemplate.convertAndSend("saleannouncements", it) }
    }
}