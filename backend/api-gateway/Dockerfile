# ── Build stage ──────────────────────────────────────
# Build context is the `backend/` directory (see docker-compose.yml), so the
# reactor pom and every module are visible for the dependencyManagement import.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY api-gateway/pom.xml api-gateway/pom.xml
RUN mvn -q -f api-gateway/pom.xml -N dependency:go-offline || true

COPY api-gateway/src api-gateway/src
RUN mvn -q -f api-gateway/pom.xml -DskipTests clean package

# ── Runtime stage ────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S devmind && adduser -S devmind -G devmind
WORKDIR /app
COPY --from=build /workspace/api-gateway/target/api-gateway.jar app.jar
USER devmind

EXPOSE 9000
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \
  CMD wget -qO- http://localhost:9000/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
