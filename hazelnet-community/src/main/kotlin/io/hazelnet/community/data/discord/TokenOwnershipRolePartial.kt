package io.hazelnet.community.data.discord

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.databind.annotation.JsonSerialize
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer
import javax.validation.Valid
import javax.validation.constraints.Min
import javax.validation.constraints.Size

data class TokenOwnershipRolePartial @JsonCreator constructor(
    @field:Valid
    @field:Size(min = 1, max = 200)
    val acceptedAssets: MutableSet<TokenRoleAssetInfo>?,

    @field:JsonSerialize(using = ToStringSerializer::class)
    @field:Min(1)
    val minimumTokenQuantity: Long?,

    @field:JsonSerialize(using = ToStringSerializer::class)
    @field:Min(0)
    val maximumTokenQuantity: Long?,

    @field:JsonSerialize(using = ToStringSerializer::class)
    @field:Min(1)
    val roleId: Long?,

    val aggregationType: TokenOwnershipAggregationType?,
    val stakingType: TokenStakingType?
)