const tmdbService = require("./tmdb.service");
const googleAIService = require("./googleAI.service");
const { TMDB_API_KEY } = require("../config");
const axios = require("axios");
const normalizeText = require("../utils/normalizeText");
const { getKeywords } = require("../utils/preProcessPrompt");
const {isPersonInPrompt} = require("../utils/isPersonInPrompt");
const  movieGenres  = require("../constants/movieGenres");
const  tvGenres  = require("../constants/tvGenres");
const { isGenreInPrompt } = require("../utils/isGenreInPrompt");
async function generate(prompt) {
  const text = await googleAIService.generateContent(prompt);
  const movieNames = JSON.parse(text);
  const movieDetails = await Promise.all(
    movieNames.map(async (movie) => {
      const details = await searchMovieDetails(movie);
      return details;
    })
  );
  const flattenedMovieDetails = movieDetails.flat();
  const validatedMovies = await validateRecommendations(
    flattenedMovieDetails,
    prompt
  );
  return validatedMovies;
}

async function fetchMovieDetails(id) {
  return await tmdbService.getMovieDetails(id);
}

async function searchMovieDetails(movieTitle) {
  try {
    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?query=${movieTitle}&page=1&language=es-ES&include_adult=false`,
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    };

    const response = await axios.request(options);
    let results = response.data.results;

    // Function to get cast for a specific result
    const getCast = async (result) => {
      try {
        let options = {
          method: "GET",
          url: `https://api.themoviedb.org/3/movie/${result.id}/credits?language=es-ES`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const response = await axios.request(options);
        result.cast = response.data.cast
          .slice(0, 10)
          .map((actor) => actor.name);
        return result;
      } catch (error) {
        result.cast = [];
        return result;
      }
    };

    // Get cast for all movie results
    results = await Promise.all(
      results.map(async (movie) => {
        const data = await getCast(movie);
        movie.cast = data.cast;
        return movie;
      })
    );

    // Get TV shows
    options.url = `https://api.themoviedb.org/3/search/tv?query=${movieTitle}&page=1&language=es-ES`;
    const response2 = await axios.request(options);
    let tvResults = response2.data.results;

    const getTvCast = async (result) => {
      try {
        let options = {
          method: "GET",
          url: `https://api.themoviedb.org/3/tv/${result.id}/credits?language=es-ES`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const response = await axios.request(options);
        result.cast = response.data.cast
          .slice(0, 10)
          .map((actor) => actor.name);
        return result;
      } catch (error) {
        result.cast = [];
        return result;
      }
    };

    tvResults = await Promise.all(
      tvResults.map(async (tvShow) => {
        const data = await getTvCast(tvShow);
        tvShow.cast = data.cast;
        return tvShow;
      })
    );

    // Combine results
    results = results.concat(
      tvResults.map((tvShow) => ({
        ...tvShow,
      }))
    );

    let resultsCorrected = results.filter((result) => {
      return (
        result.overview.length > 30 &&
        result.poster_path != null &&
        result.vote_average > 1
      );
    });

    resultsCorrected.sort((a, b) => b.popularity - a.popularity);

    const resSeparados = resultsCorrected.slice(0, 5);
    return resSeparados;
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    return [];
  }
}

function validateByActor(recommendations, prompt) {
  const rec = recommendations.filter((rec) => {
    if (!rec || !rec.cast || rec.cast.length === 0) return false;
    if (isPersonInPrompt(rec.cast, prompt)) {
      return true;
    }
  });
  return rec;
}

function getGenreName(genreIds) {
  if (genreIds.length === 0) return [];
  const genres = movieGenres.concat(tvGenres);
  let genresNames = [];
  for (let i = 0; i < genreIds.length; i++) {
    const genre = genres.find((g) => g.id === genreIds[i]);
    if (genre) genresNames.push(genre.name);
  }
  return genresNames;
}

function validateByGenre(recommendations, prompt) {
  const rec = recommendations.filter((rec) => {
    if (!rec || rec.overview.length < 30) return false;
    const genres_ids = rec.genre_ids;
    const genres = getGenreName(genres_ids);
    if (!genres || genres.length === 0) return false;
    /* console.log("Checking Genre in:", rec.title, genres); */
    return isGenreInPrompt(genres, prompt);
  });
  return rec;
}

async function validateRecommendations(recommendations, prompt) {
  const uniqueRecommendations = [...new Set(recommendations)];
  if (!uniqueRecommendations || uniqueRecommendations.length === 0) return [];
  const promptNormalized = normalizeText(prompt);
  let promptKeywords = getKeywords(promptNormalized, true);

  const filteredByActor = validateByActor(uniqueRecommendations, promptKeywords);
  if (filteredByActor.length > 0) return filteredByActor;

  promptKeywords = getKeywords(promptNormalized, false);

  const filteredByGenre = validateByGenre(uniqueRecommendations, promptKeywords);
  if (filteredByGenre.length > 0) return filteredByGenre;


  const sortedRecommendations = uniqueRecommendations
    .filter((rec) => rec.cast.length > 1)
    .filter((rec) => rec.overview.length > 30);
  const finalRecommendations = sortedRecommendations.sort(
    (a, b) => b.popularity - a.popularity
  );
  return finalRecommendations;
}

module.exports = {
  generate,
  fetchMovieDetails,
  searchMovieDetails,
};
