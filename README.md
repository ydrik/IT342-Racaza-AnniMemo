# AnniMemo - Pet Health Tracking Ecosystem

AnniMemo is a premium, comprehensive full-stack pet care ecosystem designed to help pet owners organize, monitor, and track their pets' health metrics, daily activities, and veterinary medical schedules. The application comprises a robust Spring Boot REST API backend, a responsive React web client, and a native Kotlin Android application.

---

## 🎯 Recent Core Enhancements & Parity Upgrades

We have recently introduced major updates to deliver a premium, modern, and unified care-tracking experience across all platforms:

### 1. High-Fidelity Landing Pages (Web & Mobile Parity)
* **React Web Client**: Designed and deployed a stunning responsive Landing Page (`/` root route) featuring visual statistic cards, glassmorphic layout accents, a robust capabilities matrix (Profiles, Health, Reminders, Insights), and smooth hover states.
* **Native Android App**: Built `LandingActivity` to serve as the entry point launcher, translating the desktop-web landing modules into custom native Material Design 3 cards and button groups.
* **Frictionless Session Redirection**: Integrated session token validators on both web and mobile launchers (using `TokenManager` on Android) to automatically bypass the landing screens when a valid user token is present, instantly routing active users to the main Dashboard.

### 2. Premium Authentication UI Polish (Mobile)
* **Curved Linear Header Background**: Created `bg_login_header.xml` featuring soft bottom-rounded curves (`40dp`) and an organic gradient overlay.
* **Overlapped Form Layout**: Increased the purple authentication header height to `260dp` in both `activity_login.xml` and `activity_register.xml`. This eliminates rigid borders and allows the main form container to seamlessly overlap and float over the curved background gradient.
* **Thematic Logo Signature**: Replaced generic grid image placeholders inside logo cards with a beautiful, high-density paw print emoji (`🐾` at `36sp`) to align with our brand signature.

### 3. Native Parity, Navigation & Session Repairs
* **Unified Fragment Navigation**: Integrated native back-navigation headers across the Explore Breeds, Pets List, and Appointments screens to enable smooth returns to the primary Dashboard.
* **Active Calendar Highlight Indicators**: Programmed dynamic status chips and container tags to mark dates with registered scheduled events with a green highlight.
* **Profile Caching Synchronization**: Fixed a profile initialization caching bug to guarantee that user accounts consistently display their authentic username in settings, profiles, and dashboard greets.

---

## 🛠 Tech Stack

### Backend REST API
* **Framework**: Spring Boot (Java 17 / 21)
* **Build Tool**: Maven
* **ORM & Database Access**: Spring Data JPA & Hibernate
* **Security & Tokens**: Spring Security, BCryptPasswordEncoder, Stateless JWTs
* **Validation**: Jakarta Bean Validation API

### React Web Client
* **Framework**: React 18 (SPA)
* **Router**: React Router v6
* **HTTP Client**: Axios (configured with interceptors)
* **Styling**: Curated color palettes with responsive UI structures

### Native Mobile Application
* **Language & SDK**: Kotlin, Android SDK (API 26+)
* **Design Guidelines**: Google Material 3 design systems
* **Navigation**: Jetpack Navigation Component
* **Session Management**: SharedPreferences-backed secure `TokenManager`

---

## 📂 Project Structure

```
_AnniMemo/
├── backend/            # Spring Boot REST API
├── web/                # React Web Client (Vercel-ready)
├── mobile/             # Native Kotlin Android Application
├── README.md           # Project Overview & Latest Progress
└── INSTALL.md          # Local Setup & Installation Guide
```

---

## ⚙️ Safe Configuration & Decoupled Environment

To guarantee project security, all sensitive credentials, database keys, and endpoint targets must be kept out of the source repository. Configure these as environment variables before booting up the application.

### Backend Configuration (Configure in `.env` or system environment variables)
```properties
DB_URL=jdbc:postgresql://<YOUR_DATABASE_HOST_URL>:<PORT>/<DATABASE_NAME>
DB_USERNAME=<YOUR_DATABASE_USERNAME>
DB_PASSWORD=<YOUR_DATABASE_PASSWORD>
DB_DRIVER=org.postgresql.Driver
SERVER_PORT=8081
```

### React Web Frontend Configuration (Configure in `web/.env`)
```properties
REACT_APP_API_BASE_URL=http://localhost:8081
```

### Native Android App Emulator Networking
When running the Android application in an emulator, it references the backend REST API. By default, it uses the loopback address `10.0.2.2:8081` to safely communicate with the Spring Boot server running on the host machine.

---

## 🔐 Core Security Measures
* **Stateless Authorization**: Encapsulated JWT boundaries verifying user access.
* **Case-Insensitive Integrity**: Case-insensitive unique indexes on user accounts to prevent duplicate collision attacks.
* **Secure Environment Validation**: Automatic verification of database health and config validity on API startup.
