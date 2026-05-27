# Stage 1: Build the application using Maven and JDK 17
FROM maven:3.8.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using a lightweight JRE
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/annimemo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080

# Bind port dynamically for cloud environments (like Render), falling back to 8080 locally
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]
