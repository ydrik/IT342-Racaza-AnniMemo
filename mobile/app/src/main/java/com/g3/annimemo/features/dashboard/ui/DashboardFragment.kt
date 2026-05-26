package com.g3.annimemo.features.dashboard.ui

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.text.style.StrikethroughSpan
import android.text.SpannableString
import android.text.Spanned
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CalendarView
import android.widget.LinearLayout
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
import com.g3.annimemo.core.network.AppointmentDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.FragmentDashboardBinding
import com.g3.annimemo.databinding.ItemActivityBinding
import com.g3.annimemo.databinding.ItemChecklistBinding
import com.g3.annimemo.features.pets.ui.AddPetActivity
import com.g3.annimemo.features.pets.ui.HealthMetricsActivity
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
    private var appointmentsList = listOf<AppointmentDto>()
    
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

        // Quick Actions clicks
        binding.btnActionPets.setOnClickListener {
            findNavController().navigate(R.id.navigation_pets)
        }
        binding.btnActionHealth.setOnClickListener {
            val pets = localStorageManager.getPets()
            if (pets.isNotEmpty()) {
                val intent = Intent(requireContext(), HealthMetricsActivity::class.java).apply {
                    putExtra("EXTRA_PET_ID", pets[0].id)
                    putExtra("EXTRA_PET_DTO", pets[0])
                }
                startActivity(intent)
            } else {
                Toast.makeText(requireContext(), "Add a pet first to view health trends!", Toast.LENGTH_SHORT).show()
                findNavController().navigate(R.id.navigation_pets)
            }
        }
        binding.btnActionBreeds.setOnClickListener {
            findNavController().navigate(R.id.navigation_explore_breeds)
        }
        binding.btnActionReminders.setOnClickListener {
            findNavController().navigate(R.id.navigation_reminders)
        }
        binding.btnActionAppointments.setOnClickListener {
            findNavController().navigate(R.id.navigation_appointments)
        }
        binding.btnActionProfile.setOnClickListener {
            findNavController().navigate(R.id.navigation_profile)
        }

        // Quick Adjustments Settings click
        binding.btnActionSettings.setOnClickListener {
            findNavController().navigate(R.id.navigation_settings)
        }

        // Calendar Date Selected Change Listener
        binding.calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val cal = Calendar.getInstance()
            cal.set(year, month, dayOfMonth)
            val dateKey = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
            loadCalendarAgendaForDate(dateKey)
        }

        // Google-style Search Bar listener
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val query = s.toString().trim()
                if (query.isNotEmpty()) {
                    binding.btnClearSearch.visibility = View.VISIBLE
                    binding.cvSearchSuggestions.visibility = View.VISIBLE
                    populateSuggestionsOverlay(query)
                    filterDashboardByQuery(query)
                } else {
                    binding.btnClearSearch.visibility = View.GONE
                    binding.cvSearchSuggestions.visibility = View.GONE
                    resetDashboardFilters()
                }
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // Clear search text view click
        binding.btnClearSearch.setOnClickListener {
            binding.etSearch.setText("")
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

            // 5. Fetch Appointments
            val appointments = try {
                val api = RetrofitClient.create { token }
                val response = api.getAppointments()
                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!
                    localStorageManager.saveAppointments(list)
                    list
                } else {
                    localStorageManager.getAppointments()
                }
            } catch (e: Exception) {
                localStorageManager.getAppointments()
            }

            withContext(Dispatchers.Main) {
                petsList = pets
                remindersList = reminders
                activitiesList = activities
                appointmentsList = appointments
                
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

                // New lists bindings
                populateDueSoonUI()
                populateAppointmentsUI()
                populateHealthTrendsUI()
                populateQuickAdjustmentsUI()
                populateActiveCalendarDates()

                // Default Calendar Agenda selection (Today)
                val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                loadCalendarAgendaForDate(todayStr)
            }
        }
    }

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

            val nextActivities = localStorageManager.getActivities()
            withContext(Dispatchers.Main) {
                activitiesList = nextActivities
                updateDashboardWidgets()
                populateActivitiesUI()
            }
        }
    }

    private fun updateDashboardWidgets() {
        val streak = calculateActivityStreak()
        binding.tvStreakValue.text = "$streak day${if (streak != 1) "s" else ""}"
        
        if (hasCheckedInToday()) {
            binding.btnStreakCheckin.text = "✅ Done"
            binding.btnStreakCheckin.isEnabled = false
        } else {
            binding.btnStreakCheckin.text = "Check-in"
            binding.btnStreakCheckin.isEnabled = true
        }

        val completedCount = todayChecklist.count { it.done }
        val totalCount = todayChecklist.size
        val score = if (totalCount == 0) 0 else (completedCount * 100 / totalCount)
        
        binding.tvCareScoreValue.text = "$score%"
        binding.pbCareScore.progress = score

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
            if (petsList.isEmpty()) {
                todayChecklist.add(ChecklistItem("default-addpet", "🐾 Add your first pet profile to get started", false))
            } else {
                petsList.forEach { pet ->
                    todayChecklist.add(ChecklistItem("feed-${pet.id}-${System.currentTimeMillis()}", "🥣 Feed ${pet.name}", false))
                    todayChecklist.add(ChecklistItem("play-${pet.id}-${System.currentTimeMillis()}", "🐕 Walk/Play with ${pet.name}", false))
                }
            }

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

    private fun populateChecklistUI(list: List<ChecklistItem> = todayChecklist) {
        binding.checklistContainer.removeAllViews()
        
        val completedCount = todayChecklist.count { it.done }
        val totalCount = todayChecklist.size
        binding.tvChecklistCount.text = "$completedCount/$totalCount done"
        binding.pbChecklist.progress = if (totalCount == 0) 0 else (completedCount * 100 / totalCount)

        if (list.isEmpty()) {
            val emptyText = TextView(requireContext()).apply {
                text = "No matching checklist tasks."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 16, 0, 16)
                textSize = 14f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                typeface = android.graphics.Typeface.defaultFromStyle(android.graphics.Typeface.ITALIC)
            }
            binding.checklistContainer.addView(emptyText)
            return
        }

        list.forEach { item ->
            val rowBinding = ItemChecklistBinding.inflate(layoutInflater, binding.checklistContainer, false)
            
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

            rowBinding.root.setOnClickListener {
                toggleChecklistItem(item)
            }
            rowBinding.tvTaskCheck.setOnClickListener {
                toggleChecklistItem(item)
            }
            rowBinding.tvTaskDelete.setOnClickListener {
                deleteChecklistItem(item)
            }

            binding.checklistContainer.addView(rowBinding.root)
        }
    }

    private fun populateActivitiesUI(list: List<ActivityDto> = activitiesList) {
        binding.activitiesContainer.removeAllViews()

        if (list.isEmpty()) {
            val emptyText = TextView(requireContext()).apply {
                text = "No matching activities"
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 16, 0, 16)
                textSize = 14f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
            }
            binding.activitiesContainer.addView(emptyText)
            return
        }

        list.take(8).forEach { activity ->
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
        val settings = localStorageManager.getSettings()
        binding.tvFactSpecies.text = "🧬 Species: ${settings.defaultFactSpecies.uppercase(Locale.getDefault())}"
        
        val defaultFactText = when (settings.defaultFactSpecies.lowercase(Locale.getDefault())) {
            "dog" -> "Dogs have a sense of time. It's been proven they know the difference between one hour and four! 🐕\n💡 \"Happiness is a warm puppy.\" — Charles M. Schulz"
            "cat" -> "Cats share 95.6% of their genetic makeup with tigers. They also display tiger behaviors such as scent marking! 🐱\n💡 \"Time spent with cats is never wasted.\" — Sigmund Freud"
            "rabbit" -> "Rabbits perform an athletic leap known as a 'binky' when they are extremely happy or excited! 🐰"
            else -> "Pets thrive with predictable daily care routines, especially around feeding, exercise, and sleep. 🐾\n💡 \"The greatness of a nation and its moral progress can be judged by the way its animals are treated.\" — Mahatma Gandhi"
        }
        
        binding.tvFactText.text = defaultFactText
    }

    // Google-style Search suggestions dynamically loaded
    private fun populateSuggestionsOverlay(query: String) {
        binding.suggestionsContainer.removeAllViews()
        val keyword = query.lowercase(Locale.getDefault())

        val suggestions = mutableListOf<SearchSuggestion>()

        // 1. Explore breeds matching suggestion
        if ("dog".contains(keyword) || "cat".contains(keyword) || "rabbit".contains(keyword) || keyword.length > 2) {
            suggestions.add(SearchSuggestion("🔍 Explore breeds details for: \"$query\"", "breeds", R.id.navigation_explore_breeds))
        }

        // 2. Navigation quick match items
        if ("add pet".contains(keyword) || "new pet".contains(keyword)) {
            suggestions.add(SearchSuggestion("🐾 Quick Action: Add New Pet Profile", "add_pet", 0))
        }
        if ("appointment".contains(keyword) || "vet".contains(keyword) || "doctor".contains(keyword)) {
            suggestions.add(SearchSuggestion("📅 Quick Action: Schedule Vet Appointment", "appointments", R.id.navigation_appointments))
        }
        if ("reminder".contains(keyword) || "medication".contains(keyword) || "care".contains(keyword)) {
            suggestions.add(SearchSuggestion("⏰ Quick Action: Create Care Reminder", "reminders", R.id.navigation_reminders))
        }
        if ("profile".contains(keyword) || "account".contains(keyword) || "avatar".contains(keyword)) {
            suggestions.add(SearchSuggestion("👤 Quick Action: Edit Profile & Password", "profile", R.id.navigation_profile))
        }

        if (suggestions.isEmpty()) {
            val emptyTv = TextView(requireContext()).apply {
                text = "No suggestions. Type 'pet', 'reminder', 'vet', or 'profile'..."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(16, 12, 16, 12)
                textSize = 13f
            }
            binding.suggestionsContainer.addView(emptyTv)
            return
        }

        suggestions.forEach { item ->
            val cell = TextView(requireContext()).apply {
                text = item.label
                setTextColor(resources.getColor(R.color.text_primary, null))
                setPadding(16, 14, 16, 14)
                textSize = 14f
                isClickable = true
                focusable = View.FOCUSABLE
                setBackgroundResource(android.R.drawable.list_selector_background)
            }
            cell.setOnClickListener {
                binding.etSearch.setText("") // Clear
                if (item.actionKey == "add_pet") {
                    startActivity(Intent(requireContext(), AddPetActivity::class.java))
                } else if (item.destinationId > 0) {
                    findNavController().navigate(item.destinationId)
                }
            }
            binding.suggestionsContainer.addView(cell)
        }
    }

    private data class SearchSuggestion(
        val label: String,
        val actionKey: String,
        val destinationId: Int
    )

    private fun filterDashboardByQuery(query: String) {
        val keyword = query.lowercase(Locale.getDefault())
        
        // Filter checklist
        val filteredChecklist = todayChecklist.filter {
            it.label.lowercase(Locale.getDefault()).contains(keyword)
        }
        populateChecklistUI(filteredChecklist)

        // Filter activities
        val filteredActivities = activitiesList.filter {
            val matchesPet = it.petName?.lowercase(Locale.getDefault())?.contains(keyword) ?: false
            val matchesDesc = it.description.lowercase(Locale.getDefault()).contains(keyword)
            matchesPet || matchesDesc
        }
        populateActivitiesUI(filteredActivities)
    }

    private fun resetDashboardFilters() {
        populateChecklistUI()
        populateActivitiesUI()
    }

    // Calendar Selected Day agenda logic
    private fun loadCalendarAgendaForDate(dateKey: String) {
        binding.calendarAgendaContainer.removeAllViews()

        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val formattedSelectedDate = try {
            val parsed = sdf.parse(dateKey)
            parsed?.let { SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(it) } ?: dateKey
        } catch (e: Exception) {
            dateKey
        }

        val agendaItems = mutableListOf<AgendaItem>()

        // 1. Check reminders due on selected day
        remindersList.forEach { reminder ->
            if (reminder.dueDate == dateKey) {
                agendaItems.add(
                    AgendaItem(
                        title = reminder.title,
                        subtitle = "Companion: ${reminder.petName}",
                        type = "Reminder",
                        icon = "⏰"
                    )
                )
            }
        }

        // 2. Check appointments scheduled on selected day
        appointmentsList.forEach { appt ->
            if (appt.dateTime.startsWith(dateKey)) {
                agendaItems.add(
                    AgendaItem(
                        title = appt.reason,
                        subtitle = "Companion: ${appt.petName}",
                        type = "Appointment",
                        icon = "🏥"
                    )
                )
            }
        }

        // 3. Check activities completed on selected day
        activitiesList.forEach { act ->
            try {
                val actParsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(act.timestamp)
                val actKey = actParsed?.let { sdf.format(it) }
                if (actKey == dateKey) {
                    agendaItems.add(
                        AgendaItem(
                            title = act.description,
                            subtitle = act.petName ?: "Care Event",
                            type = "Activity",
                            icon = act.icon
                        )
                    )
                }
            } catch (e: Exception) {}
        }

        if (agendaItems.isEmpty()) {
            val emptyTv = TextView(requireContext()).apply {
                text = "No events on $formattedSelectedDate."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 12, 0, 12)
                textSize = 13f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
                typeface = android.graphics.Typeface.defaultFromStyle(android.graphics.Typeface.ITALIC)
            }
            binding.calendarAgendaContainer.addView(emptyTv)
            return
        }

        agendaItems.forEach { item ->
            val row = LayoutInflater.from(requireContext()).inflate(R.layout.item_activity, binding.calendarAgendaContainer, false)
            row.findViewById<TextView>(R.id.tv_activity_icon).text = item.icon
            row.findViewById<TextView>(R.id.tv_activity_pet_name).text = item.title
            row.findViewById<TextView>(R.id.tv_activity_description).text = item.subtitle
            row.findViewById<TextView>(R.id.tv_activity_timestamp).text = item.type
            binding.calendarAgendaContainer.addView(row)
        }
    }

    private data class AgendaItem(
        val title: String,
        val subtitle: String,
        val type: String,
        val icon: String
    )

    private fun populateActiveCalendarDates() {
        binding.cgActiveDates.removeAllViews()
        val uniqueDates = mutableSetOf<String>()
        
        // Reminders
        remindersList.forEach {
            if (!it.completed && !it.dueDate.isNullOrEmpty()) {
                uniqueDates.add(it.dueDate!!)
            }
        }
        
        // Appointments
        appointmentsList.forEach {
            if (it.dateTime.isNotEmpty()) {
                val datePart = it.dateTime.split(" ")[0].split("T")[0]
                if (datePart.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) {
                    uniqueDates.add(datePart)
                }
            }
        }
        
        val sortedDates = uniqueDates.sorted()
        if (sortedDates.isEmpty()) {
            binding.layoutCalendarActiveDates.visibility = View.GONE
            return
        }
        
        binding.layoutCalendarActiveDates.visibility = View.VISIBLE
        val sdfSource = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val sdfDisplay = SimpleDateFormat("MMM d", Locale.getDefault())
        
        sortedDates.forEach { dateStr ->
            try {
                val date = sdfSource.parse(dateStr) ?: return@forEach
                val displayStr = sdfDisplay.format(date)
                
                val chip = com.google.android.material.chip.Chip(requireContext()).apply {
                    text = "🟢 $displayStr"
                    chipBackgroundColor = android.content.res.ColorStateList.valueOf(resources.getColor(R.color.success_bg, null))
                    setTextColor(resources.getColor(R.color.success, null))
                    chipStrokeColor = android.content.res.ColorStateList.valueOf(resources.getColor(R.color.success, null))
                    chipStrokeWidth = 3f
                    isClickable = true
                    
                    setOnClickListener {
                        binding.calendarView.date = date.time
                        loadCalendarAgendaForDate(dateStr)
                    }
                }
                binding.cgActiveDates.addView(chip)
            } catch (e: Exception) {
                // skip
            }
        }
    }

    // Dynamic Lists Population
    private fun populateDueSoonUI() {
        binding.dueSoonContainer.removeAllViews()

        val settings = localStorageManager.getSettings()
        val daysLimit = settings.reminderWindowDays
        val calLimit = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, daysLimit) }
        
        val dueList = remindersList.filter { 
            if (it.completed) return@filter false
            val dueDateStr = it.dueDate ?: return@filter false
            try {
                val dueDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dueDateStr)
                dueDate != null && dueDate.before(calLimit.time) && dueDate.after(Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }.time)
            } catch (e: Exception) {
                false
            }
        }

        if (dueList.isEmpty()) {
            val emptyTv = TextView(requireContext()).apply {
                text = "Nothing urgent right now."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 12, 0, 12)
                textSize = 13f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
            }
            binding.dueSoonContainer.addView(emptyTv)
            return
        }

        dueList.forEach { reminder ->
            val row = LayoutInflater.from(requireContext()).inflate(R.layout.item_reminder, binding.dueSoonContainer, false)
            row.findViewById<TextView>(R.id.tv_reminder_title).text = reminder.title
            row.findViewById<TextView>(R.id.tv_reminder_pet_badge).text = reminder.petName
            row.findViewById<TextView>(R.id.tv_reminder_due_tag).text = reminder.dueDate ?: "No date"
            binding.dueSoonContainer.addView(row)
        }
    }

    private fun populateAppointmentsUI() {
        binding.appointmentsContainer.removeAllViews()

        val upcoming = appointmentsList.filter {
            val dateStr = it.dateTime
            if (dateStr.isEmpty()) true
            else {
                try {
                    // Try parsing start of date
                    val apptDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dateStr)
                    apptDate != null && apptDate.after(Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }.time)
                } catch (e: Exception) {
                    true
                }
            }
        }

        if (upcoming.isEmpty()) {
            val emptyTv = TextView(requireContext()).apply {
                text = "No vet appointments scheduled."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 12, 0, 12)
                textSize = 13f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
            }
            binding.appointmentsContainer.addView(emptyTv)
            return
        }

        upcoming.forEach { appt ->
            val row = LayoutInflater.from(requireContext()).inflate(R.layout.item_appointment, binding.appointmentsContainer, false)
            row.findViewById<TextView>(R.id.tv_appointment_reason).text = appt.reason
            row.findViewById<TextView>(R.id.tv_appointment_pet_badge).text = "Companion: ${appt.petName}"
            row.findViewById<TextView>(R.id.tv_appointment_date).text = "📅 ${appt.dateTime}"
            binding.appointmentsContainer.addView(row)
        }
    }

    private fun populateHealthTrendsUI() {
        binding.healthTrendsContainer.removeAllViews()

        // Filter activities that represent dynamic logged health metrics (weight logs, vaccinations, medications, vet visits)
        val healthLogs = activitiesList.filter {
            it.type == "weight" || it.type == "vaccination" || it.type == "medication" || it.type == "vetVisit" || it.type == "profileUpdate"
        }

        if (healthLogs.isEmpty()) {
            val emptyTv = TextView(requireContext()).apply {
                text = "No health records logged yet."
                setTextColor(resources.getColor(R.color.text_muted, null))
                setPadding(0, 12, 0, 12)
                textSize = 13f
                textAlignment = View.TEXT_ALIGNMENT_CENTER
            }
            binding.healthTrendsContainer.addView(emptyTv)
            return
        }

        healthLogs.take(5).forEach { log ->
            val row = LayoutInflater.from(requireContext()).inflate(R.layout.item_activity, binding.healthTrendsContainer, false)
            row.findViewById<TextView>(R.id.tv_activity_icon).text = log.icon
            row.findViewById<TextView>(R.id.tv_activity_pet_name).text = log.petName ?: "Companion"
            row.findViewById<TextView>(R.id.tv_activity_description).text = log.description
            row.findViewById<TextView>(R.id.tv_activity_timestamp).text = formatActivityTimestamp(log.timestamp)
            binding.healthTrendsContainer.addView(row)
        }
    }

    private fun populateQuickAdjustmentsUI() {
        val settings = localStorageManager.getSettings()
        binding.tvAdjustmentsWindow.text = "Reminder window: ${settings.reminderWindowDays} day(s)"
        binding.tvAdjustmentsSpecies.text = "Fact default species: ${settings.defaultFactSpecies.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }}"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
