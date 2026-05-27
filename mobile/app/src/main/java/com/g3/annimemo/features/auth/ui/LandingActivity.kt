package com.g3.annimemo.features.auth.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.g3.annimemo.MainActivity
import com.g3.annimemo.R
import com.g3.annimemo.core.data.TokenManager

class LandingActivity : AppCompatActivity() {
    private lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        tokenManager = TokenManager(this)
        
        // If already logged in, redirect directly to MainActivity
        if (tokenManager.getToken() != null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }
        
        setContentView(R.layout.activity_landing)
        
        setupUI()
    }

    private fun setupUI() {
        val btnLogin = findViewById<Button>(R.id.btn_landing_login)
        val btnRegister = findViewById<Button>(R.id.btn_landing_register)

        btnLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }

        btnRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }
}
