package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.taptools.TapToolsListingInfo
import io.hazelnet.marketplace.data.taptools.TapToolsSalesInfo
import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import mu.KotlinLogging
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Flux
import reactor.core.publisher.SignalType
import java.util.*

private val logger = KotlinLogging.logger {}

@Service
class TapToolsService(
    @Qualifier("tapToolsClient")
    private val connectClient: WebClient,
    private val rabbitTemplate: RabbitTemplate,
    private val meterRegistry: MeterRegistry,
) {

    private val lastSalesSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val lastListingsSyncTimeForPolicy: MutableMap<String, Date> = mutableMapOf()
    private val tapToolsSalesRequestCounter = Counter.builder("taptools_requestcount_sales")
        .description("Count of requests for aggregating sales from TapTools")
        .register(meterRegistry)
    private val tapToolsSalesStatusCounter: Counter.Builder = Counter.builder("taptools_statuscodes_sales")
        .description("HTTP status codes for encountered errors when aggregating sales from TapTools")
    private val tapToolsListingsRequestCounter = Counter.builder("taptools_requestcount_listings")
        .description("Count of requests for aggregating listings from TapTools")
        .register(meterRegistry)
    private val tapToolsListingsStatusCounter: Counter.Builder = Counter.builder("taptools_statuscodes_listings")
        .description("HTTP status codes for encountered errors when aggregating listings from TapTools")

    fun processSalesForPolicy(policyId: String, policiesToInfoLog: List<String>) {
        val lastSyncTimeBeforeCall = lastSalesSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId)
        if (track) {
            logger.info { "Tracking TapTools sales for policy $policyId. Previous sync was $lastSyncTimeBeforeCall, this sync is at $now." }
        }
        tapToolsSalesRequestCounter.increment()
        this.getSales(listOf(policyId), 1)
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting TapTools sales for policy $policyId" }
                tapToolsSalesStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter {
                val sold = it.saleDate.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found sale with listing asset name ${it.name} and sale date ${it.saleDate}. With last sync at $lastSyncTimeBeforeCall this is considered sold: $sold" }
                }
                sold
            }
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastSalesSyncTimeForPolicy[policyId] = now
                }
            }
            .subscribe {
                rabbitTemplate.convertAndSend("sales", it.toSalesInfo())
            }
    }

    fun processListingsForPolicy(policyId: String, policiesToInfoLog: List<String>) {
        val lastSyncTimeBeforeCall = lastListingsSyncTimeForPolicy[policyId] ?: Date()
        val now = Date()
        val track = policiesToInfoLog.contains(policyId);
        if (track) {
            logger.info { "Tracking TapTools listings for policy ${policyId}. Previous sync was ${lastSyncTimeBeforeCall}, this sync is at $now." }
        }
        tapToolsListingsRequestCounter.increment()
        this.getListings(listOf(policyId))
            .onErrorContinue(WebClientResponseException::class.java) { e, _ ->
                logger.info(e) { "Failed getting TapTools listings for policy $policyId" }
                tapToolsListingsStatusCounter
                    .tag("code", (e as WebClientResponseException).rawStatusCode.toString())
                    .register(meterRegistry)
                    .increment()
            }
            .filter {
                val listed = it.listingDate.after(lastSyncTimeBeforeCall)
                if (track) {
                    logger.info { "Found listed with asset name ${it.name} and listing date ${it.listingDate}. With last sync at $lastSyncTimeBeforeCall this is considered listed: $listed" }
                }
                listed
            }
            .doFinally {
                if (it == SignalType.ON_COMPLETE) {
                    lastListingsSyncTimeForPolicy[policyId] = now
                }
            }
            .subscribe {
                rabbitTemplate.convertAndSend("listings", it.toListingsInfo(policyId))
            }
    }

    private fun getListings(policyIds: List<String>): Flux<TapToolsListingInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/nft/collection/listings/individual")
                            .queryParam("sortBy", "time")
                            .queryParam("order", "desc")
                            .queryParam("policy", it)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(TapToolsListingInfo::class.java)
            }
    }

    private fun getSales(policyIds: List<String>, page: Int): Flux<TapToolsSalesInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/nft/collection/trades")
                            .queryParam("sortBy", "time")
                            .queryParam("order", "desc")
                            .queryParam("page", page)
                            .queryParam("policy", it)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(TapToolsSalesInfo::class.java)
            }
    }
}