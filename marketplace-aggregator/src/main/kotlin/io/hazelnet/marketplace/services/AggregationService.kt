package io.hazelnet.marketplace.services

import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Service

private val policiesToInfoLog: List<String> = emptyList()

@Service
class AggregationService(
    private val jpgStoreService: JpgStoreService,
    private val plutusArtService: PlutusArtService,
) {

    @RabbitListener(queues = ["salespolicies"])
    fun processSalesForPolicy(policyId: String) {
        jpgStoreService.processSalesForPolicy(policyId, policiesToInfoLog)
        plutusArtService.processSalesForPolicy(policyId, policiesToInfoLog)
    }

    @RabbitListener(queues = ["listingspolicies"])
    fun processListingsForPolicy(policyId: String) {
        jpgStoreService.processListingsForPolicy(policyId, policiesToInfoLog)
        plutusArtService.processListingsForPolicy(policyId, policiesToInfoLog)
    }
}