package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import org.springframework.lang.NonNull
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.Pattern
import javax.validation.constraints.Size

@Embeddable
class TokenRoleAssetInfo @JsonCreator constructor(
    @Column(name = "policy_id")
    @field:NonNull
    @field:Size(min = 56, max = 56)
    var policyId: String,

    @Column(name = "asset_fingerprint")
    @field:Size(min = 44, max = 44)
    @field:Pattern(regexp = "^asset1[a-zA-Z0-9]{38}$")
    var assetFingerprint: String? = null,
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenRoleAssetInfo

        if (policyId != other.policyId) return false
        if (assetFingerprint != other.assetFingerprint) return false

        return true
    }

    override fun hashCode(): Int {
        var result = policyId.hashCode()
        result = 31 * result + (assetFingerprint?.hashCode() ?: 0)
        return result
    }

    override fun toString(): String {
        return "TokenRoleAssetInfo(policyId='$policyId', assetFingerprint=$assetFingerprint)"
    }

}