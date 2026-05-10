# Software Test Plan - AnniMemo

## 1. Introduction
This document outlines the test plan for the AnniMemo application following the Vertical Slice Architecture refactoring.

## 2. Functional Requirements Coverage
- **FR1: User Registration** - Users must be able to create a new account with a unique username and email.
- **FR2: User Login** - Users must be able to securely authenticate using their credentials.
- **FR3: Backend/Web/Mobile Sync** - The web and mobile applications must successfully communicate with the backend.

## 3. Test Cases & Scripts

| Test ID | Description | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-01 | Successful User Registration | Database is running | 1. Navigate to Registration UI. 2. Enter valid details. 3. Submit. | Account created, redirected to Login. | Passed |
| TC-02 | Duplicate Registration | Account with email exists | 1. Enter existing email. 2. Submit. | Error message "Email already in use". | Passed |
| TC-03 | Successful Login | Account exists | 1. Enter valid credentials. 2. Submit. | Authenticated, token received, redirected to Dashboard. | Passed |
| TC-04 | Invalid Login | No matching account | 1. Enter invalid credentials. 2. Submit. | Error message "Invalid username/email or password". | Passed |

## 4. Automated Test Cases
Automated tests are implemented using JUnit and Spring Boot Test for the backend to verify the API endpoints.
- `AuthServiceTests.java`: Validates registration and login logic.
- `AuthControllerTests.java`: Validates HTTP request/response handling.
