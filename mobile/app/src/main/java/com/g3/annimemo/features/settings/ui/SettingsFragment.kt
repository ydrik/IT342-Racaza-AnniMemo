package com.g3.annimemo.features.settings.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.SeekBar
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.SettingsDto
import com.g3.annimemo.databinding.FragmentSettingsBinding
import java.util.Locale

class SettingsFragment : Fragment() {
    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())

        setupSpinners()
        setupUI()
        loadSettings()
    }

    private fun setupSpinners() {
        val factOptions = listOf("Any Species 🐾", "Dog 🐕", "Cat 🐱", "Rabbit 🐰")
        val factAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, factOptions)
        factAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerSettingsFact.adapter = factAdapter
    }

    private fun setupUI() {
        // SeekBar days changed listener
        binding.sbReminderDays.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                // Ensure at least 1 day
                val actualProgress = if (progress == 0) 1 else progress
                binding.tvSettingsDaysLabel.text = "Reminder Window: $actualProgress day${if (actualProgress != 1) "s" else ""}"
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        })

        // Save Button
        binding.btnSaveSettings.setOnClickListener {
            saveSettings()
        }
    }

    private fun loadSettings() {
        val settings = localStorageManager.getSettings()

        // Reminder days progress
        binding.sbReminderDays.progress = settings.reminderWindowDays
        binding.tvSettingsDaysLabel.text = "Reminder Window: ${settings.reminderWindowDays} day${if (settings.reminderWindowDays != 1) "s" else ""}"

        // Fact species selection
        val factOptions = listOf("any", "dog", "cat", "rabbit")
        val speciesIndex = factOptions.indexOf(settings.defaultFactSpecies.lowercase(Locale.getDefault()))
        if (speciesIndex >= 0) {
            binding.spinnerSettingsFact.setSelection(speciesIndex)
        }

        // Compact Mode
        binding.swCompact.isChecked = settings.compactDashboard
    }

    private fun saveSettings() {
        val daysProgress = binding.sbReminderDays.progress
        val reminderWindowDays = if (daysProgress == 0) 1 else daysProgress
        
        val factOptions = listOf("any", "dog", "cat", "rabbit")
        val selectedIndex = binding.spinnerSettingsFact.selectedItemPosition
        val defaultFactSpecies = factOptions.getOrElse(selectedIndex) { "any" }
        
        val compactDashboard = binding.swCompact.isChecked

        val nextSettings = SettingsDto(
            reminderWindowDays = reminderWindowDays,
            defaultFactSpecies = defaultFactSpecies,
            compactDashboard = compactDashboard
        )

        localStorageManager.saveSettings(nextSettings)
        Toast.makeText(requireContext(), "Preferences saved successfully! ⚙️", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
