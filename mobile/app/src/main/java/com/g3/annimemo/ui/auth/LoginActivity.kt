package com.g3.annimemo.ui.auth

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.g3.annimemo.MainActivity
import com.g3.annimemo.data.TokenManager
import com.g3.annimemo.databinding.ActivityLoginBinding
import com.g3.annimemo.network.LoginRequest
import com.g3.annimemo.network.RetrofitClient
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

        binding.btnLogin.setOnClickListener {
            val identifier = binding.etIdentifier.text.toString().trim()
            val password = binding.etPassword.text.toString()

            if (identifier.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performLogin(identifier, password)
        }

        binding.tvRegisterRedirect.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun performLogin(identifier: String, pass: String) {
        binding.btnLogin.isEnabled = false
        
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val api = RetrofitClient.create { tokenManager.getToken() }
                val response = api.login(LoginRequest(identifier, pass))
                
                withContext(Dispatchers.Main) {
                    binding.btnLogin.isEnabled = true
                    if (response.isSuccessful && response.body() != null) {
                        val authResponse = response.body()!!
                        tokenManager.saveToken(authResponse.token)
                        Toast.makeText(this@LoginActivity, "Login Successful!", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                        finish()
                    } else {
                        Toast.makeText(this@LoginActivity, "Invalid login credentials", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    binding.btnLogin.isEnabled = true
                    Toast.makeText(this@LoginActivity, "Network Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
