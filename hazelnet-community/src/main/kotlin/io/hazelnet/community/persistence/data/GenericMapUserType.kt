package io.hazelnet.community.persistence.data

import com.fasterxml.jackson.databind.ObjectMapper
import org.hibernate.engine.spi.SharedSessionContractImplementor
import org.hibernate.type.SerializationException
import org.hibernate.usertype.UserType
import org.postgresql.util.PGobject
import org.springframework.util.ObjectUtils
import java.io.Serializable
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Types

class GenericMapUserType: UserType {
    override fun equals(x: Any?, y: Any?) = ObjectUtils.nullSafeEquals(x, y)

    override fun hashCode(x: Any?) = (x?.hashCode()) ?: 0

    override fun sqlTypes() = intArrayOf(Types.JAVA_OBJECT)

    override fun returnedClass() = Map::class.java

    override fun nullSafeGet(
        rs: ResultSet?,
        names: Array<out String>?,
        session: SharedSessionContractImplementor?,
        owner: Any?
    ): Any {
        val o: PGobject = rs!!.getObject(names!![0]) as PGobject
        return if (o.value != null) {
            val objectMapper = ObjectMapper()
            objectMapper.readValue(o.value, MutableMap::class.java)
        } else emptyMap<String, Any>()

    }

    override fun nullSafeSet(st: PreparedStatement?, value: Any?, index: Int, session: SharedSessionContractImplementor?) {
        if (value == null) {
            st!!.setNull(index, Types.OTHER)
        } else {
            val objectMapper = ObjectMapper()
            st!!.setObject(index, objectMapper.writeValueAsString(value), Types.OTHER)
        }
    }

    override fun deepCopy(originalValue: Any?): Any? {
        if (originalValue == null) {
            return null
        }

        if (originalValue !is Map<*, *>) {
            return null
        }

        val resultMap: MutableMap<String, Any> = mutableMapOf()

        originalValue.forEach { (key: Any?, value: Any?) -> resultMap[key as String] = value as Any }

        return resultMap
    }

    override fun isMutable() = true

    override fun disassemble(value: Any?): Serializable {
        val copy = deepCopy(value)

        if(copy is Serializable) {
            return copy
        }

        throw SerializationException(String.format("Cannot serialize '%s', %s is not Serializable.", value, value?.javaClass), null)
    }

    override fun assemble(cached: Serializable?, owner: Any?) = deepCopy(cached)

    override fun replace(original: Any?, target: Any?, owner: Any?) = deepCopy(original)
}