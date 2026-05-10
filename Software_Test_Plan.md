# Software Test Plan - AnniMemo

## 1. Introduction
This document outlines the test plan for the AnniMemo application following the Vertical Slice Architecture refactoring.

## 2. Functional Requirements Coverage
- **FR1: User Registration** - Users must be able to create a new account with a unique username and email.
- **FR2: User Login** - Users must be able to securely authenticate using their credentials.
- **FR3: Backend/Web/Mobile Sync** - The web and mobile applications must successfully communicate with the backend.

## 3. Test Cases & Scripts (Steps)

| Test ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-01 | Successful User Registration | Database is running | 1. Navigate to the Registration screen.<br>2. Fill in First Name, Last Name, Username, Email, and Password.<br>3. Click "Register". | Account is created in the database. User receives a success message and is redirected to the Login screen. | Passed |
| TC-02 | Duplicate Registration | Account with email/username exists | 1. Navigate to the Registration screen.<br>2. Enter an email or username that already belongs to another user.<br>3. Click "Register". | System rejects the registration with an error message: "Email is already in use" or "Username is already taken". | Passed |
| TC-03 | Successful Login | User account already exists | 1. Navigate to the Login screen.<br>2. Enter valid username/email and correct password.<br>3. Click "Login". | Authenticated successfully. JWT token is received, and user is redirected to the Dashboard. | Passed |
| TC-04 | Invalid Login | No matching account or wrong password | 1. Navigate to the Login screen.<br>2. Enter an incorrect username or wrong password.<br>3. Click "Login". | System rejects login with error message "Invalid username/email or password". | Passed |
| TC-05 | UI Feature Navigation | App is running | 1. Open the Mobile App.<br>2. Navigate through Dashboard, Pets, Profile, and Reminders tabs. | The UI fragments load correctly from their new feature packages without crashing. | Passed |

## 4. Automated Test Cases
Automated tests are implemented using JUnit and Spring Boot `MockMvc` for the backend to verify the API endpoints in the `AuthControllerIntegrationTest.java` suite.

- `registerAndLoginShouldSucceed()`: Validates that a valid registration returns `201 Created` and a valid login returns `200 OK` with a JWT token.
- `duplicateUsernameShouldReturnBadRequest()`: Validates that registering a user with an already taken username returns `400 Bad Request`.
- `duplicateEmailShouldReturnBadRequest()`: Validates that registering a user with an already taken email returns `400 Bad Request`.
