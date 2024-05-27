FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV HAZELNET_CONNECT_URL="http://connect:8086"
ENV HAZELNET_COMMUNITY_POSTGRES_URL=""
ENV HAZELNET_COMMUNITY_POSTGRES_USER=""
ENV HAZELNET_COMMUNITY_POSTGRES_PASSWORD=""
ENV VIBRANT_AUTH_INTERNAL_CLIENT_SECRET=""
ENV NFTCDN_KEY=""
ENV NFTCDN_DOMAIN=""
ENV RABBITMQ_PASSWORD=""

COPY ${JAR_FILE} app.jar

EXPOSE 8085

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.datasource.url=\"${HAZELNET_COMMUNITY_POSTGRES_URL}\" -Dspring.datasource.username=${HAZELNET_COMMUNITY_POSTGRES_USER} -Dspring.datasource.password=${HAZELNET_COMMUNITY_POSTGRES_PASSWORD} -Dio.hazelnet.community.connect.url=${HAZELNET_CONNECT_URL} -Dio.hazelnet.community.vibrant-auth.clientSecret=${VIBRANT_AUTH_INTERNAL_CLIENT_SECRET} -Dspring.rabbitmq.password=${RABBITMQ_PASSWORD} -Dio.hazelnet.community.nftcdn.domain=${NFTCDN_DOMAIN} -Dio.hazelnet.community.nftcdn.key=\"${NFTCDN_KEY}\" ${JAVA_OPTS} /app.jar" \
]