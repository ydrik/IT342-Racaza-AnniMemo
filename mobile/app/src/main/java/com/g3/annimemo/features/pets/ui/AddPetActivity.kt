package com.g3.annimemo.features.pets.ui

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.ActivityAddPetBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class AddPetActivity : AppCompatActivity() {
    private lateinit var binding: ActivityAddPetBinding
    
    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager
    
    private var isEditMode = false
    private var petId: Long = 0
    private var petDto: PetDto? = null
    
    private val calendar = Calendar.getInstance()

    private val colorList = listOf(
        "Select Color", "Black", "White", "Brown", "Golden", "Yellow", "Cream", "Grey",
        "Orange", "Red", "Blue", "Green", "Silver", "Fawn", "Brindle", "Calico",
        "Tuxedo", "Tortoiseshell", "Multicolor", "Other"
    )

    private val breedOptions = mapOf(
        "Dog" to listOf("Select breed", "Golden Retriever", "Labrador Retriever", "German Shepherd", "Bulldog", "Beagle", "Poodle", "Rottweiler", "Yorkshire Terrier", "Boxer", "Dachshund", "Siberian Husky", "Shih Tzu", "Chihuahua", "Other"),
        "Cat" to listOf("Select breed", "Persian", "Maine Coon", "Siamese", "Ragdoll", "Bengal", "British Shorthair", "Sphynx", "Scottish Fold", "Abyssinian", "American Shorthair", "Other"),
        "Bird" to listOf("Select breed", "Parrot", "Cockatiel", "Parakeet", "Canary", "Finch", "Lovebird", "Macaw", "Budgie", "Other"),
        "Rabbit" to listOf("Select breed", "Holland Lop", "Netherland Dwarf", "Flemish Giant", "Mini Rex", "Lionhead", "Dutch", "Other"),
        "Hamster" to listOf("Select breed", "Syrian", "Dwarf Campbell Russian", "Dwarf Winter White Russian", "Roborovski", "Chinese", "Other"),
        "Fish" to listOf("Select breed", "Goldfish", "Betta", "Guppy", "Angel Fish", "Tetra", "Molly", "Koi", "Other"),
        "Other" to listOf("Select breed", "Mixed Breed", "Unknown", "Other")
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddPetBinding.inflate(layoutInflater)
        setContentView(binding.root)

        localStorageManager = LocalStorageManager(this)
        tokenManager = TokenManager(this)

        // Read intent extras
        petId = intent.getLongExtra("EXTRA_PET_ID", 0)
        petDto = intent.getSerializableExtra("EXTRA_PET_DTO") as? PetDto
        isEditMode = petId > 0

        setupSpinners()
        setupUI()
        
        if (isEditMode && petDto != null) {
            prepopulateForm(petDto!!)
        }
    }

    private fun setupSpinners() {
        // Species spinner
        val speciesList = listOf("Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other")
        val speciesAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, speciesList)
        speciesAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerSpecies.adapter = speciesAdapter

        // Gender spinner
        val genderList = listOf("Male", "Female", "Unknown")
        val genderAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, genderList)
        genderAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerGender.adapter = genderAdapter

        // Color spinner
        val colorAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, colorList)
        colorAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerColor.adapter = colorAdapter

        // Breed spinner dynamics
        binding.spinnerSpecies.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedSpecies = speciesList[position]
                updateBreedSpinner(selectedSpecies)
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun updateBreedSpinner(species: String) {
        val breeds = breedOptions[species] ?: breedOptions["Other"]!!
        val breedAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, breeds)
        breedAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerBreed.adapter = breedAdapter
        
        // If prepopulating mode, select matching breed if edit mode
        petDto?.breed?.let { b ->
            val idx = breeds.indexOf(b)
            if (idx >= 0) {
                binding.spinnerBreed.setSelection(idx)
            }
        }
    }

    private fun setupUI() {
        if (isEditMode) {
            binding.tvFormTitle.text = "Edit Pet Profile"
        }

        binding.btnBackToPets.setOnClickListener {
            finish()
        }

        // Setup DatePicker Dialog
        val dateSetListener = DatePickerDialog.OnDateSetListener { _, year, month, dayOfMonth ->
            calendar.set(Calendar.YEAR, year)
            calendar.set(Calendar.MONTH, month)
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
            updateDateLabel()
        }

        binding.btnPickDate.setOnClickListener {
            DatePickerDialog(
                this,
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
        
        binding.etPetDob.setOnClickListener {
            DatePickerDialog(
                this,
                dateSetListener,
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        // Save Button
        binding.btnSavePet.setOnClickListener {
            savePetProfile()
        }
    }

    private fun updateDateLabel() {
        val myFormat = "yyyy-MM-dd" // format saved to DB
        val sdf = SimpleDateFormat(myFormat, Locale.getDefault())
        binding.etPetDob.setText(sdf.format(calendar.time))
    }

    private fun prepopulateForm(pet: PetDto) {
        binding.etPetName.setText(pet.name)
        binding.etPetWeight.setText(pet.weight?.toString() ?: "")
        binding.etPetNotes.setText(pet.notes ?: "")
        binding.etPetDob.setText(pet.dateOfBirth ?: "")
        
        // Pre-select species
        val speciesList = listOf("Dog", "Cat", "Bird", "Rabbit", "Hamster", "Fish", "Other")
        val speciesIndex = speciesList.indexOf(pet.species)
        if (speciesIndex >= 0) {
            binding.spinnerSpecies.setSelection(speciesIndex)
        }

        // Pre-select gender
        val genderList = listOf("Male", "Female", "Unknown")
        val genderIndex = genderList.indexOf(pet.gender)
        if (genderIndex >= 0) {
            binding.spinnerGender.setSelection(genderIndex)
        }

        // Pre-select color
        val colorIndex = colorList.indexOf(pet.color ?: "")
        if (colorIndex >= 0) {
            binding.spinnerColor.setSelection(colorIndex)
        }

        if (!pet.dateOfBirth.isNullOrEmpty()) {
            try {
                val dob = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(pet.dateOfBirth)
                dob?.let { calendar.time = it }
            } catch (e: Exception) {
                // ignore parsing issues
            }
        }
    }

    private fun savePetProfile() {
        binding.tvFormMessage.visibility = View.GONE
        
        val name = binding.etPetName.text.toString().trim()
        val species = binding.spinnerSpecies.selectedItem.toString()
        val breed = binding.spinnerBreed.selectedItem?.toString()?.takeIf { it != "Select breed" }
        val gender = binding.spinnerGender.selectedItem.toString()
        val dob = binding.etPetDob.text.toString().trim().ifEmpty { null }
        val weightStr = binding.etPetWeight.text.toString().trim()
        val weight = weightStr.toDoubleOrNull()
        val color = binding.spinnerColor.selectedItem?.toString()?.takeIf { it != "Select Color" }
        val notes = binding.etPetNotes.text.toString().trim().ifEmpty { null }

        // Validation
        if (name.isEmpty()) {
            showError("Pet Name is required")
            return
        }

        val requestDto = PetDto(
            id = petId,
            name = name,
            species = species,
            breed = breed,
            gender = gender,
            dateOfBirth = dob,
            weight = weight,
            color = color,
            notes = notes,
            createdAt = petDto?.createdAt
        )

        binding.btnSavePet.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            try {
                val api = RetrofitClient.create { token }
                val response = if (isEditMode) {
                    api.updatePet(petId, requestDto)
                } else {
                    api.createPet(requestDto)
                }
                
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    if (isEditMode) {
                        localStorageManager.updatePet(petId, body)
                    } else {
                        localStorageManager.addPet(body)
                    }
                } else {
                    // Fallback to local
                    if (isEditMode) {
                        localStorageManager.updatePet(petId, requestDto)
                    } else {
                        localStorageManager.addPet(requestDto)
                    }
                }
            } catch (e: Exception) {
                // Fallback to local
                if (isEditMode) {
                    localStorageManager.updatePet(petId, requestDto)
                } else {
                    localStorageManager.addPet(requestDto)
                }
            }

            withContext(Dispatchers.Main) {
                binding.btnSavePet.isEnabled = true
                val message = if (isEditMode) "Profile updated successfully!" else "Companion added successfully!"
                Toast.makeText(this@AddPetActivity, message, Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }

    private fun showError(message: String) {
        binding.tvFormMessage.visibility = View.VISIBLE
        binding.tvFormMessage.text = message
    }
}
