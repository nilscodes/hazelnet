import io.hazelnet.shared.data.BlockchainType
import javax.validation.Constraint
import javax.validation.ConstraintValidator
import javax.validation.ConstraintValidatorContext
import javax.validation.Payload
import kotlin.annotation.AnnotationRetention.RUNTIME
import kotlin.annotation.AnnotationTarget.*
import kotlin.reflect.KClass

@Target(FIELD)
@Retention(RUNTIME)
@MustBeDocumented
@Constraint(validatedBy = [BlockchainAddressValidator::class])
annotation class ValidBlockchainAddress(
    val message: String = "Invalid blockchain address",
    val groups: Array<KClass<out Any>> = [],
    val payload: Array<KClass<out Payload>> = [],
    val allowedTypes: Array<BlockchainType> = []
)

class BlockchainAddressValidator : ConstraintValidator<ValidBlockchainAddress, String> {
    private lateinit var allowedTypes: Array<BlockchainType>

    override fun initialize(constraintAnnotation: ValidBlockchainAddress) {
        this.allowedTypes = constraintAnnotation.allowedTypes.let { types ->
            if (types.isEmpty()) {
                BlockchainType.values()
            } else {
                types
            }
        }
    }

    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        if (value == null) {
            return false
        }

        val cardanoPattern = "^addr1[A-Za-z0-9]{98}$"
        val ethereumPattern = "^(0x)?[0-9a-fA-F]{40}$"

        for (type in allowedTypes) {
            val pattern = when (type) {
                BlockchainType.CARDANO -> cardanoPattern
                BlockchainType.ETHEREUM -> ethereumPattern
                BlockchainType.POLYGON -> ethereumPattern
            }
            if (value.matches(pattern.toRegex())) {
                return true
            }
        }
        return false
    }
}
