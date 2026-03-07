# AnniMemo - Pet Health Tracking System

A comprehensive full-stack web application designed to help pet owners organize, monitor, and track their pets' health metrics over time. AnniMemo provides an intuitive interface for managing multiple pets, logging health metrics, and maintaining detailed health records.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Database Setup](#database-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Database Schema](#database-schema)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**AnniMemo** is a pet health management platform that enables pet owners to:
- Register and manage multiple pets
- Track health metrics (weight, temperature, vaccination status, etc.)
- Monitor activity levels and habits
- Maintain comprehensive health records
- View health trends over time

The system uses a modern three-tier architecture with a React-based frontend, Spring Boot backend, and PostgreSQL database hosted on Supabase.

---

## ✨ Features

### Authentication & User Management
- **Secure Registration**: Strong password enforcement (12+ characters with complexity rules)
- **Flexible Login**: Username or email-based authentication
- **Duplicate Prevention**: Case-insensitive email uniqueness validation at both app and database layers
- **JWT Token-based Sessions**: Secure token generation and management

### Pet Management
- Create and manage multiple pets
- Store detailed pet information (name, breed, age, weight, etc.)
- Upload and manage pet photos
- Track pet health history

### Health Metrics Tracking
- Log and monitor various health metrics
- Real-time health status visualization
- Track activity and behavioral data
- Historical data comparison and trend analysis

### User Interface
- Responsive, modern design with dark/light theme support
- Real-time password strength feedback during registration
- Intuitive dashboard for quick health overview
- Role-based access control

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS-in-JS (inline styles)
- **Build Tool**: Create React App (react-scripts)
- **Port**: 3000

### Backend
- **Framework**: Spring Boot 3.5.11
- **Language**: Java 21
- **Build Tool**: Maven
- **ORM**: Spring Data JPA
- **Validation**: Jakarta Bean Validation
- **Security**: Spring Security, BCryptPasswordEncoder, JWT
- **Port**: 8080/8081

### Database
- **Type**: PostgreSQL 15+
- **Hosting**: Supabase (cloud-hosted)
- **Connection Pool**: Session Pooler (port 5432)
- **Fallback**: H2 (for local development/testing)

### DevOps & Tools
- **Version Control**: Git
- **Testing**: JUnit 5, Spring Boot Test, MockMvc
- **API Testing**: cURL, PowerShell

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                    │
│  - LoginPage, RegisterPage, Dashboard, PetList, etc.        │
│  - Real-time form validation and feedback                   │
│  - JWT token-based authentication management                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Spring Boot)                    │
│  - AuthController: /api/auth/login, /api/auth/register     │
│  - Request/Response DTOs with validation                    │
│  - Global exception handling                                │
│  - CORS configuration for frontend integration              │
└──────────────────────┬──────────────────────────────────────┘
                       │ JPA
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Business Logic Layer (Services)                │
│  - AuthService: user registration and login logic           │
│  - Password hashing with BCryptPasswordEncoder              │
│  - Email normalization and duplicate checking               │
└──────────────────────┬──────────────────────────────────────┘
                       │ JPA Repository
                       ↓
┌─────────────────────────────────────────────────────────────┐
│        Data Access Layer (JPA Repositories)                 │
│  - AppUserRepository: custom query methods                  │
│  - findByUsername(), findByEmail()                          │
│  - existsByUsername(), existsByEmail()                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ JDBC/SQL
                       ↓
┌─────────────────────────────────────────────────────────────┐
│          Database Layer (PostgreSQL/Supabase)               │
│  - app_users table with normalized emails                   │
│  - Case-insensitive unique index on email                   │
│  - Active startup initialization for DB constraints         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK)**: Version 21 or higher
  - Download from [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://openjdk.java.net/)
  - Verify: `java -version`

- **Maven**: Version 3.8.0 or higher
  - Download from [Apache Maven](https://maven.apache.org/download.cgi)
  - Verify: `mvn -version`
  - Note: Maven wrapper (`mvnw.cmd`) is included in the backend folder

- **Node.js & npm**: Version 16.0.0 or higher
  - Download from [Node.js](https://nodejs.org/)
  - Verify: `node -v` and `npm -v`

- **PostgreSQL**: Version 13+ (for local development) OR
  - **Supabase Account**: Free PostgreSQL hosting
  - Sign up at [Supabase](https://supabase.com/)

- **Git**: For version control
  - Download from [Git](https://git-scm.com/)

---

## 📁 Project Structure

```
_AnniMemo/
├── backend/                              # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/edu/cit/racaza/annimemo/
│   │   │   │   ├── AnnimemoApplication.java     # Spring Boot entry point
│   │   │   │   ├── auth/
│   │   │   │   │   ├── controller/
│   │   │   │   │   │   ├── AuthController.java  # Login/Register endpoints
│   │   │   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── LoginRequest.java    # Login DTO with validation
│   │   │   │   │   │   └── RegisterRequest.java # Register DTO with password policy
│   │   │   │   │   ├── model/
│   │   │   │   │   │   └── AppUser.java         # User entity
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   └── AppUserRepository.java
│   │   │   │   │   ├── service/
│   │   │   │   │   │   └── AuthService.java     # Business logic
│   │   │   │   │   └── exception/
│   │   │   │   │       └── AuthException.java
│   │   │   │   └── config/
│   │   │   │       ├── DatabaseConfigurationValidator.java
│   │   │   │       ├── PostgresEmailIndexInitializer.java
│   │   │   │       └── WebConfig.java
│   │   │   └── resources/
│   │   │       ├── application.properties       # Production config
│   │   │       └── application-local.properties # Local H2 config
│   │   └── test/
│   │       └── java/edu/cit/racaza/annimemo/auth/
│   │           └── AuthControllerIntegrationTest.java
│   ├── pom.xml                           # Maven dependencies
│   └── mvnw.cmd                          # Maven wrapper (Windows)
│
├── web/                                  # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.js              # Login form (username or email)
│   │   │   ├── RegisterPage.js           # Registration with password strength
│   │   │   ├── Dashboard.js              # Main dashboard
│   │   │   ├── PetList.js                # Pet management
│   │   │   ├── AddPet.js                 # Add new pet
│   │   │   ├── EditPet.js                # Edit pet info
│   │   │   ├── HealthMetrics.js          # Health tracking
│   │   │   ├── UserProfile.js            # User settings
│   │   │   ├── ThemeToggle.js            # Dark/light theme
│   │   │   └── [Other components]
│   │   ├── services/
│   │   │   ├── auth.service.js           # Auth API calls
│   │   │   └── activity.service.js       # Activity API calls
│   │   ├── App.js                        # Main app component
│   │   └── index.js                      # React entry point
│   ├── package.json                      # npm dependencies
│   └── public/
│       └── index.html                    # HTML template
│
├── README.md                             # This file
├── package.json                          # Root package manifest
└── TASK_CHECKLIST.md                     # Development checklist
```

---

## 🚀 Getting Started

### Database Setup

#### Option 1: Supabase (Recommended for Production/Testing)

1. **Create a Supabase Project**:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Click "New Project" and fill in project details
   - Wait for database provisioning (2-3 minutes)

2. **Get Connection Details**:
   - In Supabase Dashboard, go to **Settings → Database**
   - Note the following:
     - Host: `aws-1-ap-south-1.pooler.supabase.com`
     - Port: `5432`
     - Database: `postgres`
     - Username: `postgres.xxxxx`
     - Password: Your secure password

3. **Enable Required Extensions** (if not already enabled):
   - Run in Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

#### Option 2: Local PostgreSQL (Development)

1. **Install PostgreSQL**:
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - During installation, note the superuser password

2. **Create Database**:
   ```bash
   psql -U postgres
   CREATE DATABASE annimemo;
   \q
   ```

3. **Connection String**:
   ```
   jdbc:postgresql://localhost:5432/annimemo
   ```

### Backend Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/AnniMemo.git
   cd AnniMemo/backend
   ```

2. **Configure Environment Variables**:
   
   Create or update `.env` file in the backend folder:
   ```properties
   DB_URL=jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   DB_USERNAME=postgres.eulsufnmpkrrtjvcypfh
   DB_PASSWORD=YourSecurePassword123
   DB_DRIVER=org.postgresql.Driver
   SERVER_PORT=8081
   ```

   Or set as system environment variables:
   ```bash
   $env:DB_URL='jdbc:postgresql://...'
   $env:DB_USERNAME='postgres...'
   $env:DB_PASSWORD='...'
   $env:DB_DRIVER='org.postgresql.Driver'
   $env:SERVER_PORT='8081'
   ```

3. **Install Dependencies**:
   ```bash
   cd backend
   ./mvnw clean install
   ```
   On Windows:
   ```powershell
   .\mvnw.cmd clean install
   ```

4. **Verify Setup**:
   ```bash
   ./mvnw test
   ```

### Frontend Setup

1. **Navigate to Frontend**:
   ```bash
   cd ../web
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Endpoint** (if needed):
   
   Create `.env` file in the web folder or update it:
   ```properties
   REACT_APP_API_BASE_URL=http://localhost:8081
   ```

4. **Build (Optional)**:
   ```bash
   npm run build
   ```

---

## ▶️ Running the Application

### Start Backend Server

**Option 1: Using Maven (Windows)**:
```powershell
$env:DB_URL='jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
$env:DB_USERNAME='postgres.eulsufnmpkrrtjvcypfh'
$env:DB_PASSWORD='YourSecurePassword123'
$env:DB_DRIVER='org.postgresql.Driver'
$env:SERVER_PORT='8081'

cd backend
.\mvnw.cmd spring-boot:run
```

**Option 2: Using Maven (Linux/Mac)**:
```bash
cd backend
export DB_URL='jdbc:postgresql://...'
export DB_USERNAME='postgres...'
export DB_PASSWORD='...'
export DB_DRIVER='org.postgresql.Driver'
export SERVER_PORT='8081'

./mvnw spring-boot:run
```

**Option 3: Using JAR**:
```bash
cd backend
mvn clean package
java -jar target/annimemo-0.0.1-SNAPSHOT.jar
```

**Expected Output**:
```
Started AnnimemoApplication in 5.234 seconds (JVM running for 5.876)
```

Backend runs on: **http://localhost:8081**

### Start Frontend Development Server

In a new terminal:
```bash
cd web
npm start
```

Frontend runs on: **http://localhost:3000**

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass!123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Registration successful"
}
```

**Password Requirements**:
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No spaces allowed

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe OR john@example.com",
  "password": "SecurePass!123"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid input or weak password
- **409 Conflict**: User already exists (registration)
- **401 Unauthorized**: Invalid credentials (login)

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=AuthControllerIntegrationTest

# Run with coverage
./mvnw test jacoco:report
```

**Test Coverage**:
- `AuthControllerIntegrationTest`: Tests registration, login, duplicate prevention
- `AnnimemoApplicationTests`: Application startup verification

**Expected Results**:
```
Tests run: 4, Failures: 0, Errors: 0
```

### Run Frontend Tests

```bash
cd web

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 🔐 Security Features

### Password Security
- **Hashing**: BCryptPasswordEncoder with salt
- **Validation**: 12-character minimum with complexity requirements
- **Real-time Feedback**: Client-side strength meter and requirement checklist
- **Storage**: Bcrypt hashes are salted and irreversible

### Email Validation
- **Normalization**: Emails converted to lowercase and trimmed
- **Case-insensitive Uniqueness**: Enforced at both application and database levels
- **Database Constraint**: PostgreSQL unique index on `lower(email)`

### Token Management
- **JWT Tokens**: Base64-encoded username:timestamp format
- **Token Storage**: LocalStorage on client
- **Token Validation**: Server-side verification on protected endpoints

### Database Security
- **Connection Pooling**: Supabase Session Pooler for connection management
- **SSL/TLS**: Encrypted connections to database
- **Startup Validation**: Database configuration and constraints verified at startup

---

## 📊 Database Schema

### app_users Table

```sql
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Case-insensitive unique index on email
CREATE UNIQUE INDEX uk_app_users_email_ci 
ON app_users (lower(email));
```

---

## 🚀 Deployment

### Deploy Backend to Cloud

#### Option 1: Deploy to Railway
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Railway automatically detects Spring Boot project
4. Set environment variables in Railway dashboard
5. Deploy with `git push`

#### Option 2: Deploy to Heroku
1. Create Heroku account and install CLI
2. ```bash
   heroku login
   heroku create your-app-name
   heroku config:set DB_URL=... DB_USERNAME=... DB_PASSWORD=...
   git push heroku main
   ```

#### Option 3: Deploy to AWS
1. Package JAR: `mvn clean package`
2. Upload to EC2 or Elastic Beanstalk
3. Configure security groups for port 8081
4. Set environment variables on instance

### Deploy Frontend to Cloud

#### Option 1: Deploy to Vercel
1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Set `REACT_APP_API_BASE_URL` in Vercel environment
4. Deploy automatically on `git push`

#### Option 2: Deploy to Netlify
1. ```bash
   npm run build
   netlify deploy --prod --dir=build
   ```

#### Option 3: Deploy to AWS S3 + CloudFront
1. `npm run build`
2. Upload `build/` folder to S3
3. Create CloudFront distribution pointing to S3

---

## 🛠 Troubleshooting

### Backend Issues

**Compilation Error: "Cannot find symbol"**
- Solution: Run `mvn clean compile`

**Database Connection Failed**
- Check environment variables are set correctly
- Verify Supabase credentials
- Test with: `psql -h <host> -U <user> -d postgres`

**Port 8081 Already in Use**
- Change `SERVER_PORT` environment variable
- Or kill existing process: `lsof -i :8081` (Linux/Mac)

**Tests Fail with Database Error**
- Ensure H2 is in classpath for local profile
- Check `application-local.properties` configuration

### Frontend Issues

**npm start fails with "PORT 3000 in use"**
- Change port: `set PORT=3001 && npm start` (Windows)
- Or: `PORT=3001 npm start` (Linux/Mac)

**CORS errors when calling backend**
- Verify backend CORS configuration in `WebConfig.java`
- Check `REACT_APP_API_BASE_URL` matches backend URL
- Backend must be running when frontend makes requests

**"Cannot GET /dashboard" after login**
- React Router requires SPA setup on server
- For deployment, ensure server reroutes all requests to `index.html`

**Password strength meter not showing**
- Ensure `hasPasswordInput` state is properly checking `formData.password.length > 0`
- Check browser console for JavaScript errors

---

## 📝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear commit messages
4. **Write/update tests** for new features
5. **Run tests**: `mvn test` (backend) and `npm test` (frontend)
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

**Code Style**:
- Backend: Follow Google Java Style Guide
- Frontend: Follow Airbnb React/JSX Style Guide
- Use meaningful variable and function names
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Support & Contact

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation in TASK_CHECKLIST.md

---

## 🎓 Key Learning Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Guide](https://supabase.com/docs)
- [JWT.io](https://jwt.io/)

---

**Last Updated**: March 7, 2026  
**Version**: 1.0.0

