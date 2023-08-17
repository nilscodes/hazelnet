FROM openjdk:slim-bullseye

ARG JAR_FILE=build/libs/*-SNAPSHOT.jar

ENV JAVA_OPTS=""
ENV HAZELNET_COMMUNITY_URL="http://community:8085"
ENV HAZELNET_CONNECT_URL="http://connect:8086"
ENV HAZELNET_OAUTH_INTROSPECTION_URL=""
ENV HAZELNET_OAUTH_INTROSPECTION_CLIENT=""
ENV HAZELNET_OAUTH_INTROSPECTION_SECRET=""
COPY ${JAR_FILE} app.jar

EXPOSE 8087

ENTRYPOINT [ "sh", \
    "-c", \
    "java -jar -Dio.hazelnet.community.url=${HAZELNET_COMMUNITY_URL} -Dio.hazelnet.connect.url=${HAZELNET_CONNECT_URL} -Dspring.security.oauth2.resourceserver.opaque.introspection-uri=${HAZELNET_OAUTH_INTROSPECTION_URL} -Dspring.security.oauth2.resourceserver.opaque.introspection-client-id=${HAZELNET_OAUTH_INTROSPECTION_CLIENT} -Dspring.security.oauth2.resourceserver.opaque.introspection-client-secret=${HAZELNET_OAUTH_INTROSPECTION_SECRET} ${JAVA_OPTS} /app.jar" \
]