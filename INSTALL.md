# Install & Run (Local)

This document describes how to install and run each part of the project locally (backend, web, mobile). Commands show both Windows and Unix variants where relevant.

## Overview
- Backend: Java Spring Boot (Java 17, Maven wrapper)
- Web frontend: React app in `web` (Node.js + npm)
- Mobile: Android module in `mobile` (Gradle)

## Prerequisites
- Java 17 (JDK 17)
- Maven (you can use the included Maven wrapper in `backend`)
- Node.js 18+ (LTS) and `npm` or `yarn`
- Android SDK / Android Studio (for building/running `mobile` app)
- Git (for cloning)

Notes: On Windows use `mvnw.cmd` and `gradlew.bat` from the repo roots; on macOS/Linux use the shell wrappers `./mvnw` and `./gradlew`.

## Backend (development)

1. Open a terminal and go to the backend folder:

   Windows:

   ```powershell
   cd backend
   .\mvnw.cmd clean package
   .\mvnw.cmd spring-boot:run
   ```

   macOS / Linux:

   ```bash
   cd backend
   ./mvnw clean package
   ./mvnw spring-boot:run
   ```

2. Profiles / database:
- For quick local testing use the in-memory H2 DB: set `SPRING_PROFILES_ACTIVE=local` (this loads `application-local.properties`). Example on Windows PowerShell:

  ```powershell
  $env:SPRING_PROFILES_ACTIVE='local'
  .\mvnw.cmd spring-boot:run
  ```

- To run against Postgres/Supabase, set the following environment variables (or place them in a `.env` file loaded by Spring):

  - `SUPABASE_DB_URL` (JDBC URL)
  - `SUPABASE_DB_USER`
  - `SUPABASE_DB_PASSWORD`

3. Default backend port: `8080` (Spring Boot default).

4. Useful targets:
- Run tests: `./mvnw test` (or `mvnw.cmd test` on Windows)
- Build jar: `./mvnw package` -> `target/*.jar`

## Web frontend (`web`)

1. Install dependencies and run locally:

   ```bash
   cd web
   npm install
   npm start
   ```

2. Build production bundle:

   ```bash
   cd web
   npm run build
   ```

3. By default the React dev server runs on port `3000`. Configure API base URLs in the frontend `src/services` or by using environment variables used by the create-react-app configuration (e.g., `REACT_APP_API_URL`).

## Mobile (Android)

1. From repo root or the `mobile` folder use the Gradle wrapper.

   Windows:

   ```powershell
   cd mobile
   .\gradlew.bat assembleDebug
   .\gradlew.bat installDebug
   ```

   macOS / Linux:

   ```bash
   cd mobile
   ./gradlew assembleDebug
   ./gradlew installDebug
   ```

2. Run on an emulator or connected device via Android Studio or `adb`.

## Root / convenience
- There is a root `package.json` for any workspace-level scripts—check `package.json` for shortcuts.
- The backend loads `.env` files when present. You can place env vars at workspace root or in `backend/` as `backend/.env`.

## Running the full stack locally
1. Start the backend (use `local` profile for H2 or set DB env vars).
2. Start the frontend: `cd web && npm start`.
3. Start mobile or use built web bundle for static hosting.

## Troubleshooting
- If ports conflict, change the React port (`PORT=3001 npm start`) or Spring Boot `server.port` in `application.properties`.
- On Windows prefer PowerShell and use the `*.cmd` wrappers for Maven/Gradle.
- If Spring Boot cannot find DB env vars, confirm `.env` files or environment variables are correctly set and that `spring.config.import` lines in `application.properties` are not commented out.

## Quick command summary (Windows PowerShell)

```powershell
# Backend (local H2)
cd backend
$env:SPRING_PROFILES_ACTIVE='local'
.\mvnw.cmd spring-boot:run

# Frontend
cd ..\web
npm install
npm start

# Mobile (build & install)
cd ..\mobile
.\gradlew.bat assembleDebug
.\gradlew.bat installDebug
```
