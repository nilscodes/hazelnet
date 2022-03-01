package io.hazelnet.cardano.connect.controllers

import io.hazelnet.cardano.connect.services.TokenService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/token")
class TokenController(
        private val tokenService: TokenService
) {
    @PostMapping("/stake/{stakeAddress}")
    @ResponseStatus(HttpStatus.OK)
    fun getMultiAssetsForStakeAddress(@PathVariable stakeAddress: String, @RequestBody policyIdsWithOptionalAssetFingerprint: List<String>) = tokenService.getMultiAssetsForStakeAddress(stakeAddress, policyIdsWithOptionalAssetFingerprint)

    @PostMapping("/stake")
    @ResponseStatus(HttpStatus.OK)
    fun getMultiAssetsStakeSnapshot(@RequestBody policyIdsWithOptionalAssetFingerprint: List<String>) = tokenService.getMultiAssetSnapshot(policyIdsWithOptionalAssetFingerprint)
}