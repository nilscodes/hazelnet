FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV RABBITMQ_PASSWORD=""
ENV TAPTOOLS_APIKEY=""
COPY ${JAR_FILE} app.jar

EXPOSE 8084

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dspring.rabbitmq.password=${RABBITMQ_PASSWORD} -Dio.hazelnet.tap-tools.api-key=${TAPTOOLS_APIKEY} ${JAVA_OPTS} /app.jar" \
]