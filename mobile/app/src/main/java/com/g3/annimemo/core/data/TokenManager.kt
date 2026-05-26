package com.g3.annimemo.core.data

import android.content.Context

class TokenManager(private val context: Context) {
    companion object {
        private var jwtToken: String? = null
    }

    fun saveToken(token: String) {
        jwtToken = token
    }

    fun getToken(): String? {
        return jwtToken
    }

    fun clear() {
        jwtToken = null
    }
}
