package io.hazelnet.cardano.connect.data.transactions

class NoTransactionFoundException(override val message: String?): Throwable(message)