package com.g3.annimemo.features.pets.ui

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.databinding.FragmentPetsBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PetsFragment : Fragment() {
    private var _binding: FragmentPetsBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager
    private lateinit var petsAdapter: PetsAdapter
    
    private var petsList = mutableListOf<PetDto>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPetsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())
        tokenManager = TokenManager(requireContext())

        setupUI()
        loadPetsData()
    }

    private fun setupUI() {
        // Setup RecyclerView
        petsAdapter = PetsAdapter(
            pets = petsList,
            onEditClick = { pet ->
                openAddEditPetActivity(pet)
            },
            onHealthClick = { pet ->
                openHealthMetricsActivity(pet)
            },
            onDeleteClick = { pet ->
                confirmDeletePet(pet)
            }
        )
        
        binding.rvPets.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = petsAdapter
        }

        // SetupFAB to add pet
        binding.fabAddPet.setOnClickListener {
            openAddEditPetActivity(null)
        }

        binding.btnPetsAddFirst.setOnClickListener {
            openAddEditPetActivity(null)
        }
    }

    private fun loadPetsData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
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

            withContext(Dispatchers.Main) {
                petsList.clear()
                petsList.addAll(pets)
                petsAdapter.updateList(petsList)
                updateEmptyState()
            }
        }
    }

    private fun updateEmptyState() {
        if (petsList.isEmpty()) {
            binding.layoutPetsEmpty.visibility = View.VISIBLE
            binding.rvPets.visibility = View.GONE
        } else {
            binding.layoutPetsEmpty.visibility = View.GONE
            binding.rvPets.visibility = View.VISIBLE
        }
    }

    private fun confirmDeletePet(pet: PetDto) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Pet Profile")
            .setMessage("Are you sure you want to delete ${pet.name}'s profile? This will also remove related reminders and appointments.")
            .setPositiveButton("Delete") { _, _ ->
                deletePetProfile(pet)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun deletePetProfile(pet: PetDto) {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            val success = try {
                val api = RetrofitClient.create { token }
                val response = api.deletePet(pet.id)
                response.isSuccessful
            } catch (e: Exception) {
                false
            }

            // Always perform local database deletion fallback
            localStorageManager.deletePet(pet.id)

            withContext(Dispatchers.Main) {
                Toast.makeText(requireContext(), "${pet.name}'s profile has been deleted!", Toast.LENGTH_SHORT).show()
                loadPetsData()
            }
        }
    }

    private fun openAddEditPetActivity(pet: PetDto?) {
        // Since we are going to create AddPetActivity, we will navigate to it
        val intent = Intent(requireContext(), AddPetActivity::class.java)
        pet?.let {
            intent.putExtra("EXTRA_PET_ID", it.id)
            intent.putExtra("EXTRA_PET_DTO", it)
        }
        startActivity(intent)
    }

    private fun openHealthMetricsActivity(pet: PetDto) {
        val intent = Intent(requireContext(), HealthMetricsActivity::class.java)
        intent.putExtra("EXTRA_PET_ID", pet.id)
        intent.putExtra("EXTRA_PET_DTO", pet)
        startActivity(intent)
    }

    override fun onResume() {
        super.onResume()
        loadPetsData() // Refresh on resume
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
