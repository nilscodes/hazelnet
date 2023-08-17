package io.hazelnet.external.data

import com.fasterxml.jackson.annotation.JsonCreator

data class ExposedWalletDto @JsonCreator constructor(
    val id: Long,
    val verificationId: Long,
)
