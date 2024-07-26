package io.hazelnet.marketplace.services

import io.hazelnet.cardano.connect.data.token.GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Service

private val policiesToInfoLog: List<String> = emptyList()

@Service
class AggregationService(
    private val tapToolsService: TapToolsService,
//    private val plutusArtService: PlutusArtService,
) {

    @RabbitListener(queues = ["salespolicies"])
    fun processSalesForPolicy(policyId: String) {
        if (policyId == GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER) {
//            plutusArtService.processAllSales()
        } else {
            tapToolsService.processSalesForPolicy(policyId, policiesToInfoLog)
//            plutusArtService.processSalesForPolicy(policyId, policiesToInfoLog)
        }
    }

    @RabbitListener(queues = ["listingspolicies"])
    fun processListingsForPolicy(policyId: String) {
        if (policyId == GLOBAL_TRACKING_POLICY_ID_PLACEHOLDER) {
//            plutusArtService.processAllListings()
        } else {
            tapToolsService.processListingsForPolicy(policyId, policiesToInfoLog)
//            plutusArtService.processListingsForPolicy(policyId, policiesToInfoLog)
        }
    }
}