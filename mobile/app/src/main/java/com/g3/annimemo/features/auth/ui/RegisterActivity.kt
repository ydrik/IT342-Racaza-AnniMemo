package com.g3.annimemo.features.auth.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.g3.annimemo.features.auth.ui.LoginActivity
import com.g3.annimemo.databinding.ActivityRegisterBinding
import com.g3.annimemo.core.network.RegisterRequest
import com.g3.annimemo.core.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
    }

    private fun setupUI() {
        // Register button click listener
        binding.btnRegister.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val firstName = binding.etFirstName.text.toString().trim()
            val lastName = binding.etLastName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()

            if (!validateInputs(username, firstName, lastName, email, password)) {
                return@setOnClickListener
            }

            performRegistration(username, password, firstName, lastName, email)
        }

        // Login redirect click listener
        binding.tvLoginRedirect.setOnClickListener {
            finish()
        }
    }

    private fun validateInputs(
        username: String,
        firstName: String,
        lastName: String,
        email: String,
        password: String
    ): Boolean {
        // Clear previous errors
        binding.errorContainer.visibility = View.GONE
        binding.successContainer.visibility = View.GONE

        // Validate username
        if (username.isEmpty()) {
            showError("Please enter a username")
            binding.tilUsername.error = "Required"
            return false
        }

        if (username.length < 3) {
            showError("Username must be at least 3 characters")
            binding.tilUsername.error = "Too short"
            return false
        }

        // Validate first name
        if (firstName.isEmpty()) {
            showError("Please enter your first name")
            binding.tilFirstName.error = "Required"
            return false
        }

        // Validate last name
        if (lastName.isEmpty()) {
            showError("Please enter your last name")
            binding.tilLastName.error = "Required"
            return false
        }

        // Validate email
        if (email.isEmpty()) {
            showError("Please enter an email address")
            binding.tilEmail.error = "Required"
            return false
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            showError("Please enter a valid email address")
            binding.tilEmail.error = "Invalid"
            return false
        }

        // Validate password
        if (password.isEmpty()) {
            showError("Please enter a password")
            binding.tilPassword.error = "Required"
            return false
        }

        if (password.length < 12) {
            showError("Password must be at least 12 characters")
            binding.tilPassword.error = "Too short"
            return false
        }

        val passwordPattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])\\S+$".toRegex()
        if (!password.matches(passwordPattern)) {
            showError("Password must include uppercase, lowercase, number, and special character")
            binding.tilPassword.error = "Too weak"
            return false
        }

        return true
    }

    private fun performRegistration(
        user: String,
        pass: String,
        first: String,
        last: String,
        email: String
    ) {
        binding.btnRegister.isEnabled = false
        binding.loadingIndicator.visibility = View.VISIBLE
        binding.errorContainer.visibility = View.GONE

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = RetrofitClient.create { null }
                val request = RegisterRequest(user, pass, first, last, email)
                val response = api.register(request)

                withContext(Dispatchers.Main) {
                    binding.btnRegister.isEnabled = true
                    binding.loadingIndicator.visibility = View.GONE

                    if (response.isSuccessful) {
                        showSuccess("Registration successful! Redirecting to login...")
                        
                        // Delay then redirect to login
                        lifecycleScope.launch {
                            delay(2000)
                            startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                            finish()
                        }
                    } else {
                        val errorMessage = when (response.code()) {
                            400 -> "Username or email already exists"
                            422 -> "Invalid input provided"
                            500 -> "Server error. Please try again later"
                            else -> "Registration failed: ${response.message()}"
                        }
                        showError(errorMessage)
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnRegister.isEnabled = true
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

    private fun showSuccess(message: String) {
        binding.successContainer.visibility = View.VISIBLE
        binding.successMessage.text = message
    }
}
