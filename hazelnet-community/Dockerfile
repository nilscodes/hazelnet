FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV HAZELNET_CONNECT_URL="http://connect:8086"
ENV HAZELNET_COMMUNITY_POSTGRES_URL=""
ENV HAZELNET_COMMUNITY_POSTGRES_USER=""
ENV HAZELNET_COMMUNITY_POSTGRES_PASSWORD=""
ENV HAZELNET_OAUTH_BASEURL=""
ENV HAZELNET_OAUTH_INTROSPECTION_CLIENT=""
ENV HAZELNET_OAUTH_INTROSPECTION_SECRET=""
ENV NFTCDN_KEY=""
ENV NFTCDN_DOMAIN=""
ENV RABBITMQ_PASSWORD=""

COPY ${JAR_FILE} app.jar

EXPOSE 8085

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.datasource.url=\"${HAZELNET_COMMUNITY_POSTGRES_URL}\" -Dspring.datasource.username=${HAZELNET_COMMUNITY_POSTGRES_USER} -Dspring.datasource.password=${HAZELNET_COMMUNITY_POSTGRES_PASSWORD} -Dio.hazelnet.community.connect.url=${HAZELNET_CONNECT_URL} -Dspring.security.oauth2.base-uri=${HAZELNET_OAUTH_BASEURL} -Dspring.security.oauth2.authorizationserver.opaque.introspection-client-id=${HAZELNET_OAUTH_INTROSPECTION_CLIENT} -Dspring.security.oauth2.authorizationserver.opaque.introspection-client-secret=${HAZELNET_OAUTH_INTROSPECTION_SECRET} -Dspring.rabbitmq.password=${RABBITMQ_PASSWORD} -Dio.hazelnet.community.nftcdn.domain=${NFTCDN_DOMAIN} -Dio.hazelnet.community.nftcdn.key=\"${NFTCDN_KEY}\" ${JAVA_OPTS} /app.jar" \
]