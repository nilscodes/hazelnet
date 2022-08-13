package io.hazelnet.community.services

import com.fasterxml.jackson.databind.ObjectMapper
import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.oura.OuraMetadataEvent
import io.hazelnet.community.data.external.oura.OuraMintEvent
import io.hazelnet.community.data.getImageUrlFromAssetInfo
import io.hazelnet.community.data.getItemNameFromAssetInfo
import io.hazelnet.marketplace.data.Marketplace
import io.hazelnet.marketplace.data.SaleAnnouncement
import io.hazelnet.marketplace.data.SalesType
import io.hazelnet.shared.decodeHex
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.util.*
import java.util.concurrent.ConcurrentHashMap

private val logger = KotlinLogging.logger {}

const val KEEP_MINT_EVENTS_WITHOUT_METADATA_MILLISECONDS = 120000L
const val KEEP_METADATA_FOR_MILLISECONDS = 300000L

@Service
class OuraEventService(
    private val marketplaceService: DiscordMarketplaceService,
    private val discordServerService: DiscordServerService,
    private val rabbitTemplate: RabbitTemplate,
    private val config: CommunityApplicationConfiguration,
    meterRegistry: MeterRegistry,
) {
    private val mintQueue: LinkedList<OuraMintEvent> = LinkedList()
    private val metadataMap: MutableMap<String, OuraMetadataEvent> = ConcurrentHashMap()

    init {
        Gauge.builder("oura_mint_queue_size", mintQueue) {
            it.size.toDouble()
        }
            .description("Number of unprocessed Oura mint events")
            .register(meterRegistry)
        Gauge.builder("oura_metadata_map_size", metadataMap) {
            it.size.toDouble()
        }
            .description("Number of stored Oura metadata events")
            .register(meterRegistry)
    }

    fun receiveEvent(ouraEvent: Map<String, Any>) {
        try {
            if (ouraEvent["variant"] == "Mint") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val mint = (ouraEvent["mint"] as Map<String, Any>)
                val mintEvent = OuraMintEvent(
                    date = Date(context["timestamp"].toString().toLong() * 1000),
                    transactionHash = context["tx_hash"].toString(),
                    policyId = mint["policy"].toString(),
                    assetNameHex = mint["asset"].toString(),
                    quantity = mint["quantity"].toString().toLong()
                )
                mintQueue.add(mintEvent)
            } else if (ouraEvent["variant"] == "Metadata") {
                val context = (ouraEvent["context"] as Map<String, Any>)
                val metadata = (ouraEvent["metadata"] as Map<String, Any>)
                val metadataEvent = OuraMetadataEvent(
                    date = Date(context["timestamp"].toString().toLong() * 1000),
                    transactionHash = context["tx_hash"].toString(),
                    metadata = metadata["map_json"] as Map<String, Any>,
                )
                metadataMap[metadataEvent.transactionHash] = metadataEvent
            }
        } catch(e: Exception) {
            // Catch all exceptions, Oura always wants a 200 back
            logger.error("Error while processing Oura event") { e }
        }
    }

    @Scheduled(fixedDelay = 30000)
    fun processEvents() {
        val currentMintChannels = marketplaceService.listAllMintMarketplaceChannels()
        val queueToRetry = mutableListOf<OuraMintEvent>()
        while (mintQueue.isNotEmpty()) {
            val mintToProcess = mintQueue.pop()
            println(mintToProcess.assetNameHex.decodeHex() + "/" + mintToProcess.date)
            if (metadataMap.containsKey(mintToProcess.transactionHash)) {
                val metadataOfPolicy = metadataMap[mintToProcess.transactionHash]?.metadata?.get(mintToProcess.policyId) as Map<String, Any>?
                if (metadataOfPolicy is Map<String, Any>) {
                    val assetName = mintToProcess.assetNameHex.decodeHex()
                    val metadataOfAsset = metadataOfPolicy[assetName] as Map<String, Any>?
                    if (metadataOfAsset is Map<String, Any>) {
                        val combinedAssetInfo = MultiAssetInfo(
                            policyId = PolicyId(mintToProcess.policyId),
                            assetName = assetName,
                            // TODO Should not be a hardcoded fingerprint
                            assetFingerprint = AssetFingerprint("asset1sffpcjr0es7zu6dxrhnz3lqppq66ceacknufwy"),
                            metadata = ObjectMapper().writeValueAsString(metadataOfAsset),
                            mintTransaction = mintToProcess.transactionHash,
                            quantity = mintToProcess.quantity,
                        )

                        currentMintChannels
                            .filter { it.policyId == mintToProcess.policyId }
                            .map {
                                SaleAnnouncement(
                                    guildId = discordServerService.getGuildIdFromServerId(it.discordServerId!!),
                                    channelId = it.channelId,
                                    policyId = mintToProcess.policyId,
                                    assetNameHex = mintToProcess.assetNameHex,
                                    assetName = combinedAssetInfo.assetName,
                                    displayName = getItemNameFromAssetInfo(combinedAssetInfo),
                                    source = Marketplace.JPGSTORE,
                                    marketplaceAssetUrl = "",
                                    assetImageUrl = getImageUrlFromAssetInfo(config, combinedAssetInfo),
                                    price = 1,
                                    saleDate = mintToProcess.date,
                                    rarityRank = 0,
                                    type = SalesType.OFFER,
                                )
                            }
                            .forEach { rabbitTemplate.convertAndSend("mintannouncements", it) }
                    }
                }
            } else if (mintToProcess.date.after(Date(System.currentTimeMillis() - KEEP_MINT_EVENTS_WITHOUT_METADATA_MILLISECONDS))) {
                queueToRetry.add(mintToProcess)
            }
        }
        mintQueue.addAll(queueToRetry)
        metadataMap.entries.removeIf { it.value.date.before(Date(System.currentTimeMillis() - KEEP_METADATA_FOR_MILLISECONDS)) }
    }
}