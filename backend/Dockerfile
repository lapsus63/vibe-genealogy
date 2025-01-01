FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app
RUN apk add --no-cache maven
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src/ src/
RUN mvn -B -q package -DskipTests

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
VOLUME /app/data
# Aligné avec nginx (proxy /vibe-genealogy/auth → context-path)
ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_SERVLET_CONTEXT_PATH=/vibe-genealogy \
    SERVER_PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
