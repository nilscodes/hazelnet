FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV HAZELNET_CONNECT_URL="http://connect:8086"
ENV HAZELNET_COMMUNITY_POSTGRES_URL=""
ENV HAZELNET_COMMUNITY_POSTGRES_USER=""
ENV HAZELNET_COMMUNITY_POSTGRES_PASSWORD=""

COPY ${JAR_FILE} app.jar

EXPOSE 8085

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.datasource.url=\"${HAZELNET_COMMUNITY_POSTGRES_URL}\" -Dspring.datasource.username=${HAZELNET_COMMUNITY_POSTGRES_USER} -Dspring.datasource.password=${HAZELNET_COMMUNITY_POSTGRES_PASSWORD} -Dio.hazelnet.community.connect.url=${HAZELNET_CONNECT_URL} ${JAVA_OPTS} /app.jar" \
]