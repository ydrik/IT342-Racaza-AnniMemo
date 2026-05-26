package com.g3.annimemo.features.reminders.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.navigation.fragment.findNavController
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.ReminderDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.FragmentRemindersBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class RemindersFragment : Fragment() {
    private var _binding: FragmentRemindersBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager
    private lateinit var remindersAdapter: RemindersAdapter
    
    private var petsList = listOf<PetDto>()
    private var allRemindersList = mutableListOf<ReminderDto>()
    private var filteredRemindersList = mutableListOf<ReminderDto>()
    
    private var isFormExpanded = false
    private val calendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentRemindersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())
        tokenManager = TokenManager(requireContext())

        setupSpinners()
        setupUI()
        loadData()
    }

    private fun setupSpinners() {
        // Filter options
        val filterOptions = listOf("All Reminders", "Due Soon ⏰", "Overdue ⚠️", "Completed ✅")
        val filterAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, filterOptions)
        filterAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerRemindersFilter.adapter = filterAdapter

        // Type options
        val typeOptions = listOf("Medication 💊", "Vaccination 💉", "Vet Visit 🏥", "Grooming ✂️", "Feeding 🥣", "Other 📌")
        val typeAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, typeOptions)
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerReminderType.adapter = typeAdapter
    }

    private fun setupUI() {
        binding.btnBackToDashboard.setOnClickListener {
            findNavController().navigate(R.id.navigation_dashboard)
        }

        // Expand/Collapse Create Reminder form card
        binding.layoutToggleForm.setOnClickListener {
            toggleFormVisibility()
        }

        // Setup DatePicker Dialog
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, dayOfMonth ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
            updateDateLabel()
        }

        binding.btnPickReminderDate.setOnClickListener {
            DatePickerDialog(
                requireContext(),
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
        
        binding.etReminderDueDate.setOnClickListener {
            DatePickerDialog(
                requireContext(),
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        // Save Reminder Button
        binding.btnSaveReminder.setOnClickListener {
            createReminder()
        }

        // Set default date to today
        updateDateLabel()

        // RecyclerView list setup
        remindersAdapter = RemindersAdapter(
            reminders = filteredRemindersList,
            onToggleClick = { reminder ->
                toggleReminderCompleted(reminder)
            },
            onDeleteClick = { reminder ->
                deleteReminder(reminder)
            }
        )

        binding.rvReminders.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = remindersAdapter
        }

        // Filter spinner interaction
        binding.spinnerRemindersFilter.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                applyFilter(position)
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun updateDateLabel() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        binding.etReminderDueDate.setText(sdf.format(calendar.time))
    }

    private fun toggleFormVisibility() {
        isFormExpanded = !isFormExpanded
        if (isFormExpanded) {
            binding.layoutReminderFields.visibility = View.VISIBLE
            binding.tvFormToggleIcon.text = "▲"
            binding.tvFormToggleTitle.text = "➖ Hide Form"
        } else {
            binding.layoutReminderFields.visibility = View.GONE
            binding.tvFormToggleIcon.text = "▼"
            binding.tvFormToggleTitle.text = "➕ Add New Reminder"
        }
    }

    private fun loadData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()

            // Load Pets (needed to fill form spinner)
            val pets = try {
                val api = RetrofitClient.create { token }
                val response = api.getPets()
                if (response.isSuccessful && response.body() != null) {
                    response.body()!!
                } else {
                    localStorageManager.getPets()
                }
            } catch (e: Exception) {
                localStorageManager.getPets()
            }

            // Load Reminders
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

            withContext(Dispatchers.Main) {
                petsList = pets
                
                // Populate Pet Spinner
                if (pets.isEmpty()) {
                    val emptyOptions = listOf("No pets added yet")
                    val petAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, emptyOptions)
                    petAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    binding.spinnerReminderPet.adapter = petAdapter
                } else {
                    val petOptions = pets.map { it.name }
                    val petAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, petOptions)
                    petAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    binding.spinnerReminderPet.adapter = petAdapter
                }

                allRemindersList.clear()
                allRemindersList.addAll(reminders)
                applyFilter(binding.spinnerRemindersFilter.selectedItemPosition)
            }
        }
    }

    private fun applyFilter(position: Int) {
        filteredRemindersList.clear()
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val settings = localStorageManager.getSettings()
        
        val calLimit = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, settings.reminderWindowDays) }
        val limitStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calLimit.time)

        when (position) {
            0 -> filteredRemindersList.addAll(allRemindersList) // All
            1 -> { // Due Soon
                val list = allRemindersList.filter {
                    !it.completed && it.dueDate != null && it.dueDate >= todayStr && it.dueDate <= limitStr
                }
                filteredRemindersList.addAll(list)
            }
            2 -> { // Overdue
                val list = allRemindersList.filter {
                    !it.completed && it.dueDate != null && it.dueDate < todayStr
                }
                filteredRemindersList.addAll(list)
            }
            3 -> filteredRemindersList.addAll(allRemindersList.filter { it.completed }) // Completed
        }

        remindersAdapter.notifyDataSetChanged()
        
        if (filteredRemindersList.isEmpty()) {
            binding.layoutRemindersEmpty.visibility = View.VISIBLE
            binding.rvReminders.visibility = View.GONE
        } else {
            binding.layoutRemindersEmpty.visibility = View.GONE
            binding.rvReminders.visibility = View.VISIBLE
        }
    }

    private fun createReminder() {
        val title = binding.etReminderTitle.text.toString().trim()
        val typeOption = binding.spinnerReminderType.selectedItem.toString()
        val dueDate = binding.etReminderDueDate.text.toString().trim().ifEmpty { null }

        if (petsList.isEmpty()) {
            Toast.makeText(requireContext(), "You must add a pet first!", Toast.LENGTH_SHORT).show()
            return
        }

        if (title.isEmpty()) {
            Toast.makeText(requireContext(), "Reminder title is required", Toast.LENGTH_SHORT).show()
            return
        }

        val petIdx = binding.spinnerReminderPet.selectedItemPosition
        val selectedPet = petsList[petIdx]
        
        val rawType = when (binding.spinnerReminderType.selectedItemPosition) {
            0 -> "medication"
            1 -> "vaccination"
            2 -> "vet_visit"
            3 -> "grooming"
            4 -> "feeding"
            else -> "other"
        }

        val reminderDto = ReminderDto(
            petId = selectedPet.id,
            petName = selectedPet.name,
            title = title,
            type = rawType,
            dueDate = dueDate,
            completed = false
        )

        binding.btnSaveReminder.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            try {
                val api = RetrofitClient.create { token }
                val response = api.createReminder(reminderDto)
                if (response.isSuccessful && response.body() != null) {
                    localStorageManager.addReminder(response.body()!!)
                } else {
                    localStorageManager.addReminder(reminderDto)
                }
            } catch (e: Exception) {
                localStorageManager.addReminder(reminderDto)
            }

            withContext(Dispatchers.Main) {
                binding.btnSaveReminder.isEnabled = true
                Toast.makeText(requireContext(), "Reminder created!", Toast.LENGTH_SHORT).show()
                binding.etReminderTitle.setText("")
                toggleFormVisibility()
                loadData() // Refresh list
            }
        }
    }

    private fun toggleReminderCompleted(reminder: ReminderDto) {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            val nextState = !reminder.completed
            
            try {
                val api = RetrofitClient.create { token }
                api.updateReminderStatus(reminder.id, nextState)
            } catch (e: Exception) {
                // ignore network error
            }

            // Always update local storage
            localStorageManager.toggleReminderStatus(reminder.id, nextState)

            withContext(Dispatchers.Main) {
                loadData() // refresh list
            }
        }
    }

    private fun deleteReminder(reminder: ReminderDto) {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            try {
                val api = RetrofitClient.create { token }
                api.deleteReminder(reminder.id)
            } catch (e: Exception) {
                // ignore network error
            }

            // Always delete locally
            localStorageManager.deleteReminder(reminder.id)

            withContext(Dispatchers.Main) {
                Toast.makeText(requireContext(), "Reminder deleted", Toast.LENGTH_SHORT).show()
                loadData() // refresh list
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
