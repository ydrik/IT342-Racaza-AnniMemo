package com.g3.annimemo.features.appointments.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.AppointmentDto
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.FragmentAppointmentsBinding
import com.g3.annimemo.databinding.ItemAppointmentBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class AppointmentsFragment : Fragment() {
    private var _binding: FragmentAppointmentsBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager
    
    private var petsList = listOf<PetDto>()
    private var appointmentsList = mutableListOf<AppointmentDto>()
    
    private lateinit var appointmentsAdapter: AppointmentsAdapter
    private val calendar = Calendar.getInstance()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAppointmentsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())
        tokenManager = TokenManager(requireContext())

        setupUI()
        loadData()
    }

    private fun setupUI() {
        // Back to Dashboard button
        binding.btnBackToDashboard.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this).navigate(com.g3.annimemo.R.id.navigation_dashboard)
        }
        // Setup Date Picker
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, dayOfMonth ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
            updateDateLabel()
        }

        binding.btnPickAppointmentDate.setOnClickListener {
            DatePickerDialog(
                requireContext(),
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
        
        binding.etAppointmentDate.setOnClickListener {
            DatePickerDialog(
                requireContext(),
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        // Save Appointment Button
        binding.btnSaveAppointment.setOnClickListener {
            scheduleAppointment()
        }

        // Set default date to today
        updateDateLabel()

        // RecyclerView list setup
        appointmentsAdapter = AppointmentsAdapter(appointmentsList) { app ->
            deleteAppointment(app)
        }

        binding.rvAppointments.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = appointmentsAdapter
        }
    }

    private fun updateDateLabel() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        binding.etAppointmentDate.setText(sdf.format(calendar.time))
    }

    private fun loadData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()

            // Fetch pets to fill autocomplete adapter
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

            // Fetch appointments
            val apps = try {
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
                
                // Populate AutoCompleteTextView with pet names (Google-style autocomplete suggestions)
                val petNames = pets.map { it.name }
                val autoAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, petNames)
                binding.actvAppointmentPet.setAdapter(autoAdapter)
                
                appointmentsList.clear()
                appointmentsList.addAll(apps)
                appointmentsAdapter.notifyDataSetChanged()
                
                updateEmptyState()
            }
        }
    }

    private fun updateEmptyState() {
        if (appointmentsList.isEmpty()) {
            binding.layoutAppointmentsEmpty.visibility = View.VISIBLE
            binding.rvAppointments.visibility = View.GONE
        } else {
            binding.layoutAppointmentsEmpty.visibility = View.GONE
            binding.rvAppointments.visibility = View.VISIBLE
        }
    }

    private fun scheduleAppointment() {
        val petNameInput = binding.actvAppointmentPet.text.toString().trim()
        val reason = binding.etAppointmentReason.text.toString().trim()
        val dateTime = binding.etAppointmentDate.text.toString().trim()

        if (petsList.isEmpty()) {
            Toast.makeText(requireContext(), "You must add a pet profile first!", Toast.LENGTH_SHORT).show()
            return
        }

        if (petNameInput.isEmpty() || reason.isEmpty()) {
            Toast.makeText(requireContext(), "Pet Name and Reason are required", Toast.LENGTH_SHORT).show()
            return
        }

        // Validate if selected pet belongs to user's profiles
        val targetPet = petsList.find { it.name.lowercase(Locale.getDefault()) == petNameInput.lowercase(Locale.getDefault()) }
        if (targetPet == null) {
            Toast.makeText(requireContext(), "Pet '$petNameInput' is not found. Select a profile from suggestions.", Toast.LENGTH_LONG).show()
            return
        }

        val appDto = AppointmentDto(
            petId = targetPet.id,
            petName = targetPet.name,
            dateTime = dateTime,
            reason = reason
        )

        binding.btnSaveAppointment.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            try {
                val api = RetrofitClient.create { token }
                val response = api.createAppointment(appDto)
                if (response.isSuccessful && response.body() != null) {
                    localStorageManager.addAppointment(response.body()!!)
                } else {
                    localStorageManager.addAppointment(appDto)
                }
            } catch (e: Exception) {
                localStorageManager.addAppointment(appDto)
            }

            withContext(Dispatchers.Main) {
                binding.btnSaveAppointment.isEnabled = true
                Toast.makeText(requireContext(), "Clinic appointment scheduled!", Toast.LENGTH_SHORT).show()
                binding.actvAppointmentPet.setText("")
                binding.etAppointmentReason.setText("")
                loadData() // Refresh list
            }
        }
    }

    private fun deleteAppointment(app: AppointmentDto) {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            try {
                val api = RetrofitClient.create { token }
                api.deleteAppointment(app.id)
            } catch (e: Exception) {
                // ignore network error
            }

            // Always delete locally
            localStorageManager.deleteAppointment(app.id)

            withContext(Dispatchers.Main) {
                Toast.makeText(requireContext(), "Appointment deleted", Toast.LENGTH_SHORT).show()
                loadData() // refresh list
            }
        }
    }

    // Inner Adapter class for binding appointments to view
    inner class AppointmentsAdapter(
        private val list: List<AppointmentDto>,
        private val onDeleteClick: (AppointmentDto) -> Unit
    ) : RecyclerView.Adapter<AppointmentsAdapter.ViewHolder>() {
        
        inner class ViewHolder(private val binding: ItemAppointmentBinding) : RecyclerView.ViewHolder(binding.root) {
            fun bind(app: AppointmentDto) {
                binding.tvAppointmentReason.text = app.reason
                binding.tvAppointmentPetBadge.text = "🐾 ${app.petName ?: "Pet"}"
                binding.tvAppointmentDate.text = formatAppointmentDate(app.dateTime)
                binding.btnDeleteAppointment.setOnClickListener { onDeleteClick(app) }
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemAppointmentBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(list[position])
        }

        override fun getItemCount(): Int = list.size

        private fun formatAppointmentDate(value: String): String {
            return try {
                val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(value) ?: return value
                SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(date)
            } catch (e: Exception) {
                value
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
