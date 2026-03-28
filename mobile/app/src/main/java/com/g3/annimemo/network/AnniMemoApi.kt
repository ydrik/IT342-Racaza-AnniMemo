package com.g3.annimemo.network

import retrofit2.Response
import retrofit2.http.*

interface AnniMemoApi {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getCurrentUser(): Response<UserDto>
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
    val identifier: String,
    val password: String
)

data class AuthResponse(
    val token: String,
    val type: String,
    val id: Long,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String
)

data class UserDto(
    val id: Long,
    val username: String,
    val email: String,
    val role: String
)
