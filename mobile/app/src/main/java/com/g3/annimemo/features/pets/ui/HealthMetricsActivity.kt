package com.g3.annimemo.features.pets.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.ActivityDto
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.databinding.ActivityHealthMetricsBinding
import com.g3.annimemo.databinding.ItemActivityBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class HealthMetricsActivity : AppCompatActivity() {
    private lateinit var binding: ActivityHealthMetricsBinding
    
    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager
    
    private var petId: Long = 0
    private lateinit var petDto: PetDto
    
    private var allPetActivities = mutableListOf<ActivityDto>()
    private var filteredActivities = mutableListOf<ActivityDto>()
    
    private lateinit var metricsAdapter: MetricsAdapter
    private val calendar = Calendar.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityHealthMetricsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        localStorageManager = LocalStorageManager(this)
        tokenManager = TokenManager(this)

        petId = intent.getLongExtra("EXTRA_PET_ID", 0)
        petDto = intent.getSerializableExtra("EXTRA_PET_DTO") as PetDto

        setupSpinners()
        setupUI()
        loadHealthData()
    }

    private fun setupSpinners() {
        // Filter spinner
        val filterOptions = listOf("All Metrics", "Weights 📊", "Medications 💊", "Vaccinations 💉", "Vet Visits 🏥")
        val filterAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, filterOptions)
        filterAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerMetricFilter.adapter = filterAdapter

        // Form metric type spinner
        val typeOptions = listOf("Weight", "Medication", "Vaccination", "Vet Visit")
        val typeAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, typeOptions)
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerMetricType.adapter = typeAdapter
    }

    private fun setupUI() {
        binding.tvHealthTitle.text = "${petDto.name}'s Health Trends"
        
        binding.btnBackToPets.setOnClickListener {
            finish()
        }

        // Setup Date picker for metric form
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, dayOfMonth ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
            updateDateLabel()
        }

        binding.btnPickMetricDate.setOnClickListener {
            DatePickerDialog(
                this,
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        binding.etMetricDate.setOnClickListener {
            DatePickerDialog(
                this,
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        // Form input hint changes on type selected
        binding.spinnerMetricType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                when (position) {
                    0 -> { // Weight
                        binding.etMetricValue.hint = "Weight (e.g. 12.5)"
                        binding.etMetricValue.inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
                        binding.etMetricExtra.visibility = View.GONE
                    }
                    1 -> { // Medication
                        binding.etMetricValue.hint = "Medication Name (e.g. Amoxicillin)"
                        binding.etMetricValue.inputType = android.text.InputType.TYPE_CLASS_TEXT
                        binding.etMetricExtra.visibility = View.VISIBLE
                        binding.etMetricExtra.hint = "Dosage details (e.g. 5ml daily)"
                    }
                    2 -> { // Vaccination
                        binding.etMetricValue.hint = "Vaccine Name (e.g. Rabies, DHPP)"
                        binding.etMetricValue.inputType = android.text.InputType.TYPE_CLASS_TEXT
                        binding.etMetricExtra.visibility = View.GONE
                    }
                    3 -> { // Vet Visit
                        binding.etMetricValue.hint = "Reason for Visit (e.g. Annual Checkup)"
                        binding.etMetricValue.inputType = android.text.InputType.TYPE_CLASS_TEXT
                        binding.etMetricExtra.visibility = View.VISIBLE
                        binding.etMetricExtra.hint = "Vet/Clinic Name"
                    }
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        // RecyclerView list setup
        metricsAdapter = MetricsAdapter(filteredActivities)
        binding.rvMetrics.apply {
            layoutManager = LinearLayoutManager(this@HealthMetricsActivity)
            adapter = metricsAdapter
        }

        // Filter spinner interaction
        binding.spinnerMetricFilter.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                applyFilter(position)
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        // Save Metric Form Button
        binding.btnSaveMetric.setOnClickListener {
            saveHealthMetric()
        }

        // Default date is today
        updateDateLabel()
    }

    private fun updateDateLabel() {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        binding.etMetricDate.setText(sdf.format(calendar.time))
    }

    private fun loadHealthData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val allLogs = localStorageManager.getActivities()
            
            // Filter logs belonging to this pet
            val filtered = allLogs.filter { it.petName == petDto.name }.toMutableList()
            
            withContext(Dispatchers.Main) {
                allPetActivities.clear()
                allPetActivities.addAll(filtered)
                applyFilter(binding.spinnerMetricFilter.selectedItemPosition)
            }
        }
    }

    private fun applyFilter(position: Int) {
        filteredActivities.clear()
        when (position) {
            0 -> filteredActivities.addAll(allPetActivities) // All
            1 -> filteredActivities.addAll(allPetActivities.filter { it.type == "weight" })
            2 -> filteredActivities.addAll(allPetActivities.filter { it.type == "medication" })
            3 -> filteredActivities.addAll(allPetActivities.filter { it.type == "vaccination" })
            4 -> filteredActivities.addAll(allPetActivities.filter { it.type == "vetvisit" || it.type == "vetVisit" })
        }
        metricsAdapter.notifyDataSetChanged()
    }

    private fun saveHealthMetric() {
        val typeIdx = binding.spinnerMetricType.selectedItemPosition
        val valueText = binding.etMetricValue.text.toString().trim()
        val extraText = binding.etMetricExtra.text.toString().trim()
        val dateText = binding.etMetricDate.text.toString().trim()

        if (valueText.isEmpty()) {
            Toast.makeText(this, "Please enter a value/name", Toast.LENGTH_SHORT).show()
            return
        }

        val type = when (typeIdx) {
            0 -> "weight"
            1 -> "medication"
            2 -> "vaccination"
            else -> "vetvisit"
        }

        val icon = when (typeIdx) {
            0 -> "📊"
            1 -> "💊"
            2 -> "💉"
            else -> "🏥"
        }

        val description = when (typeIdx) {
            0 -> "Weight recorded: $valueText kg"
            1 -> if (extraText.isNotEmpty()) "$valueText ($extraText)" else valueText
            2 -> valueText
            else -> if (extraText.isNotEmpty()) "Vet visit: $valueText at $extraText" else "Vet visit: $valueText"
        }

        val timestamp = try {
            val parsedDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dateText)
            parsedDate?.let {
                val cal = Calendar.getInstance().apply { time = it }
                // Append current time to date for sorting correctness
                val now = Calendar.getInstance()
                cal.set(Calendar.HOUR_OF_DAY, now.get(Calendar.HOUR_OF_DAY))
                cal.set(Calendar.MINUTE, now.get(Calendar.MINUTE))
                cal.set(Calendar.SECOND, now.get(Calendar.SECOND))
                SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(cal.time)
            } ?: SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date())
        } catch (e: Exception) {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date())
        }

        val activity = ActivityDto(
            id = "activity-${System.currentTimeMillis()}",
            type = type,
            description = description,
            timestamp = timestamp,
            icon = icon,
            petName = petDto.name
        )

        lifecycleScope.launch(Dispatchers.IO) {
            localStorageManager.logActivity(activity)
            
            withContext(Dispatchers.Main) {
                Toast.makeText(this@HealthMetricsActivity, "Health log added!", Toast.LENGTH_SHORT).show()
                binding.etMetricValue.setText("")
                binding.etMetricExtra.setText("")
                loadHealthData() // refresh
            }
        }
    }

    // Inner Adapter class for binding logs to view
    inner class MetricsAdapter(private val logs: List<ActivityDto>) : RecyclerView.Adapter<MetricsAdapter.ViewHolder>() {
        
        inner class ViewHolder(private val binding: ItemActivityBinding) : RecyclerView.ViewHolder(binding.root) {
            fun bind(activity: ActivityDto) {
                binding.tvActivityIcon.text = activity.icon
                binding.tvActivityPetName.text = activity.type.uppercase(Locale.getDefault())
                binding.tvActivityDescription.text = activity.description
                binding.tvActivityTimestamp.text = formatActivityTimestamp(activity.timestamp)
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemActivityBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(logs[position])
        }

        override fun getItemCount(): Int = logs.size

        private fun formatActivityTimestamp(value: String): String {
            return try {
                val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).parse(value) ?: return "Recently"
                SimpleDateFormat("MMM d, yyyy • h:mm a", Locale.getDefault()).format(date)
            } catch (e: Exception) {
                "Recently"
            }
        }
    }
}
