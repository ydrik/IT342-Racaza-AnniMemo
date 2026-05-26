package com.g3.annimemo.features.breeds.ui

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.g3.annimemo.R
import com.g3.annimemo.core.network.BreedModel
import com.g3.annimemo.core.network.BreedsApiService
import com.g3.annimemo.databinding.FragmentExploreBreedsBinding
import com.g3.annimemo.databinding.ItemBreedBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

class ExploreBreedsFragment : Fragment() {
    private var _binding: FragmentExploreBreedsBinding? = null
    private val binding get() = _binding!!

    private val gson = Gson()
    
    private var activeTab = 0 // 0: Dogs, 1: Cats, 2: Others
    
    private var dogBreedsList = listOf<BreedModel>()
    private var catBreedsList = listOf<BreedModel>()
    private var otherBreedsList = listOf<BreedModel>()
    
    private var currentActiveList = mutableListOf<BreedModel>()
    private var filteredList = mutableListOf<BreedModel>()
    
    private lateinit var breedsAdapter: BreedsAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentExploreBreedsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUI()
        loadTab(0) // Default load Dogs
    }

    private fun setupUI() {
        // Back to Dashboard button
        binding.btnBackToDashboard.setOnClickListener {
            androidx.navigation.fragment.NavHostFragment.findNavController(this).navigate(com.g3.annimemo.R.id.navigation_dashboard)
        }

        // Tab buttons
        binding.btnTabDogs.setOnClickListener { selectTab(0) }
        binding.btnTabCats.setOnClickListener { selectTab(1) }
        binding.btnTabOthers.setOnClickListener { selectTab(2) }

        // Setup search filter box
        binding.etBreedSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                applySearchFilter(s.toString())
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        // Setup RecyclerView
        breedsAdapter = BreedsAdapter(filteredList)
        binding.rvBreeds.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = breedsAdapter
        }
    }

    private fun selectTab(tabIdx: Int) {
        if (activeTab == tabIdx) return
        activeTab = tabIdx

        val normalColor = ContextCompat.getColor(requireContext(), R.color.text_secondary)
        val normalBg = ContextCompat.getColor(requireContext(), R.color.card_bg_surface)

        // Reset all tabs styling
        binding.btnTabDogs.apply {
            background = ContextCompat.getDrawable(context, R.drawable.bg_button_secondary)
            backgroundTintList = android.content.res.ColorStateList.valueOf(normalBg)
            setTextColor(normalColor)
        }
        binding.btnTabCats.apply {
            background = ContextCompat.getDrawable(context, R.drawable.bg_button_secondary)
            backgroundTintList = android.content.res.ColorStateList.valueOf(normalBg)
            setTextColor(normalColor)
        }
        binding.btnTabOthers.apply {
            background = ContextCompat.getDrawable(context, R.drawable.bg_button_secondary)
            backgroundTintList = android.content.res.ColorStateList.valueOf(normalBg)
            setTextColor(normalColor)
        }

        // Apply active styling
        when (tabIdx) {
            0 -> binding.btnTabDogs.apply {
                background = ContextCompat.getDrawable(context, R.drawable.bg_gradient_primary)
                backgroundTintList = null
                setTextColor(ContextCompat.getColor(context, R.color.white))
            }
            1 -> binding.btnTabCats.apply {
                background = ContextCompat.getDrawable(context, R.drawable.bg_gradient_primary)
                backgroundTintList = null
                setTextColor(ContextCompat.getColor(context, R.color.white))
            }
            2 -> binding.btnTabOthers.apply {
                background = ContextCompat.getDrawable(context, R.drawable.bg_gradient_primary)
                backgroundTintList = null
                setTextColor(ContextCompat.getColor(context, R.color.white))
            }
        }

        loadTab(tabIdx)
    }

    private fun loadTab(tabIdx: Int) {
        binding.etBreedSearch.setText("") // Clear previous search
        
        lifecycleScope.launch(Dispatchers.IO) {
            val cachedList = getCachedBreeds(tabIdx)
            if (cachedList.isNotEmpty()) {
                withContext(Dispatchers.Main) {
                    updateActiveList(tabIdx, cachedList)
                }
                return@launch
            }

            // Fetch live from APIs
            withContext(Dispatchers.Main) {
                binding.pbBreedsLoading.visibility = View.VISIBLE
                binding.rvBreeds.visibility = View.GONE
            }

            val api = BreedsApiService.get()
            val freshList = when (tabIdx) {
                0 -> { // Dogs
                    try {
                        val response = api.getDogBreeds()
                        if (response.isSuccessful && response.body() != null) {
                            response.body()!!.map {
                                BreedModel(
                                    name = it.name,
                                    origin = it.origin ?: "Scientific Breed",
                                    lifespan = "⏳ Lifespan: ${it.life_span ?: "N/A"}",
                                    temperament = it.temperament ?: "Loyal, Energetic",
                                    description = "A standard premium dog breed characterized by its distinct origin, temperament, and life span."
                                )
                            }
                        } else emptyList()
                    } catch (e: Exception) { emptyList() }
                }
                1 -> { // Cats
                    try {
                        val response = api.getCatBreeds()
                        if (response.isSuccessful && response.body() != null) {
                            response.body()!!.map {
                                BreedModel(
                                    name = it.name,
                                    origin = it.origin ?: "Egypt / Global",
                                    lifespan = "⏳ Lifespan: ${it.life_span ?: "N/A"} years",
                                    temperament = it.temperament ?: "Friendly, Curious",
                                    description = it.description ?: "Premium cat breed."
                                )
                            }
                        } else emptyList()
                    } catch (e: Exception) { emptyList() }
                }
                else -> { // Others (API Ninjas animals lookup)
                    val commonOthers = listOf("rabbit", "hamster", "goldfish", "parrot", "ferret", "turtle")
                    val list = mutableListOf<BreedModel>()
                    commonOthers.forEach { name ->
                        try {
                            val response = api.getOtherAnimals(name)
                            if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                                val animal = response.body()!![0]
                                val diet = animal.characteristics?.diet ?: "Herbivore"
                                val lifespan = animal.characteristics?.lifespan ?: "N/A"
                                val scientific = animal.taxonomy?.scientific_name ?: "Pending"
                                val temperament = animal.characteristics?.temperament ?: animal.characteristics?.group_behavior ?: "Active"
                                list.add(
                                    BreedModel(
                                        name = animal.name,
                                        origin = "🔬 Scientific: $scientific",
                                        lifespan = "⏳ Lifespan: $lifespan",
                                        temperament = "🥗 Diet: $diet | $temperament",
                                        description = "The ${animal.name} makes a fascinating and unique household companion under suitable environment."
                                    )
                                )
                            }
                        } catch (e: Exception) {}
                    }
                    list
                }
            }

            if (freshList.isNotEmpty()) {
                saveCachedBreeds(tabIdx, freshList)
            }

            withContext(Dispatchers.Main) {
                binding.pbBreedsLoading.visibility = View.GONE
                binding.rvBreeds.visibility = View.VISIBLE
                
                val finalDisplayList = if (freshList.isNotEmpty()) freshList else getOfflineFallbackList(tabIdx)
                updateActiveList(tabIdx, finalDisplayList)
            }
        }
    }

    private fun updateActiveList(tabIdx: Int, list: List<BreedModel>) {
        when (tabIdx) {
            0 -> dogBreedsList = list
            1 -> catBreedsList = list
            2 -> otherBreedsList = list
        }
        currentActiveList.clear()
        currentActiveList.addAll(list)
        
        filteredList.clear()
        filteredList.addAll(list)
        breedsAdapter.notifyDataSetChanged()
    }

    private fun applySearchFilter(query: String) {
        val keyword = query.trim().lowercase(Locale.getDefault())
        filteredList.clear()
        
        if (keyword.isEmpty()) {
            filteredList.addAll(currentActiveList)
        } else {
            filteredList.addAll(currentActiveList.filter {
                it.name.lowercase(Locale.getDefault()).contains(keyword) ||
                it.origin.lowercase(Locale.getDefault()).contains(keyword) ||
                it.temperament.lowercase(Locale.getDefault()).contains(keyword)
            })
        }
        breedsAdapter.notifyDataSetChanged()
    }

    // 1. SharedPreferences local cache layers
    private fun getCachedBreeds(tabIdx: Int): List<BreedModel> {
        val key = when (tabIdx) {
            0 -> "annimemo_explore_breeds_dog"
            1 -> "annimemo_explore_breeds_cat"
            else -> "annimemo_explore_breeds_others"
        }
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_explore_cache", android.content.Context.MODE_PRIVATE)
        val json = sharedPrefs.getString(key, null) ?: return emptyList()
        val type = object : TypeToken<List<BreedModel>>() {}.type
        return try {
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun saveCachedBreeds(tabIdx: Int, list: List<BreedModel>) {
        val key = when (tabIdx) {
            0 -> "annimemo_explore_breeds_dog"
            1 -> "annimemo_explore_breeds_cat"
            else -> "annimemo_explore_breeds_others"
        }
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_explore_cache", android.content.Context.MODE_PRIVATE)
        sharedPrefs.edit().putString(key, gson.toJson(list)).apply()
    }

    private fun getOfflineFallbackList(tabIdx: Int): List<BreedModel> {
        return when (tabIdx) {
            0 -> listOf(
                BreedModel("Golden Retriever", "Scotland", "⏳ Lifespan: 10 - 12 years", "Intelligent, Kind, Trustworthy", "Friendly and reliable companion."),
                BreedModel("German Shepherd", "Germany", "⏳ Lifespan: 9 - 13 years", "Watchful, Alert, Curious", "Highly capable working dog.")
            )
            1 -> listOf(
                BreedModel("Abyssinian", "Egypt", "⏳ Lifespan: 14 - 15 years", "Active, Energetic, Playful", "Short-haired cat breed with ticked coat."),
                BreedModel("Siamese", "Thailand", "⏳ Lifespan: 15 - 20 years", "Active, Social, Vocal", "Affectionate and highly vocal breed.")
            )
            else -> listOf(
                BreedModel("Rabbit", "🔬 Scientific: Leporidae", "⏳ Lifespan: 9 years", "🥗 Diet: Herbivore | Playful", "Athletic, leaping companion.")
            )
        }
    }

    // Inner Adapter class for binding breeds to view
    inner class BreedsAdapter(private val list: List<BreedModel>) : RecyclerView.Adapter<BreedsAdapter.ViewHolder>() {
        
        inner class ViewHolder(private val binding: ItemBreedBinding) : RecyclerView.ViewHolder(binding.root) {
            fun bind(breed: BreedModel) {
                binding.tvBreedName.text = breed.name
                binding.tvBreedOrigin.text = breed.origin
                binding.tvBreedLifespan.text = breed.lifespan
                binding.tvBreedTemperament.text = breed.temperament
                binding.tvBreedDescription.text = breed.description
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val binding = ItemBreedBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.bind(list[position])
        }

        override fun getItemCount(): Int = list.size
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
