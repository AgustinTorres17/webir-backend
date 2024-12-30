const tmdbService = require("./tmdb.service");
const googleAIService = require("./googleAI.service");
const { shuffleArray } = require("../utils/shuffleArray");

async function generate(prompt) {
  // Aquí la lógica antes existente en las rutas:
  // 1. Llamar a googleAIService.generateContent(prompt)
  // 2. Procesar la respuesta
  // 3. Retornar el array final
  // Ejemplo básico:
  const text = await googleAIService.generateContent(prompt);
  const movieNames = JSON.parse(text);
  return movieNames;
}

async function fetchMovieDetails(id) {
  return await tmdbService.getMovieDetails(id);
}

module.exports = {
  generate,
  fetchMovieDetails,
};
