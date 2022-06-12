package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import javax.validation.Valid
import javax.validation.constraints.Size

data class TokenOwnershipRolePartial @JsonCreator constructor(
    @field:Valid
    @field:Size(min = 1, max = 50)
    val acceptedAssets: MutableSet<TokenRoleAssetInfo>?,

    val aggregationType: TokenOwnershipAggregationType?,
)