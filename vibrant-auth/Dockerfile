FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV VIBRANT_AUTH_POSTGRES_URL=""
ENV VIBRANT_AUTH_POSTGRES_USER=""
ENV VIBRANT_AUTH_POSTGRES_PASSWORD=""
ENV VIBRANT_OAUTH_BASEURL=""
ENV VIBRANT_OAUTH_INTROSPECTION_CLIENT=""
ENV VIBRANT_OAUTH_INTROSPECTION_SECRET=""
ENV VIBRANT_OAUTH_RYP_CLIENT=""
ENV VIBRANT_OAUTH_RYP_SECRET=""
ENV VIBRANT_OAUTH_INTERNAL_CLIENT=""
ENV VIBRANT_OAUTH_INTERNAL_SECRET=""

COPY ${JAR_FILE} app.jar

EXPOSE 8090

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.datasource.url=\"${VIBRANT_AUTH_POSTGRES_URL}\" -Dspring.datasource.username=${VIBRANT_AUTH_POSTGRES_USER} -Dspring.datasource.password=${VIBRANT_AUTH_POSTGRES_PASSWORD} -Dspring.security.oauth2.base-uri=${VIBRANT_OAUTH_BASEURL} -Dspring.security.oauth2.authorizationserver.opaque.introspection-client-id=${VIBRANT_OAUTH_INTROSPECTION_CLIENT} -Dspring.security.oauth2.authorizationserver.opaque.introspection-client-secret=${VIBRANT_OAUTH_INTROSPECTION_SECRET} -Dio.vibrantnet.ryp.client-id=${VIBRANT_OAUTH_RYP_CLIENT} -Dio.vibrantnet.ryp.client-secret=${VIBRANT_OAUTH_RYP_SECRET} -Dio.vibrantnet.internal.client-id=${VIBRANT_OAUTH_INTERNAL_CLIENT} -Dio.vibrantnet.internal.client-secret=${VIBRANT_OAUTH_INTERNAL_SECRET} ${JAVA_OPTS} /app.jar" \
]