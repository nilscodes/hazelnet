package io.hazelnet.community.data

import io.hazelnet.cardano.connect.data.token.AssetFingerprint
import io.hazelnet.cardano.connect.data.token.MultiAssetInfo
import io.hazelnet.cardano.connect.data.token.PolicyId
import io.hazelnet.community.data.discord.METADATA_ADAGOTCHI_1
import io.hazelnet.community.data.discord.METADATA_HUNKS_1
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class MultiAssetInfoUtilKtTest {

    @Test
    fun `image URL should extract properly for default case`() {
        val assetInfo = MultiAssetInfo(
            policyId = PolicyId("684ffa75d83ccd4dfe179bd37fe679e74d33cce181a6f473337df098"),
            assetName = "adagotchi",
            assetFingerprint = AssetFingerprint("asset1q5a6pfxzt6p9rv872h0syxus9dgusdujv4mjjw"),
            metadata = METADATA_ADAGOTCHI_1,
            mintTransaction = "3499e2ce806ce97ea2548dc7ec1c9dc2a397f4986511f3f6e54a52efd442623f",
            quantity = 1L
        )
        assertEquals("https://image-optimizer.jpgstoreapis.com/QmbicXPPxrrFErrRdYJzH8jnUbAJ9n9x8wMSJWGKd3fM1W?width=1200", getImageUrlFromAssetInfo("https://image-optimizer.jpgstoreapis.com/%ipfs?width=1200", assetInfo))
    }

    @Test
    fun `image URL should work even if array of base64 is passed in`() {
        val assetInfo = MultiAssetInfo(
            policyId = PolicyId("684ffa75d83ccd4dfe179bd37fe679e74d33cce181a6f473337df098"),
            assetName = "hunk3888",
            assetFingerprint = AssetFingerprint("asset1q5a6pfxzt6p9rv872h0syxus9dgusdujv4mjjw"),
            metadata = METADATA_HUNKS_1,
            mintTransaction = "3499e2ce806ce97ea2548dc7ec1c9dc2a397f4986511f3f6e54a52efd442623f",
            quantity = 1L
        )
        val actual = getImageUrlFromAssetInfo("https://image-optimizer.jpgstoreapis.com/%ipfs?width=1200", assetInfo)
        assertNotNull(actual)
        println(actual)
        assertTrue(actual!!.startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA"))
    }
}