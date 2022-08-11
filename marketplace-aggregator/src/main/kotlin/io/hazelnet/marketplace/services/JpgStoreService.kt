package io.hazelnet.marketplace.services

import io.hazelnet.marketplace.data.jpgstore.JpgStoreListingInfo
import io.hazelnet.marketplace.data.jpgstore.JpgStoreSalesInfo
import io.hazelnet.marketplace.data.jpgstore.JpgStoreTransactionsContainer
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux

@Service
class JpgStoreService(
    @field:Qualifier("jpgStoreClient")
    private val connectClient: WebClient,
) {
    fun getListings(policyIds: List<String>, page: Int): Flux<JpgStoreListingInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/policy/$it/listings")
                            .queryParam("page", page)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreListingInfo::class.java)
            }
    }

    fun getSales(policyIds: List<String>, page: Int): Flux<JpgStoreSalesInfo> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/policy/$it/sales")
                            .queryParam("page", page)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreSalesInfo::class.java)
            }
    }

    fun getTransactionsForCollection(policyIds: List<String>, page: Int): Flux<JpgStoreTransactionsContainer> {
        return Flux.fromIterable(policyIds)
            .flatMap {
                connectClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/collection/$it/transactions")
                            .queryParam("page", page)
                            .queryParam("count", 50)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(JpgStoreTransactionsContainer::class.java)
            }
    }
}