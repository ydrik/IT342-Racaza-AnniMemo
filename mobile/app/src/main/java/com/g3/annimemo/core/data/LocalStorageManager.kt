package com.g3.annimemo.core.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.ReminderDto
import com.g3.annimemo.core.network.ActivityDto
import com.g3.annimemo.core.network.AppointmentDto
import com.g3.annimemo.core.network.UserProfileDto
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class SettingsDto(
    val reminderWindowDays: Int = 7,
    val defaultFactSpecies: String = "any",
    val compactDashboard: Boolean = false
)

class LocalStorageManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("annimemo_local_storage", Context.MODE_PRIVATE)
    private val gson = Gson()

    // 1. Pets storage
    fun getPets(): List<PetDto> {
        val json = prefs.getString("annimemo_pets", null) ?: return emptyList()
        val type = object : TypeToken<List<PetDto>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun savePets(pets: List<PetDto>) {
        prefs.edit().putString("annimemo_pets", gson.toJson(pets)).apply()
    }

    fun addPet(pet: PetDto): PetDto {
        val pets = getPets().toMutableList()
        val newId = if (pets.isEmpty()) 1L else (pets.maxOf { it.id } + 1)
        val petWithId = pet.copy(
            id = newId,
            createdAt = pet.createdAt ?: SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date())
        )
        pets.add(petWithId)
        savePets(pets)
        
        // Log activity
        logActivity(
            ActivityDto(
                id = "activity-${System.currentTimeMillis()}",
                type = "petCreated",
                description = "New pet profile created: ${petWithId.name}",
                timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                icon = "🐾",
                petName = petWithId.name
            )
        )
        
        return petWithId
    }

    fun updatePet(id: Long, updatedPet: PetDto): PetDto {
        val pets = getPets().map { 
            if (it.id == id) updatedPet.copy(id = id) else it 
        }
        savePets(pets)
        
        // Log activity
        logActivity(
            ActivityDto(
                id = "activity-${System.currentTimeMillis()}",
                type = "petUpdated",
                description = "Updated ${updatedPet.name}'s profile",
                timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                icon = "✏️",
                petName = updatedPet.name
            )
        )
        return updatedPet
    }

    fun deletePet(id: Long) {
        val pets = getPets()
        val petToDelete = pets.find { it.id == id }
        if (petToDelete != null) {
            val updated = pets.filter { it.id != id }
            savePets(updated)
            
            // Delete related reminders
            val reminders = getReminders().filter { it.petId != id }
            saveReminders(reminders)
            
            // Delete related appointments
            val appointments = getAppointments().filter { it.petId != id }
            saveAppointments(appointments)

            // Log activity
            logActivity(
                ActivityDto(
                    id = "activity-${System.currentTimeMillis()}",
                    type = "petDeleted",
                    description = "Deleted ${petToDelete.name}'s profile",
                    timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                    icon = "🗑️",
                    petName = petToDelete.name
                )
            )
        }
    }

    // 2. Reminders storage
    fun getReminders(): List<ReminderDto> {
        val json = prefs.getString("annimemo_reminders", null) ?: return emptyList()
        val type = object : TypeToken<List<ReminderDto>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveReminders(reminders: List<ReminderDto>) {
        prefs.edit().putString("annimemo_reminders", gson.toJson(reminders)).apply()
    }

    fun addReminder(reminder: ReminderDto): ReminderDto {
        val reminders = getReminders().toMutableList()
        val newId = if (reminders.isEmpty()) 1L else (reminders.maxOf { it.id } + 1)
        
        // Enrich petName
        val petName = getPets().find { it.id == reminder.petId }?.name ?: "Unknown Pet"
        val reminderWithId = reminder.copy(id = newId, petName = petName)
        
        reminders.add(reminderWithId)
        saveReminders(reminders)
        
        // Log activity
        logActivity(
            ActivityDto(
                id = "activity-${System.currentTimeMillis()}",
                type = "reminderCreated",
                description = "Created reminder: ${reminderWithId.title}",
                timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                icon = "⏰",
                petName = petName
            )
        )
        return reminderWithId
    }

    fun toggleReminderStatus(id: Long, completed: Boolean): ReminderDto? {
        val reminders = getReminders()
        var updated: ReminderDto? = null
        val nextList = reminders.map {
            if (it.id == id) {
                updated = it.copy(completed = completed)
                updated!!
            } else {
                it
            }
        }
        saveReminders(nextList)

        updated?.let {
            if (completed) {
                logActivity(
                    ActivityDto(
                        id = "activity-${System.currentTimeMillis()}",
                        type = "reminderCompleted",
                        description = "Completed reminder: ${it.title}",
                        timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                        icon = "✅",
                        petName = it.petName
                    )
                )
            }
        }
        return updated
    }

    fun deleteReminder(id: Long) {
        val reminders = getReminders()
        val updated = reminders.filter { it.id != id }
        saveReminders(updated)
    }

    // 3. Activities storage
    fun getActivities(): List<ActivityDto> {
        val json = prefs.getString("annimemo_activities", null) ?: return emptyList()
        val type = object : TypeToken<List<ActivityDto>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveActivities(activities: List<ActivityDto>) {
        prefs.edit().putString("annimemo_activities", gson.toJson(activities)).apply()
    }

    fun logActivity(activity: ActivityDto) {
        val activities = getActivities().toMutableList()
        activities.add(0, activity)
        // Cap list size to 50 items like the web app
        val capped = if (activities.size > 50) activities.take(50) else activities
        saveActivities(capped)
    }

    // 4. Appointments storage
    fun getAppointments(): List<AppointmentDto> {
        val json = prefs.getString("annimemo_appointments", null) ?: return emptyList()
        val type = object : TypeToken<List<AppointmentDto>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveAppointments(appointments: List<AppointmentDto>) {
        prefs.edit().putString("annimemo_appointments", gson.toJson(appointments)).apply()
    }

    fun addAppointment(app: AppointmentDto): AppointmentDto {
        val apps = getAppointments().toMutableList()
        val newId = if (apps.isEmpty()) 1L else (apps.maxOf { it.id } + 1)
        
        // Enrich petName
        val petName = getPets().find { it.id == app.petId }?.name ?: "Unknown Pet"
        val appWithId = app.copy(id = newId, petName = petName)
        
        apps.add(appWithId)
        saveAppointments(apps)

        // Log activity
        logActivity(
            ActivityDto(
                id = "activity-${System.currentTimeMillis()}",
                type = "appointmentCreated",
                description = "Scheduled appointment: ${appWithId.reason}",
                timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                icon = "🏥",
                petName = petName
            )
        )
        return appWithId
    }

    fun deleteAppointment(id: Long) {
        val apps = getAppointments()
        val updated = apps.filter { it.id != id }
        saveAppointments(updated)
    }

    // 5. User profile storage
    fun getUserProfile(fallbackUsername: String = "User"): UserProfileDto {
        val json = prefs.getString("annimemo_user_profile", null)
        if (json != null) {
            try {
                return gson.fromJson(json, UserProfileDto::class.java)
            } catch (e: Exception) {
                // fallback below
            }
        }
        return UserProfileDto(
            username = fallbackUsername,
            firstName = fallbackUsername,
            lastName = "",
            email = "$fallbackUsername@example.com",
            role = "USER"
        )
    }

    fun saveUserProfile(profile: UserProfileDto) {
        prefs.edit().putString("annimemo_user_profile", gson.toJson(profile)).apply()
    }

    // 6. Settings storage
    fun getSettings(): SettingsDto {
        val json = prefs.getString("annimemo_settings", null) ?: return SettingsDto()
        return try {
            gson.fromJson(json, SettingsDto::class.java) ?: SettingsDto()
        } catch (e: Exception) {
            SettingsDto()
        }
    }

    fun saveSettings(settings: SettingsDto) {
        prefs.edit().putString("annimemo_settings", gson.toJson(settings)).apply()
    }
}
