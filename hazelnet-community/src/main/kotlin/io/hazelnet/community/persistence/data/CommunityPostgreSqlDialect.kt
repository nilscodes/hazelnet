package io.hazelnet.community.persistence.data

import org.hibernate.dialect.PostgreSQL10Dialect
import java.sql.Types

class CommunityPostgreSqlDialect : PostgreSQL10Dialect()
{
    init {
        this.registerColumnType(Types.JAVA_OBJECT, "jsonb")
    }
}