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

private val logger = KotlinLogging.logger {}

@Service
class NecroLeagueStakingService(
    @Qualifier("necroLeagueClient")
    private val necroLeagueClient: WebClient,
    private val config: CommunityApplicationConfiguration,
) {
    private val stakingMap = mutableMapOf<String, String>()

    @Scheduled(fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
    fun updateStaking() {
        necroLeagueClient.get()
            .retrieve()
            .bodyToFlux(StakingEntry::class.java)
            .subscribe {
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
    }

    fun getOriginalOwner(stakeKeyView: String?, policyId: String): String? {
        if (stakeKeyView != null && policyId.startsWith(config.necroleague.policyId)) {
            return stakingMap[stakeKeyView]
        }
        return null
    }

    fun getApplicableNecroLeagueStakeAddresses(policyIds: Collection<String>)
        = if (policyIds.any { it.startsWith(config.necroleague.policyId) }) {
            stakingMap.keys
        } else {
            emptySet()
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