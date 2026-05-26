package com.g3.annimemo.features.dashboard.ui

import android.os.Bundle
import android.text.style.StrikethroughSpan
import android.text.SpannableString
import android.text.Spanned
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.ActivityDto
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.ReminderDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.FragmentDashboardBinding
import com.g3.annimemo.databinding.ItemActivityBinding
import com.g3.annimemo.databinding.ItemChecklistBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class DashboardFragment : Fragment() {
    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager

    private var petsList = listOf<PetDto>()
    private var remindersList = listOf<ReminderDto>()
    private var activitiesList = listOf<ActivityDto>()
    
    // Checklist for today
    private var todayChecklist = mutableListOf<ChecklistItem>()

    data class ChecklistItem(
        val id: String,
        val label: String,
        var done: Boolean
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())
        tokenManager = TokenManager(requireContext())

        setupUI()
        loadDashboardData()
    }

    private fun setupUI() {
        // Daily check-in button
        binding.btnStreakCheckin.setOnClickListener {
            handleDailyCheckin()
        }

        // Add task button
        binding.btnAddTask.setOnClickListener {
            val taskText = binding.etNewTask.text.toString().trim()
            if (taskText.isNotEmpty()) {
                addCustomChecklistItem(taskText)
                binding.etNewTask.setText("")
            }
        }

        // Settings gear button click
        binding.btnSettingsGear.setOnClickListener {
            findNavController().navigate(R.id.navigation_settings)
        }

        // Due soon card click -> Reminders
        binding.cvDueSoonCard.setOnClickListener {
            findNavController().navigate(R.id.navigation_reminders)
        }

        // Fact of the day card click -> Explore Breeds
        binding.cvFactCard.setOnClickListener {
            findNavController().navigate(R.id.navigation_explore_breeds)
        }
    }

    private fun loadDashboardData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            // 1. Fetch Profile
            val profile = try {
                val api = RetrofitClient.create { token }
                val response = api.getUserProfile()
                if (response.isSuccessful && response.body() != null) {
                    val p = response.body()!!
                    localStorageManager.saveUserProfile(p)
                    p
                } else {
                    localStorageManager.getUserProfile()
                }
            } catch (e: Exception) {
                localStorageManager.getUserProfile()
            }

            // 2. Fetch Pets
            val pets = try {
                val api = RetrofitClient.create { token }
                val response = api.getPets()
                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!
                    localStorageManager.savePets(list)
                    list
                } else {
                    localStorageManager.getPets()
                }
            } catch (e: Exception) {
                localStorageManager.getPets()
            }

            // 3. Fetch Reminders
            val reminders = try {
                val api = RetrofitClient.create { token }
                val response = api.getReminders()
                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!
                    localStorageManager.saveReminders(list)
                    list
                } else {
                    localStorageManager.getReminders()
                }
            } catch (e: Exception) {
                localStorageManager.getReminders()
            }

            // 4. Fetch Activities
            val activities = try {
                val api = RetrofitClient.create { token }
                val response = api.getRecentActivities()
                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!
                    localStorageManager.saveActivities(list)
                    list
                } else {
                    localStorageManager.getActivities()
                }
            } catch (e: Exception) {
                localStorageManager.getActivities()
            }

            withContext(Dispatchers.Main) {
                petsList = pets
                remindersList = reminders
                activitiesList = activities
                
                // Welcome message
                binding.tvWelcomeTitle.text = "Welcome back, ${profile.firstName ?: profile.username}! 👋"

                // Load or generate checklist
                loadOrCreateChecklist()
                
                // Calculate streak, care score, and due soon
                updateDashboardWidgets()
                
                // Populate dynamic UI lists
                populateChecklistUI()
                populateActivitiesUI()
                populateFactCard()
            }
        }
    }

    // 1. Calculate Activity Streak
    private fun calculateActivityStreak(): Int {
        val allActivities = localStorageManager.getActivities()
        if (allActivities.isEmpty()) return 0

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val uniqueDays = allActivities.map {
            try {
                val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it.timestamp)
                date?.let { dateFormat.format(it) }
            } catch (e: Exception) {
                null
            }
        }.filterNotNull().toSet()

        val todayKey = dateFormat.format(Date())
        
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -1)
        val yesterdayKey = dateFormat.format(cal.time)

        if (!uniqueDays.contains(todayKey) && !uniqueDays.contains(yesterdayKey)) {
            return 0
        }

        var streak = 0
        val cursor = Calendar.getInstance()
        if (!uniqueDays.contains(todayKey)) {
            cursor.add(Calendar.DAY_OF_YEAR, -1)
        }

        while (true) {
            val key = dateFormat.format(cursor.time)
            if (!uniqueDays.contains(key)) {
                break
            }
            streak++
            cursor.add(Calendar.DAY_OF_YEAR, -1)
        }

        return streak
    }

    private fun hasCheckedInToday(): Boolean {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val todayKey = dateFormat.format(Date())
        val allLocal = localStorageManager.getActivities()
        return allLocal.any {
            try {
                val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(it.timestamp)
                date?.let { dateFormat.format(it) } == todayKey && it.type == "checkin"
            } catch (e: Exception) {
                false
            }
        }
    }

    private fun handleDailyCheckin() {
        if (hasCheckedInToday()) {
            Toast.makeText(requireContext(), "Already checked in today! 🌟", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch(Dispatchers.IO) {
            val timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date())
            localStorageManager.logActivity(
                ActivityDto(
                    id = "activity-${System.currentTimeMillis()}",
                    type = "checkin",
                    description = "Completed daily pet care check-in! 🌟",
                    timestamp = timestamp,
                    icon = "🌟"
                )
            )

            // Re-fetch activities from disk
            val nextActivities = localStorageManager.getActivities()
            withContext(Dispatchers.Main) {
                activitiesList = nextActivities
                updateDashboardWidgets()
                populateActivitiesUI()
            }
        }
    }

    private fun updateDashboardWidgets() {
        // Streak widget
        val streak = calculateActivityStreak()
        binding.tvStreakValue.text = "$streak day${if (streak != 1) "s" else ""}"
        
        if (hasCheckedInToday()) {
            binding.btnStreakCheckin.text = "✅ Done"
            binding.btnStreakCheckin.isEnabled = false
        } else {
            binding.btnStreakCheckin.text = "Check-in"
            binding.btnStreakCheckin.isEnabled = true
        }

        // Care Score widget
        val completedCount = todayChecklist.count { it.done }
        val totalCount = todayChecklist.size
        val score = if (totalCount == 0) 0 else (completedCount * 100 / totalCount)
        
        binding.tvCareScoreValue.text = "$score%"
        binding.pbCareScore.progress = score

        // Due soon reminders count in 7 days
        val settings = localStorageManager.getSettings()
        val daysLimit = settings.reminderWindowDays
        val calLimit = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, daysLimit) }
        val dueCount = remindersList.count { 
            if (it.completed) return@count false
            val dueDateStr = it.dueDate ?: return@count false
            try {
                val dueDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dueDateStr)
                dueDate != null && dueDate.before(calLimit.time) && dueDate.after(Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }.time)
            } catch (e: Exception) {
                false
            }
        }
        binding.tvDueSoonValue.text = "$dueCount task${if (dueCount != 1) "s" else ""}"
    }

    // 2. Checklist storage key date dependent
    private fun getChecklistDateKey(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    private fun loadOrCreateChecklist() {
        val dateKey = getChecklistDateKey()
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_checklist_prefs", android.content.Context.MODE_PRIVATE)
        val savedSet = sharedPrefs.getStringSet("checklist_$dateKey", null)

        todayChecklist.clear()
        if (savedSet != null) {
            savedSet.forEach {
                val parts = it.split("|", limit = 3)
                if (parts.size == 3) {
                    todayChecklist.add(ChecklistItem(parts[0], parts[2], parts[1].toBoolean()))
                }
            }
        } else {
            // Generate default tasks for pets
            if (petsList.isEmpty()) {
                todayChecklist.add(ChecklistItem("default-addpet", "🐾 Add your first pet profile to get started", false))
            } else {
                petsList.forEach { pet ->
                    todayChecklist.add(ChecklistItem("feed-${pet.id}-${System.currentTimeMillis()}", "🥣 Feed ${pet.name}", false))
                    todayChecklist.add(ChecklistItem("play-${pet.id}-${System.currentTimeMillis()}", "🐕 Walk/Play with ${pet.name}", false))
                }
            }

            // Generate tasks for due reminders
            remindersList.take(3).forEach { reminder ->
                if (!reminder.completed) {
                    todayChecklist.add(ChecklistItem("reminder-${reminder.id}-${System.currentTimeMillis()}", "⏰ Complete reminder: ${reminder.title}", false))
                }
            }
            saveChecklistState()
        }
    }

    private fun saveChecklistState() {
        val dateKey = getChecklistDateKey()
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_checklist_prefs", android.content.Context.MODE_PRIVATE)
        val set = todayChecklist.map { "${it.id}|${it.done}|${it.label}" }.toSet()
        sharedPrefs.edit().putStringSet("checklist_$dateKey", set).apply()
    }

    private fun toggleChecklistItem(item: ChecklistItem) {
        item.done = !item.done
        saveChecklistState()
        
        if (item.done) {
            lifecycleScope.launch(Dispatchers.IO) {
                localStorageManager.logActivity(
                    ActivityDto(
                        id = "activity-${System.currentTimeMillis()}",
                        type = "checklist",
                        description = "Completed checklist task: ${item.label}",
                        timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                        icon = "✅"
                    )
                )
                
                val nextActivities = localStorageManager.getActivities()
                withContext(Dispatchers.Main) {
                    activitiesList = nextActivities
                    updateDashboardWidgets()
                    populateChecklistUI()
                    populateActivitiesUI()
                }
            }
        } else {
            updateDashboardWidgets()
            populateChecklistUI()
        }
    }

    private fun addCustomChecklistItem(label: String) {
        val newItem = ChecklistItem("custom-${System.currentTimeMillis()}", label, false)
        todayChecklist.add(newItem)
        saveChecklistState()

        lifecycleScope.launch(Dispatchers.IO) {
            localStorageManager.logActivity(
                ActivityDto(
                    id = "activity-${System.currentTimeMillis()}",
                    type = "checklist",
                    description = "Added checklist task: $label",
                    timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                    icon = "📝"
                )
            )
            
            val nextActivities = localStorageManager.getActivities()
            withContext(Dispatchers.Main) {
                activitiesList = nextActivities
                updateDashboardWidgets()
                populateChecklistUI()
                populateActivitiesUI()
            }
        }
    }

    private fun deleteChecklistItem(item: ChecklistItem) {
        todayChecklist.remove(item)
        saveChecklistState()
        updateDashboardWidgets()
        populateChecklistUI()
    }

    private fun populateChecklistUI() {
        binding.checklistContainer.removeAllViews()
        
        val completedCount = todayChecklist.count { it.done }
        val totalCount = todayChecklist.size
        binding.tvChecklistCount.text = "$completedCount/$totalCount done"
        binding.pbChecklist.progress = if (totalCount == 0) 0 else (completedCount * 100 / totalCount)

        if (todayChecklist.isEmpty()) {
            val emptyText = TextView(requireContext()).apply {
                text = "No checklist tasks for today. Add one above! ✨"
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 16, 0, 16)
                textSize = 14f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                typeface = android.graphics.Typeface.defaultFromStyle(android.graphics.Typeface.ITALIC)
            }
            binding.checklistContainer.addView(emptyText)
            return
        }

        todayChecklist.forEach { item ->
            val rowBinding = ItemChecklistBinding.inflate(layoutInflater, binding.checklistContainer, false)
            
            // Check state
            rowBinding.tvTaskCheck.text = if (item.done) "✅" else "⬜"
            
            if (item.done) {
                val spannable = SpannableString(item.label)
                spannable.setSpan(StrikethroughSpan(), 0, item.label.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                rowBinding.tvTaskLabel.text = spannable
                rowBinding.tvTaskLabel.alpha = 0.6f
            } else {
                rowBinding.tvTaskLabel.text = item.label
                rowBinding.tvTaskLabel.alpha = 1.0f
            }

            // Click row to toggle complete
            rowBinding.root.setOnClickListener {
                toggleChecklistItem(item)
            }
            rowBinding.tvTaskCheck.setOnClickListener {
                toggleChecklistItem(item)
            }

            // Click delete
            rowBinding.tvTaskDelete.setOnClickListener {
                deleteChecklistItem(item)
            }

            binding.checklistContainer.addView(rowBinding.root)
        }
    }

    private fun populateActivitiesUI() {
        binding.activitiesContainer.removeAllViews()

        if (activitiesList.isEmpty()) {
            val emptyText = TextView(requireContext()).apply {
                text = "No recent activities"
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 16, 0, 16)
                textSize = 14f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
            }
            binding.activitiesContainer.addView(emptyText)
            return
        }

        // Display up to 8 sorted activities (like the web app)
        activitiesList.take(8).forEach { activity ->
            val rowBinding = ItemActivityBinding.inflate(layoutInflater, binding.activitiesContainer, false)
            rowBinding.tvActivityIcon.text = activity.icon
            rowBinding.tvActivityPetName.text = activity.petName ?: "Activity logged"
            rowBinding.tvActivityDescription.text = activity.description
            rowBinding.tvActivityTimestamp.text = formatActivityTimestamp(activity.timestamp)

            binding.activitiesContainer.addView(rowBinding.root)
        }
    }

    private fun formatActivityTimestamp(value: String): String {
        return try {
            val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(value) ?: return "Recently"
            val now = Date()
            val diffMs = now.time - date.time
            
            val diffMins = diffMs / (1000 * 60)
            if (diffMins < 1) return "Just now"
            if (diffMins < 60) return "$diffMins min ago"
            
            val diffHours = diffMs / (1000 * 60 * 60)
            if (diffHours < 24) return "$diffHours hrs ago"
            
            SimpleDateFormat("MMM d, h:mm a", Locale.getDefault()).format(date)
        } catch (e: Exception) {
            "Recently"
        }
    }

    private fun populateFactCard() {
        // Pick a premium fact based on settings
        val settings = localStorageManager.getSettings()
        binding.tvFactSpecies.text = "🧬 Species: ${settings.defaultFactSpecies.uppercase(Locale.getDefault())}"
        
        // Static high-quality offline facts to keep it wowed
        val defaultFactText = when (settings.defaultFactSpecies.lowercase(Locale.getDefault())) {
            "dog" -> "Dogs have a sense of time. It's been proven they know the difference between one hour and four! 🐕\n💡 \"Happiness is a warm puppy.\" — Charles M. Schulz"
            "cat" -> "Cats share 95.6% of their genetic makeup with tigers. They also display tiger behaviors such as scent marking! 🐱\n💡 \"Time spent with cats is never wasted.\" — Sigmund Freud"
            "rabbit" -> "Rabbits perform an athletic leap known as a 'binky' when they are extremely happy or excited! 🐰"
            else -> "Pets thrive with predictable daily care routines, especially around feeding, exercise, and sleep. 🐾\n💡 \"The greatness of a nation and its moral progress can be judged by the way its animals are treated.\" — Mahatma Gandhi"
        }
        
        binding.tvFactText.text = defaultFactText
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
