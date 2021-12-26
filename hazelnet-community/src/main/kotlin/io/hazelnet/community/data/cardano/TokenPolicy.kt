package io.hazelnet.community.data.cardano

import com.fasterxml.jackson.annotation.JsonCreator
import javax.persistence.Column
import javax.persistence.Embeddable
import javax.validation.constraints.NotNull
import javax.validation.constraints.Size

@Embeddable
class TokenPolicy @JsonCreator constructor(
        @Column(name = "policy_id")
        @field:NotNull
        @field:Size(min = 56, max = 56)
        var policyId: String,

        @Column(name = "project_name")
        @field:NotNull
        @field:Size(min = 1, max = 256)
        var projectName: String
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as TokenPolicy

        if (policyId != other.policyId) return false
        if (projectName != other.projectName) return false

        return true
    }

    override fun hashCode(): Int {
        var result = policyId.hashCode()
        result = 31 * result + projectName.hashCode()
        return result
    }

    override fun toString(): String {
        return "TokenPolicy(policyId='$policyId', projectName='$projectName')"
    }
}