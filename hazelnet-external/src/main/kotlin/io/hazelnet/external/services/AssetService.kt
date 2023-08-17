package io.hazelnet.external.services

import io.hazelnet.external.data.NoWalletsExposedException
import org.springframework.cache.annotation.CacheConfig
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
@CacheConfig(cacheNames = ["assets"])
class AssetService(
    private val communityService: CommunityService,
    private val connectService: ConnectService,
) {
    @Cacheable
    fun getAssetsOfPolicyForDiscordUser(guildId: Long, policyId: String, discordUserId: Long): List<String> {
        try {
            val externalAccount = communityService.getExternalAccountByDiscordId(discordUserId)
            val linkedExternalAccounts = communityService.getLinkedDiscordUsers(guildId)
            if (linkedExternalAccounts.map { it.externalAccountId }.contains(externalAccount.id)) {
                val exposedWallets = communityService.getExposedWallets(externalAccount.id, guildId)
                if (exposedWallets.isNotEmpty()) {
                    val verifications = communityService.getExternalAccountVerifications(externalAccount.id)
                    val exposedVerifications = verifications.filter { it.id in exposedWallets.map { exposedWallet -> exposedWallet.verificationId } && it.cardanoStakeAddress != null }
                    val assets = connectService.getAllTokenOwnershipAssetsByPolicyId(exposedVerifications.map { it.cardanoStakeAddress!! }, setOf(policyId))
                    return assets.flatMap { it.assetList.map { asset -> "${it.policyIdWithOptionalAssetFingerprint}${asset}" } }
                }
                throw NoWalletsExposedException("Discord user $discordUserId has not exposed any wallets to your Discord server")
            }
        } catch (_: NoSuchElementException) {
            // Rethrow with a message that does not expose if the external account with that discord ID generally exists or not
        }
        throw NoSuchElementException("Discord user $discordUserId is not linked to your Discord server")
    }

    @Scheduled(fixedDelay = 300000)
    @CacheEvict(allEntries = true)
    fun clearCache() {}

}