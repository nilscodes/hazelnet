package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.jpgstore.JpgStoreTransactionAction
import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Flux
import java.util.*

private val logger = KotlinLogging.logger {}

@Service
class AggregationService(
    private val jpgStoreService: JpgStoreService,
    private val rabbitTemplate: RabbitTemplate,
    private val meterRegistry: MeterRegistry,
) {

    private val lastSalesSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val jpgStoreSalesStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_sales")
        .description("HTTP status codes for encountered errors when aggregating sales from jpg.store")
    private val lastListingsSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val jpgStoreListingsStatusCounter: Counter.Builder = Counter
        .builder("jpgstore_statuscodes_listings")
        .description("HTTP status codes for encountered errors when aggregating listings from jpg.store")

    @RabbitListener(queues = ["salespolicies"])
    fun processSalesForPolicies(policyId: String) {
        val lastSyncTimeBeforeCall = lastSalesSyncTimeForPolicy[policyId] ?: Date()
        lastSalesSyncTimeForPolicy[policyId] = Date()
        jpgStoreService.getSales(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store sales for policy $policyId" }
                jpgStoreSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter { it.saleDate != null && it.saleDate.after(lastSyncTimeBeforeCall) }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo()) }
        jpgStoreService.getTransactionsForCollection(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store transactions for policy $policyId" }
                jpgStoreSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .flatMap { Flux.fromIterable(it.transactions) }
            .filter { it.transactionConfirmationDate != null
                    && it.transactionConfirmationDate.after(lastSyncTimeBeforeCall)
                    && it.action == JpgStoreTransactionAction.ACCEPT_OFFER }
            .subscribe { rabbitTemplate.convertAndSend("sales", it.toSalesInfo()) }
    }

    @RabbitListener(queues = ["listingspolicies"])
    fun processListingsForPolicies(policyId: String) {
        val lastSyncTimeBeforeCall = lastListingsSyncTimeForPolicy[policyId] ?: Date()
        lastListingsSyncTimeForPolicy[policyId] = Date()
        jpgStoreService.getListings(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting jpg.store listings for policy $policyId" }
                jpgStoreListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter { it.listingDate.after(lastSyncTimeBeforeCall) }
            .subscribe { rabbitTemplate.convertAndSend("listings", it.toListingsInfo()) }
    }
}