package io.hazelnet.community.services.external

import io.hazelnet.cardano.connect.util.Bech32
import io.hazelnet.community.CommunityApplicationConfiguration
import io.hazelnet.community.data.external.necroleague.StakingEntry
import mu.KotlinLogging
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.read
import kotlin.concurrent.write

private val logger = KotlinLogging.logger {}

@Service
class NecroLeagueStakingService(
    @Qualifier("necroLeagueClient")
    private val necroLeagueClient: WebClient,
    private val config: CommunityApplicationConfiguration,
) {
    private var stakingMap = mutableMapOf<String, String>()
    private val stakingLock = ReentrantReadWriteLock()

    @Scheduled(fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
    fun updateStaking() {
        necroLeagueClient.get()
            .retrieve()
            .bodyToFlux(StakingEntry::class.java)
            .collectList()
            .subscribe { stakingEntries ->
                val updatedMap = mutableMapOf<String, String>()

                stakingEntries.forEach {
                    if (it.stakingAddress != null) {
                        try {
                            val staker = getStakeKeyViewFromAddress(it.address)
                            val stakedTo = getStakeKeyViewFromAddress(it.stakingAddress)
                            if (staker != null && stakedTo != null) {
                                stakingMap[stakedTo] = staker
                            }
                        } catch (e: Exception) {
                            logger.warn("Failed to get stake key view for ${it.address} or ${it.stakingAddress} when processing necro league staking")
                        }
                    }
                }

                stakingLock.write {
                    stakingMap = updatedMap
                }
            }
    }

    fun getOriginalOwner(stakeKeyView: String?, policyId: String): String? {
        return stakingLock.read {
            if (stakeKeyView != null && policyId.startsWith(config.necroleague.policyId)) {
                stakingMap[stakeKeyView]
            }
            null
        }
    }

    fun getApplicableNecroLeagueStakeAddresses(policyIds: Collection<String>): Set<String> {
        return stakingLock.read {
            if (policyIds.any { it.startsWith(config.necroleague.policyId) }) {
                stakingMap.keys
            } else {
                emptySet()
            }
        }
    }

    fun getStakingMap(): Map<String, String> {
        return stakingLock.read {
            stakingMap.toMap()
        }
    }

    companion object {
        fun getStakeKeyViewFromAddress(address: String): String? {
            val addressRaw = Bech32.decode(address)
            return if (addressRaw.bytes.size > 29) {
                val networkId = 0xE1
                Bech32.encode("stake", byteArrayOf(networkId.toByte()).plus(addressRaw.bytes.copyOfRange(29, 57)))
            } else {
                null
            }
        }
    }
}