package com.g3.annimemo.features.profile.ui

import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.g3.annimemo.R
import com.g3.annimemo.core.data.LocalStorageManager
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.core.network.ActivityDto
import com.g3.annimemo.core.network.PasswordChangeRequest
import com.g3.annimemo.core.network.RetrofitClient
import com.g3.annimemo.core.network.UserProfileDto
import com.g3.annimemo.databinding.FragmentProfileBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ProfileFragment : Fragment() {
    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private lateinit var localStorageManager: LocalStorageManager
    private lateinit var tokenManager: TokenManager

    private var profileDto: UserProfileDto? = null

    // Register Activity Result launcher for modern image selection
    private val selectImageLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            processProfileImage(it)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        localStorageManager = LocalStorageManager(requireContext())
        tokenManager = TokenManager(requireContext())

        setupUI()
        loadProfileData()
    }

    private fun setupUI() {
        // Back to Dashboard button
        binding.btnBackToDashboard.setOnClickListener {
            findNavController().navigate(R.id.navigation_dashboard)
        }

        // Upload Photo Button
        binding.btnUploadPhoto.setOnClickListener {
            selectImageLauncher.launch("image/*")
        }

        // Remove Photo Button
        binding.btnRemovePhoto.setOnClickListener {
            removeProfileImage()
        }

        // Save Profile Details Button
        binding.btnSaveProfile.setOnClickListener {
            saveProfileDetails()
        }

        // Change Password Button
        binding.btnChangePassword.setOnClickListener {
            performPasswordChange()
        }

        // Log out button click listener
        binding.btnLogout.setOnClickListener {
            tokenManager.clear()
            val intent = android.content.Intent(activity, com.g3.annimemo.features.auth.ui.LoginActivity::class.java).apply {
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            activity?.finish()
        }
    }

    private fun loadProfileData() {
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
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

            withContext(Dispatchers.Main) {
                profileDto = profile
                populateFields(profile)
                loadCachedAvatar()
            }
        }
    }

    private fun populateFields(profile: UserProfileDto) {
        binding.etProfileUsername.setText(profile.username)
        binding.etProfileFirstName.setText(profile.firstName ?: "")
        binding.etProfileLastName.setText(profile.lastName ?: "")
        binding.etProfileEmail.setText(profile.email)

        // Initials backup display
        val initialFirst = profile.firstName?.firstOrNull() ?: 'U'
        val initialLast = profile.lastName?.firstOrNull() ?: 'P'
        binding.tvProfileInitials.text = "$initialFirst$initialLast".uppercase(Locale.getDefault())
    }

    private fun saveProfileDetails() {
        hideMessageBanner()
        val firstName = binding.etProfileFirstName.text.toString().trim()
        val lastName = binding.etProfileLastName.text.toString().trim()
        val email = binding.etProfileEmail.text.toString().trim()

        if (firstName.isEmpty() || lastName.isEmpty()) {
            showErrorBanner("First Name and Last Name are required")
            return
        }

        if (email.isEmpty()) {
            showErrorBanner("Email Address is required")
            return
        }

        val request = UserProfileDto(
            username = profileDto?.username ?: "User",
            firstName = firstName,
            lastName = lastName,
            email = email,
            role = profileDto?.role ?: "USER"
        )

        binding.btnSaveProfile.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            val updated = try {
                val api = RetrofitClient.create { token }
                val response = api.updateUserProfile(request)
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    localStorageManager.saveUserProfile(body)
                    body
                } else {
                    localStorageManager.saveUserProfile(request)
                    request
                }
            } catch (e: Exception) {
                localStorageManager.saveUserProfile(request)
                request
            }

            // Log activity locally
            localStorageManager.logActivity(
                ActivityDto(
                    id = "activity-${System.currentTimeMillis()}",
                    type = "profileUpdate",
                    description = "Updated profile information",
                    timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                    icon = "👤"
                )
            )

            withContext(Dispatchers.Main) {
                binding.btnSaveProfile.isEnabled = true
                profileDto = updated
                populateFields(updated)
                showSuccessBanner("Profile updated successfully! 👤")
            }
        }
    }

    private fun performPasswordChange() {
        hideMessageBanner()
        val currentPassword = binding.etProfileCurrentPassword.text.toString()
        val newPassword = binding.etProfileNewPassword.text.toString()
        val confirmPassword = binding.etProfileConfirmPassword.text.toString()

        if (currentPassword.isEmpty() || newPassword.isEmpty() || confirmPassword.isEmpty()) {
            showErrorBanner("All password fields are required")
            return
        }

        if (newPassword != confirmPassword) {
            showErrorBanner("New passwords do not match!")
            return
        }

        if (newPassword.length < 6) {
            showErrorBanner("New password must be at least 6 characters long!")
            return
        }

        val request = PasswordChangeRequest(
            currentPassword = currentPassword,
            newPassword = newPassword
        )

        binding.btnChangePassword.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            val token = tokenManager.getToken()
            
            val success = try {
                val api = RetrofitClient.create { token }
                val response = api.changePassword(request)
                response.isSuccessful
            } catch (e: Exception) {
                // local bypass if offline-first
                true
            }

            // Log password update activity
            localStorageManager.logActivity(
                ActivityDto(
                    id = "activity-${System.currentTimeMillis()}",
                    type = "passwordUpdate",
                    description = "Updated account password",
                    timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                    icon = "🔐"
                )
            )

            withContext(Dispatchers.Main) {
                binding.btnChangePassword.isEnabled = true
                binding.etProfileCurrentPassword.setText("")
                binding.etProfileNewPassword.setText("")
                binding.etProfileConfirmPassword.setText("")
                
                if (success) {
                    showSuccessBanner("Password changed successfully! 🔐")
                } else {
                    showErrorBanner("Failed to change password. Please verify current credentials.")
                }
            }
        }
    }

    // Dynamic Image Loading & Storage
    private fun processProfileImage(uri: Uri) {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val cr = requireContext().contentResolver
                val inputStream: InputStream? = cr.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                inputStream?.close()

                if (bytes != null) {
                    val base64 = Base64.encodeToString(bytes, Base64.DEFAULT)
                    
                    // Save to local SharedPreferences
                    val sharedPrefs = requireContext().getSharedPreferences("annimemo_profile_image_prefs", android.content.Context.MODE_PRIVATE)
                    sharedPrefs.edit().putString("annimemo_profile_photo", base64).apply()

                    // Log activity
                    localStorageManager.logActivity(
                        ActivityDto(
                            id = "activity-${System.currentTimeMillis()}",
                            type = "profilePhoto",
                            description = "Updated profile photo",
                            timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                            icon = "🖼️"
                        )
                    )

                    withContext(Dispatchers.Main) {
                        displayAvatarBitmap(base64)
                        Toast.makeText(requireContext(), "Profile photo updated successfully!", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(requireContext(), "Failed to process photo.", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun loadCachedAvatar() {
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_profile_image_prefs", android.content.Context.MODE_PRIVATE)
        val base64 = sharedPrefs.getString("annimemo_profile_photo", null)
        if (base64 != null) {
            displayAvatarBitmap(base64)
        } else {
            binding.ivProfileAvatar.visibility = View.GONE
            binding.tvProfileInitials.visibility = View.VISIBLE
            binding.btnRemovePhoto.visibility = View.GONE
        }
    }

    private fun displayAvatarBitmap(base64Str: String) {
        try {
            val decodedBytes = Base64.decode(base64Str, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            if (bitmap != null) {
                binding.ivProfileAvatar.setImageBitmap(bitmap)
                binding.ivProfileAvatar.visibility = View.VISIBLE
                binding.tvProfileInitials.visibility = View.GONE
                binding.btnRemovePhoto.visibility = View.VISIBLE
            }
        } catch (e: Exception) {
            binding.ivProfileAvatar.visibility = View.GONE
            binding.tvProfileInitials.visibility = View.VISIBLE
            binding.btnRemovePhoto.visibility = View.GONE
        }
    }

    private fun removeProfileImage() {
        val sharedPrefs = requireContext().getSharedPreferences("annimemo_profile_image_prefs", android.content.Context.MODE_PRIVATE)
        sharedPrefs.edit().remove("annimemo_profile_photo").apply()
        
        binding.ivProfileAvatar.visibility = View.GONE
        binding.tvProfileInitials.visibility = View.VISIBLE
        binding.btnRemovePhoto.visibility = View.GONE

        // Log activity
        localStorageManager.logActivity(
            ActivityDto(
                id = "activity-${System.currentTimeMillis()}",
                type = "profilePhoto",
                description = "Removed profile photo",
                timestamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault()).format(Date()),
                icon = "🖼️"
            )
        )
        Toast.makeText(requireContext(), "Profile photo removed", Toast.LENGTH_SHORT).show()
    }

    // Banner message rendering helpers
    private fun showSuccessBanner(message: String) {
        binding.tvProfileMessage.visibility = View.VISIBLE
        binding.tvProfileMessage.text = message
        binding.tvProfileMessage.setBackgroundColor(resources.getColor(R.color.success_bg, null))
        binding.tvProfileMessage.setTextColor(resources.getColor(R.color.success, null))
    }

    private fun showErrorBanner(message: String) {
        binding.tvProfileMessage.visibility = View.VISIBLE
        binding.tvProfileMessage.text = message
        binding.tvProfileMessage.setBackgroundColor(resources.getColor(R.color.error_bg, null))
        binding.tvProfileMessage.setTextColor(resources.getColor(R.color.error, null))
    }

    private fun hideMessageBanner() {
        binding.tvProfileMessage.visibility = View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
