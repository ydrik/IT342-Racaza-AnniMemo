package com.g3.annimemo.features.pets.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.g3.annimemo.core.network.PetDto
import com.g3.annimemo.databinding.ItemPetBinding
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class PetsAdapter(
    private var pets: List<PetDto>,
    private val onEditClick: (PetDto) -> Unit,
    private val onHealthClick: (PetDto) -> Unit,
    private val onDeleteClick: (PetDto) -> Unit
) : RecyclerView.Adapter<PetsAdapter.PetViewHolder>() {

    inner class PetViewHolder(private val binding: ItemPetBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(pet: PetDto) {
            binding.tvPetName.text = pet.name
            binding.tvPetBreed.text = pet.breed ?: pet.species
            binding.tvPetGender.text = pet.gender ?: "Unknown"
            binding.tvPetAge.text = calculateAge(pet.dateOfBirth)
            binding.tvPetWeight.text = if (pet.weight != null) "${pet.weight} kg" else "N/A"
            binding.tvPetEmoji.text = getSpeciesEmoji(pet.species)

            binding.btnEditPet.setOnClickListener { onEditClick(pet) }
            binding.btnHealthPet.setOnClickListener { onHealthClick(pet) }
            binding.btnDeletePet.setOnClickListener { onDeleteClick(pet) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PetViewHolder {
        val binding = ItemPetBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PetViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PetViewHolder, position: Int) {
        holder.bind(pets[position])
    }

    override fun getItemCount(): Int = pets.size

    fun updateList(newPets: List<PetDto>) {
        pets = newPets
        notifyDataSetChanged()
    }

    private fun getSpeciesEmoji(species: String?): String {
        return when (species?.lowercase(Locale.getDefault())) {
            "dog" -> "🐕"
            "cat" -> "🐱"
            "bird" -> "🦜"
            "rabbit" -> "🐰"
            "fish" -> "🐟"
            else -> "🐾"
        }
    }

    private fun calculateAge(dobStr: String?): String {
        if (dobStr.isNullOrEmpty()) return "Unknown"
        return try {
            val birthDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(dobStr) ?: return "Unknown"
            val today = Calendar.getInstance()
            val birth = Calendar.getInstance().apply { time = birthDate }
            
            var age = today.get(Calendar.YEAR) - birth.get(Calendar.YEAR)
            if (today.get(Calendar.DAY_OF_YEAR) < birth.get(Calendar.DAY_OF_YEAR)) {
                age--
            }
            if (age > 0) "$age year${if (age != 1) "s" else ""}" else "Less than 1 year"
        } catch (e: Exception) {
            "Unknown"
        }
    }
}
