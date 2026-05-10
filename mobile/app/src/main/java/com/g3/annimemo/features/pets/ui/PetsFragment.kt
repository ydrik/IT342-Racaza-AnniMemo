package com.g3.annimemo.features.pets.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.g3.annimemo.core.databinding.FragmentPetsBinding

class PetsFragment : Fragment() {
    private var _binding: FragmentPetsBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPetsBinding.inflate(inflater, container, false)
        binding.textPets.text = "Pets Module"
        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
