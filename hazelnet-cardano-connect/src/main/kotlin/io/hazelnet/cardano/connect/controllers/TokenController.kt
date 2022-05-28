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
    fun getMultiAssetCountsForStakeAddress(@PathVariable stakeAddress: String, @RequestBody policyIdsWithOptionalAssetFingerprint: List<String>) = tokenService.getMultiAssetCountsForStakeAddress(stakeAddress, policyIdsWithOptionalAssetFingerprint)

    @PostMapping("/stake/{stakeAddress}/assets")
    @ResponseStatus(HttpStatus.OK)
    fun getMultiAssetListForStakeAddress(@PathVariable stakeAddress: String, @RequestBody policyIdsWithOptionalAssetFingerprint: List<String>) = tokenService.getMultiAssetListForStakeAddress(stakeAddress, policyIdsWithOptionalAssetFingerprint)

    @PostMapping("/stake")
    @ResponseStatus(HttpStatus.OK)
    fun getMultiAssetCountStakeSnapshot(@RequestBody policyIdsWithOptionalAssetFingerprint: List<String>) = tokenService.getMultiAssetCountStakeSnapshot(policyIdsWithOptionalAssetFingerprint)

    @GetMapping("/assets/{policyId}/{assetNameHex}")
    @ResponseStatus(HttpStatus.OK)
    fun getMultiAssetInfo(@PathVariable policyId: String, @PathVariable assetNameHex: String) = tokenService.getMultiAssetInfo(policyId, assetNameHex)
}