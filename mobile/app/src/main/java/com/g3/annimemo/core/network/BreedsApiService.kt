package com.g3.annimemo.core.network

import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query

// Breed API DTO structures
data class DogBreedDto(
    val name: String,
    val origin: String? = null,
    val life_span: String? = null,
    val temperament: String? = null
)

data class CatBreedDto(
    val name: String,
    val origin: String? = null,
    val life_span: String? = null,
    val temperament: String? = null,
    val description: String? = null
)

data class NinjaAnimalDto(
    val name: String,
    val taxonomy: NinjaTaxonomyDto? = null,
    val characteristics: NinjaCharacteristicsDto? = null
)

data class NinjaTaxonomyDto(
    val scientific_name: String? = null
)

data class NinjaCharacteristicsDto(
    val lifespan: String? = null,
    val diet: String? = null,
    val temperament: String? = null,
    val group_behavior: String? = null
)

// Simplified Breed representation for unified adapter binding
data class BreedModel(
    val name: String,
    val origin: String,
    val lifespan: String,
    val temperament: String,
    val description: String
)

interface BreedsApiService {
    @GET("https://api.thedogapi.com/v1/breeds")
    suspend fun getDogBreeds(
        @Header("x-api-key") apiKey: String = "live_WvGQEESQRQwJZxfBt3yDqoTNI167OcAFDbUUKG01RmuzcWFAt6vWaXDWF6tQxGW8"
    ): Response<List<DogBreedDto>>

    @GET("https://api.thecatapi.com/v1/breeds")
    suspend fun getCatBreeds(
        @Header("x-api-key") apiKey: String = "live_RhwcJGAkjIOtOoPE8vt40pA5qW8Pki3WrBSgIRna2aHXi9Wrv0VLyzRQE9q6Yyi6"
    ): Response<List<CatBreedDto>>

    @GET("https://api.api-ninjas.com/v1/animals")
    suspend fun getOtherAnimals(
        @Query("name") name: String,
        @Header("X-Api-Key") apiKey: String = "umq5Kw3JhzWzxy3FbstB5hRFIwJargSdSta5PnyL"
    ): Response<List<NinjaAnimalDto>>

    companion object {
        private var instance: BreedsApiService? = null

        fun get(): BreedsApiService {
            if (instance == null) {
                instance = Retrofit.Builder()
                    .baseUrl("https://api.thedogapi.com/v1/") // generic fallback base URL
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                    .create(BreedsApiService::class.java)
            }
            return instance!!
        }
    }
}
