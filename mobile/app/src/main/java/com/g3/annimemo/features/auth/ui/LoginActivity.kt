package com.g3.annimemo.features.auth.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.g3.annimemo.MainActivity
import com.g3.annimemo.core.data.TokenManager
import com.g3.annimemo.databinding.ActivityLoginBinding
import com.g3.annimemo.core.network.LoginRequest
import com.g3.annimemo.core.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class LoginActivity : AppCompatActivity() {
    private lateinit var binding: ActivityLoginBinding
    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        tokenManager = TokenManager(this)
        
        // If already logged in, redirect to Main
        if (tokenManager.getToken() != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setupUI()
    }

    private fun setupUI() {
        // Login button click listener
        binding.btnLogin.setOnClickListener {
            val identifier = binding.etIdentifier.text.toString().trim()
            val password = binding.etPassword.text.toString()

            // Validate inputs
            if (!validateInputs(identifier, password)) {
                return@setOnClickListener
            }

            performLogin(identifier, password)
        }

        // Register redirect click listener
        binding.tvRegisterRedirect.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun validateInputs(identifier: String, password: String): Boolean {
        // Clear previous errors
        binding.errorContainer.visibility = View.GONE

        // Validate identifier
        if (identifier.isEmpty()) {
            showError("Please enter your username or email")
            binding.tilIdentifier.error = "Required"
            return false
        }

        // Validate password
        if (password.isEmpty()) {
            showError("Please enter your password")
            binding.tilPassword.error = "Required"
            return false
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters")
            binding.tilPassword.error = "Too short"
            return false
        }

        return true
    }

    private fun performLogin(identifier: String, pass: String) {
        binding.btnLogin.isEnabled = false
        binding.loadingIndicator.visibility = View.VISIBLE
        binding.errorContainer.visibility = View.GONE
        
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = RetrofitClient.create { tokenManager.getToken() }
                val response = api.login(LoginRequest(username = identifier, password = pass))
                
                withContext(Dispatchers.Main) {
                    binding.btnLogin.isEnabled = true
                    binding.loadingIndicator.visibility = View.GONE
                    
                    if (response.isSuccessful && response.body() != null) {
                        val authResponse = response.body()!!
                        tokenManager.saveToken(authResponse.token)
                        
                        val localStorage = com.g3.annimemo.core.data.LocalStorageManager(this@LoginActivity)
                        val existingProfile = localStorage.getUserProfile(authResponse.username)
                        if (existingProfile.username == "User" || existingProfile.username != authResponse.username) {
                            localStorage.saveUserProfile(
                                com.g3.annimemo.core.network.UserProfileDto(
                                    username = authResponse.username,
                                    firstName = authResponse.username,
                                    lastName = "",
                                    email = "${authResponse.username}@example.com",
                                    role = "USER"
                                )
                            )
                        }
                        
                        // Navigate to MainActivity
                        startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                        finish()
                    } else {
                        val errorMessage = when (response.code()) {
                            401 -> "Invalid login credentials"
                            404 -> "User not found"
                            500 -> "Server error. Please try again later"
                            else -> "Login failed: ${response.message()}"
                        }
                        showError(errorMessage)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnLogin.isEnabled = true
                    binding.loadingIndicator.visibility = View.GONE
                    showError("Network error: ${e.message ?: "Connection failed"}")
                }
            }
        }
    }

    private fun showError(message: String) {
        binding.errorContainer.visibility = View.VISIBLE
        binding.errorMessage.text = message
    }
}
