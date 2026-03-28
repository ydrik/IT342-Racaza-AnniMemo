package com.g3.annimemo.ui.auth

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.g3.annimemo.databinding.ActivityRegisterBinding
import com.g3.annimemo.network.RegisterRequest
import com.g3.annimemo.network.RetrofitClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnRegister.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val firstName = binding.etFirstName.text.toString().trim()
            val lastName = binding.etLastName.text.toString().trim()
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString()

            if (username.isEmpty() || email.isEmpty() || password.isEmpty() || firstName.isEmpty() || lastName.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performRegistration(username, password, firstName, lastName, email)
        }
    }

    private fun performRegistration(user: String, pass: String, first: String, last: String, email: String) {
        binding.btnRegister.isEnabled = false
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = RetrofitClient.create { null }
                val request = RegisterRequest(user, pass, first, last, email)
                val response = api.register(request)

                withContext(Dispatchers.Main) {
                    binding.btnRegister.isEnabled = true
                    if (response.isSuccessful) {
                        Toast.makeText(this@RegisterActivity, "Registration Successful! Please login.", Toast.LENGTH_LONG).show()
                        finish()
                    } else {
                        Toast.makeText(this@RegisterActivity, "Registration failed: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnRegister.isEnabled = true
                    Toast.makeText(this@RegisterActivity, "Network Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
