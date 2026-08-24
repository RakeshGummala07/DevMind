#!/usr/bin/env python3
"""
One-off scaffolding script used during Phase 1 to generate consistent
Spring Boot skeletons for every backend microservice. Kept in the repo
as a record of how the services were bootstrapped / as a template for
adding a new service later.
"""
import os

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "backend")

SERVICES = {
    "auth-service": {
        "port": 8081,
        "package": "authservice",
        "description": "Registration, login, JWT issuance, refresh tokens, GitHub OAuth2, RBAC",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-security"),
            ("org.springframework.boot", "spring-boot-starter-oauth2-client"),
            ("org.springframework.boot", "spring-boot-starter-data-jpa"),
            ("org.springframework.boot", "spring-boot-starter-validation"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("com.mysql", "mysql-connector-j", None, "runtime"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("io.jsonwebtoken", "jjwt-api", "0.12.6"),
            ("io.jsonwebtoken", "jjwt-impl", "0.12.6", "runtime"),
            ("io.jsonwebtoken", "jjwt-jackson", "0.12.6", "runtime"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"MYSQL": True},
    },
    "repository-service": {
        "port": 8082,
        "package": "repositoryservice",
        "description": "GitHub repositories, PRs, issues, commits, webhook ingestion, event publishing",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-data-jpa"),
            ("org.springframework.boot", "spring-boot-starter-data-redis"),
            ("org.springframework.boot", "spring-boot-starter-validation"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("org.springframework.kafka", "spring-kafka"),
            ("com.mysql", "mysql-connector-j", None, "runtime"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"MYSQL": True, "REDIS": True, "KAFKA": True},
    },
    "ai-service": {
        "port": 8083,
        "package": "aiservice",
        "description": "Codebase chat, semantic search, documentation generation (RAG over Qdrant + Ollama)",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-data-mongodb"),
            ("org.springframework.boot", "spring-boot-starter-validation"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"MONGO": True, "QDRANT": True, "OLLAMA": True},
    },
    "ingestion-service": {
        "port": 8084,
        "package": "ingestionservice",
        "description": "Repository cloning, file filtering, chunking, embedding generation, Qdrant indexing",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("org.springframework.kafka", "spring-kafka"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"KAFKA": True, "QDRANT": True, "OLLAMA": True},
    },
    "analysis-service": {
        "port": 8085,
        "package": "analysisservice",
        "description": "AI pull-request review: changed-file retrieval, RAG, findings persistence",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-data-jpa"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("org.springframework.kafka", "spring-kafka"),
            ("com.mysql", "mysql-connector-j", None, "runtime"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"MYSQL": True, "KAFKA": True, "QDRANT": True, "OLLAMA": True},
    },
    "notification-service": {
        "port": 8086,
        "package": "notificationservice",
        "description": "Fan-out of indexing / review / documentation status events to users",
        "deps": [
            ("org.springframework.boot", "spring-boot-starter-web"),
            ("org.springframework.boot", "spring-boot-starter-data-mongodb"),
            ("org.springframework.boot", "spring-boot-starter-actuator"),
            ("org.springframework.kafka", "spring-kafka"),
            ("io.micrometer", "micrometer-registry-prometheus"),
            ("org.projectlombok", "lombok", None, None, True),
        ],
        "extra_props": {"MONGO": True, "KAFKA": True},
    },
}

POM_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>com.devmind</groupId>
    <artifactId>devmind-backend</artifactId>
    <version>0.1.0-SNAPSHOT</version>
  </parent>

  <artifactId>{name}</artifactId>
  <packaging>jar</packaging>
  <name>{name}</name>
  <description>{description}</description>

  <dependencies>
{dependencies}
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <finalName>{name}</finalName>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

</project>
"""

MAIN_CLASS_TEMPLATE = """package com.devmind.{package};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class {class_name}Application {{

    public static void main(String[] args) {{
        SpringApplication.run({class_name}Application.class, args);
    }}
}}
"""

DOCKERFILE_TEMPLATE = """# Build context is the `backend/` directory (see docker-compose.yml), so the
# reactor pom and every module are visible for the dependencyManagement import.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY {name}/pom.xml {name}/pom.xml
RUN mvn -q -f {name}/pom.xml -N dependency:go-offline || true

COPY {name}/src {name}/src
RUN mvn -q -f {name}/pom.xml -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S devmind && adduser -S devmind -G devmind
WORKDIR /app
COPY --from=build /workspace/{name}/target/{name}.jar app.jar
USER devmind

EXPOSE {port}
HEALTHCHECK --interval=15s --timeout=5s --retries=10 \\
  CMD wget -qO- http://localhost:{port}/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
"""


def dep_xml(dep):
    group, artifact = dep[0], dep[1]
    version = dep[2] if len(dep) > 2 else None
    scope = dep[3] if len(dep) > 3 else None
    optional = dep[4] if len(dep) > 4 else False
    lines = ["    <dependency>", f"      <groupId>{group}</groupId>", f"      <artifactId>{artifact}</artifactId>"]
    if version:
        lines.append(f"      <version>{version}</version>")
    if scope:
        lines.append(f"      <scope>{scope}</scope>")
    if optional:
        lines.append("      <optional>true</optional>")
    lines.append("    </dependency>")
    return "\n".join(lines)


def application_yml(name, cfg):
    props = cfg["extra_props"]
    lines = [
        f"server:",
        f"  port: {cfg['port']}",
        "",
        "spring:",
        f"  application:",
        f"    name: {name}",
    ]
    if props.get("MYSQL"):
        lines += [
            "  datasource:",
            "    url: jdbc:mysql://${MYSQL_HOST:localhost}:${MYSQL_PORT:3306}/${MYSQL_DATABASE:devmind}",
            "    username: ${MYSQL_USERNAME:devmind}",
            "    password: ${MYSQL_PASSWORD:devmind_local_password}",
            "  jpa:",
            "    hibernate:",
            "      ddl-auto: validate",
            "    open-in-view: false",
        ]
    if props.get("MONGO"):
        lines += [
            "  data:",
            "    mongodb:",
            "      uri: ${MONGODB_URI:mongodb://localhost:27017/devmind}",
        ]
    if props.get("REDIS"):
        lines += [
            "  data:",
            "    redis:",
            "      host: ${REDIS_HOST:localhost}",
            "      port: ${REDIS_PORT:6379}",
        ]
    if props.get("KAFKA"):
        lines += [
            "  kafka:",
            "    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}",
            "    consumer:",
            f"      group-id: {name}",
            "      auto-offset-reset: earliest",
        ]
    lines += [
        "",
        "management:",
        "  endpoints:",
        "    web:",
        "      exposure:",
        "        include: health, info, prometheus",
        "  endpoint:",
        "    health:",
        "      show-details: always",
        "",
    ]
    if props.get("QDRANT"):
        lines += ["devmind:", "  qdrant-url: ${QDRANT_URL:http://localhost:6333}"]
    if props.get("OLLAMA"):
        lines += [
            "  ai-provider: ${AI_PROVIDER:ollama}",
            "  ollama-base-url: ${OLLAMA_BASE_URL:http://localhost:11434}",
            "  ai-model: ${AI_MODEL:llama3.1:8b}",
            "  embedding-model: ${EMBEDDING_MODEL:nomic-embed-text}",
        ]
    lines += [
        "",
        "logging:",
        "  pattern:",
        '    console: "%d{ISO8601} %-5level [%X{correlationId}] %logger{36} - %msg%n"',
    ]
    return "\n".join(lines) + "\n"


for name, cfg in SERVICES.items():
    svc_dir = os.path.join(BACKEND_DIR, name)
    java_dir = os.path.join(svc_dir, "src", "main", "java", "com", "devmind", cfg["package"])
    resources_dir = os.path.join(svc_dir, "src", "main", "resources")
    os.makedirs(java_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)

    deps_xml = "\n".join(dep_xml(d) for d in cfg["deps"])
    pom = POM_TEMPLATE.format(name=name, description=cfg["description"], dependencies=deps_xml)
    with open(os.path.join(svc_dir, "pom.xml"), "w") as f:
        f.write(pom)

    class_name = "".join(p.capitalize() for p in name.split("-"))
    main_class = MAIN_CLASS_TEMPLATE.format(package=cfg["package"], class_name=class_name)
    with open(os.path.join(java_dir, f"{class_name}Application.java"), "w") as f:
        f.write(main_class)

    with open(os.path.join(resources_dir, "application.yml"), "w") as f:
        f.write(application_yml(name, cfg))

    dockerfile = DOCKERFILE_TEMPLATE.format(name=name, port=cfg["port"])
    with open(os.path.join(svc_dir, "Dockerfile"), "w") as f:
        f.write(dockerfile)

    print(f"scaffolded {name} (port {cfg['port']})")

print("done")
