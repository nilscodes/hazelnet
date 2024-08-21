package io.hazelnet.cardano.connect.persistence.stakepool

import io.hazelnet.cardano.connect.data.BlockfrostDelegator
import io.hazelnet.cardano.connect.data.BlockfrostPoolInfo
import io.hazelnet.cardano.connect.data.stakepool.DelegationInfo
import io.hazelnet.cardano.connect.data.stakepool.StakepoolInfo
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Repository
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono

@Repository
class StakepoolDaoBlockfrost(
    @Qualifier("blockfrostClient") private val blockfrostClient: WebClient,
): StakepoolDao {
    override fun listStakepools(): List<StakepoolInfo> {
        TODO("Not yet implemented")
    }

    override fun getActiveDelegation(poolHash: String): List<DelegationInfo> {
        return getPoolInfo(poolHash)
            .flatMapMany { poolInfo ->
                val totalPages = (poolInfo.liveDelegators / 100) + 1
                Flux.range(1, totalPages)
            }
            .flatMap { page ->
                blockfrostClient.get()
                    .uri { uriBuilder ->
                        uriBuilder
                            .path("/pools/$poolHash/delegators")
                            .queryParam("page", page)
                            .build()
                    }
                    .retrieve()
                    .bodyToFlux(BlockfrostDelegator::class.java)
                    .map { DelegationInfo(poolHash, it.delegation, it.address) }
            }
            .collectList()
            .block()!!
    }

    private fun getPoolInfo(poolHash: String): Mono<BlockfrostPoolInfo> {
        return blockfrostClient.get()
            .uri("/pools/$poolHash")
            .retrieve()
            .onStatus({ status -> status == HttpStatus.NOT_FOUND }) { _ ->
                Mono.error(NoSuchElementException("Pool metadata not found in Blockfrost for pool hash $poolHash."))
            }
            .bodyToMono(BlockfrostPoolInfo::class.java)
    }

    override fun getActiveDelegationWithoutAmount(poolHash: String): List<DelegationInfo> {
        TODO("Not yet implemented")
    }

    override fun getDelegationInEpoch(poolHash: String, epochNo: Int): List<DelegationInfo> {
        TODO("Not yet implemented")
    }

    override fun findByView(poolView: String): List<StakepoolInfo> {
        TODO("Not yet implemented")
    }

    override fun findByHash(poolHash: String): List<StakepoolInfo> {
        TODO("Not yet implemented")
    }

}