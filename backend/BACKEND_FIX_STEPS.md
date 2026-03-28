## Backend Error Fix Steps (VS Code)

The backend code compiles successfully with Java 19 (`mvnw test` passes).
If Problems still show many package/import errors, refresh Java project import:

1. Open Command Palette.
2. Run `Java: Clean Java Language Server Workspace`.
3. Choose `Restart and delete`.
4. Run `Maven: Reload Projects`.
5. Run `Developer: Reload Window`.

After reload, the backend should be recognized as a Maven project and package errors should disappear.
