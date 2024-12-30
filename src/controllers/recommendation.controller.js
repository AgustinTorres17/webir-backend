// recommendation.controller.js
const recommendationService = require("../services/recommendation.service");
const tmdbService = require("../services/tmdb.service");

// Controlador para generar recomendaciones a partir de un prompt
async function generateRecommendations(req, res) {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: "No se proporcionó un prompt" });
  }

  try {
    const recommendations = await recommendationService.generate(prompt);
    return res.json(recommendations);
  } catch (error) {
    console.error("Error al generar contenido:", error);
    return res.status(500).json({ message: "Error al generar contenido" });
  }
}

// Controlador para obtener datos del home (mezcla de películas, series, géneros, etc.)
async function getHomeData(req, res) {
  try {
    const data = await tmdbService.getHomeData();
    res.json(data);
  } catch (error) {
    console.error("Error al obtener los datos del home", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Controlador para validar recomendaciones
async function validateRecommendations(req, res) {
  const { recommendations, prompt } = req.body;
  if (!recommendations || !prompt) {
    return res.status(400).json({ message: "Faltan datos para validar" });
  }

  try {
    const validated = await recommendationService.validateRecommendations(
      recommendations,
      prompt
    );
    res.json({ results: validated });
  } catch (error) {
    console.error("Error al validar recomendaciones:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Controladores para obtener listas de películas, series, géneros, etc.
async function getMovies(req, res) {
  try {
    const movies = await tmdbService.fetchMovies();
    res.json(movies);
  } catch (error) {
    console.error("Error al obtener las películas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getSeries(req, res) {
  try {
    const series = await tmdbService.fetchSeries();
    res.json(series);
  } catch (error) {
    console.error("Error al obtener las series:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getGenres(req, res) {
  try {
    const genres = await tmdbService.fetchGenres();
    res.json(genres);
  } catch (error) {
    console.error("Error al obtener géneros:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getContentByGenre(req, res) {
  const { genre } = req.query;
  if (!genre) {
    return res.status(400).json({ message: "No se proporcionó un género" });
  }

  try {
    const content = await tmdbService.getContentByGenre(genre);
    res.json(content);
  } catch (error) {
    console.error("Error al obtener contenido por género:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Controladores para obtener detalles de películas/series
async function getMovieById(req, res) {
  const { id } = req.params;
  try {
    const movieDetails = await tmdbService.getMovieById(id);
    if (!movieDetails) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }
    res.json(movieDetails);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getSerieById(req, res) {
  const { id } = req.params;
  try {
    const serieDetails = await tmdbService.getSerieById(id);
    if (!serieDetails) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }
    res.json(serieDetails);
  } catch (error) {
    console.error("Error al obtener detalles de la serie:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Controladores para búsqueda
async function searchMovieAlternative(req, res) {
  const { movieTitle } = req.query;
  if (!movieTitle) {
    return res.status(400).json({ message: "No se proporcionó un título" });
  }

  try {
    const results = await tmdbService.getMovieOrSerieByTitle(movieTitle);
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }
    res.json({ results });
  } catch (error) {
    console.error("Error al buscar películas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function searchMovieDetailed(req, res) {
  const { movieTitle } = req.query;
  if (!movieTitle) {
    return res.status(400).json({ message: "No se proporcionó un título" });
  }

  try {
    const results = await recommendationService.searchMovieDetailed(movieTitle);
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }
    res.json({ results });
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

// Controladores para obtener información extra (reparto, trailers, proveedores)
async function getMovieCast(req, res) {
  const { movieId } = req.params;
  try {
    const cast = await tmdbService.getMovieCast(movieId);
    res.json(cast);
  } catch (error) {
    console.error("Error al obtener el reparto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getMovieTrailer(req, res) {
  const { movieId } = req.params;
  try {
    const trailer = await tmdbService.getMovieTrailer(movieId);
    res.json(trailer);
  } catch (error) {
    console.error("Error al obtener el trailer:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getSerieTrailer(req, res) {
  const { serieId } = req.params;
  try {
    const trailer = await tmdbService.getSerieTrailer(serieId);
    res.json(trailer);
  } catch (error) {
    console.error("Error al obtener el trailer de la serie:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getSerieCast(req, res) {
  const { serieId } = req.params;
  try {
    const cast = await tmdbService.getSerieCast(serieId);
    res.json(cast);
  } catch (error) {
    console.error("Error al obtener el reparto de la serie:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getMovieProviders(req, res) {
  const { movieId } = req.query;
  if (!movieId) {
    return res.status(400).json({ message: "No se proporcionó un movieId" });
  }

  try {
    const providers = await tmdbService.getMovieProviders(movieId);
    res.json(providers);
  } catch (error) {
    console.error("Error al obtener proveedores de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function getSerieProviders(req, res) {
  const { serieId } = req.query;
  if (!serieId) {
    return res.status(400).json({ message: "No se proporcionó un serieId" });
  }

  try {
    const providers = await tmdbService.getSerieProviders(serieId);
    res.json(providers);
  } catch (error) {
    console.error("Error al obtener proveedores de la serie:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}


// Exportar las funciones del controlador
module.exports = {
  generateRecommendations,
  getHomeData,
  validateRecommendations,
  getMovies,
  getSeries,
  getGenres,
  getContentByGenre,
  getMovieById,
  getSerieById,
  searchMovieAlternative,
  searchMovieDetailed,
  getMovieCast,
  getMovieTrailer,
  getSerieTrailer,
  getSerieCast,
  getMovieProviders,
  getSerieProviders,
};
