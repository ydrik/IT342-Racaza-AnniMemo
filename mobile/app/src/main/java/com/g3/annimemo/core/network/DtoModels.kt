package com.g3.annimemo.core.network

import java.io.Serializable

data class PetDto(
    val id: Long = 0,
    val name: String,
    val species: String,
    val breed: String? = null,
    val gender: String? = null,
    val dateOfBirth: String? = null,
    val weight: Double? = null,
    val color: String? = null,
    val imageUrl: String? = null,
    val notes: String? = null,
    val createdAt: String? = null
) : Serializable

data class ReminderDto(
    val id: Long = 0,
    val petId: Long,
    var petName: String? = null,
    val title: String,
    val type: String, // e.g. medication, vaccination, vet_visit, grooming, feeding, other
    val dueDate: String? = null,
    val notes: String? = null,
    var completed: Boolean = false
) : Serializable

data class ActivityDto(
    val id: String,
    val type: String,
    val description: String,
    val timestamp: String,
    val icon: String = "📌",
    var petName: String? = null
) : Serializable

data class AppointmentDto(
    val id: Long = 0,
    val petId: Long,
    var petName: String? = null,
    val dateTime: String,
    val reason: String,
    val notes: String? = null
) : Serializable
