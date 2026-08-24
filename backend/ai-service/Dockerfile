# Build context is the `backend/` directory (see docker-compose.yml), so the
# reactor pom and every module are visible for the dependencyManagement import.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY ai-service/pom.xml ai-service/pom.xml
RUN mvn -q -f ai-service/pom.xml -N dependency:go-offline || true

COPY ai-service/src ai-service/src
RUN mvn -q -f ai-service/pom.xml -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S devmind && adduser -S devmind -G devmind
WORKDIR /app
COPY --from=build /workspace/ai-service/target/ai-service.jar app.jar
USER devmind

EXPOSE 8083
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:8083/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
