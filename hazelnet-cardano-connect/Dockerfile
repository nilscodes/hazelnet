FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV BF_PROJECT_ID=""
ENV CARDANO_NETWORK="mainnet"
ENV HAZELNET_CONNECT_POSTGRES_URL=""
ENV HAZELNET_CONNECT_POSTGRES_USER=""
ENV HAZELNET_CONNECT_POSTGRES_PASSWORD=""

COPY ${JAR_FILE} app.jar

EXPOSE 8086

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.datasource.url=\"${HAZELNET_CONNECT_POSTGRES_URL}\" -Dspring.datasource.username=${HAZELNET_CONNECT_POSTGRES_USER} -Dspring.datasource.password=${HAZELNET_CONNECT_POSTGRES_PASSWORD} -Dio.hazelnet.connect.cardano.network=${CARDANO_NETWORK} -Dio.hazelnet.connect.cardano.blockfrost.apiKey=${BF_PROJECT_ID} /app.jar" \
]
