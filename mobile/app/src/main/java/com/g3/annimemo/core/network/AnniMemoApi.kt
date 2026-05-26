package com.g3.annimemo.core.network

import retrofit2.Response
import retrofit2.http.*

interface AnniMemoApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserDto>

    @GET("users/profile")
    suspend fun getUserProfile(): Response<UserProfileDto>

    @PUT("users/profile")
    suspend fun updateUserProfile(@Body profile: UserProfileDto): Response<UserProfileDto>

    @PUT("users/password")
    suspend fun changePassword(@Body request: PasswordChangeRequest): Response<Unit>

    @GET("pets")
    suspend fun getPets(): Response<List<PetDto>>

    @POST("pets")
    suspend fun createPet(@Body pet: PetDto): Response<PetDto>

    @PUT("pets/{id}")
    suspend fun updatePet(@Path("id") id: Long, @Body pet: PetDto): Response<PetDto>

    @DELETE("pets/{id}")
    suspend fun deletePet(@Path("id") id: Long): Response<Unit>

    @GET("reminders")
    suspend fun getReminders(): Response<List<ReminderDto>>

    @POST("reminders")
    suspend fun createReminder(@Body reminder: ReminderDto): Response<ReminderDto>

    @PUT("reminders/{id}/status")
    suspend fun updateReminderStatus(@Path("id") id: Long, @Query("completed") completed: Boolean): Response<ReminderDto>

    @DELETE("reminders/{id}")
    suspend fun deleteReminder(@Path("id") id: Long): Response<Unit>

    @GET("appointments")
    suspend fun getAppointments(): Response<List<AppointmentDto>>

    @POST("appointments")
    suspend fun createAppointment(@Body appointment: AppointmentDto): Response<AppointmentDto>

    @DELETE("appointments/{id}")
    suspend fun deleteAppointment(@Path("id") id: Long): Response<Unit>

    @GET("activities/recent")
    suspend fun getRecentActivities(): Response<List<ActivityDto>>
}

// Data Transfer Objects
data class RegisterRequest(
    val username: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val email: String
)

data class LoginRequest(
    val username: String,
    val password: String
)

data class AuthResponse(
    val message: String,
    val token: String,
    val username: String
)

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val role: String
)

data class UserProfileDto(
    val username: String,
    val firstName: String?,
    val lastName: String?,
    val email: String,
    val role: String? = null
)

data class PasswordChangeRequest(
    val currentPassword: String,
    val newPassword: String
)

