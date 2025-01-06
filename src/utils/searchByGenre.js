const getGenreIds = require("./getGenreId");
const axios = require("axios");

// Función para buscar películas y series por género
async function searchByGenre(genreName, TMDB_API_KEY) {
  const [movieGenreId, tvGenreId] = await getGenreIds(genreName);
  const maxPages = 4; // Número máximo de páginas a obtener
  let results = [];

  if (movieGenreId) {
    try {
      for (let page = 1; page <= maxPages; page++) {
        const movieOptions = {
          method: "GET",
          url: `https://api.themoviedb.org/3/discover/movie?with_genres=${movieGenreId}&include_adult=false&include_video=false&language=es-ES&page=${page}`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const movieResponse = await axios.request(movieOptions);
        results = results.concat(movieResponse.data.results);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  }

  if (tvGenreId) {
    try {
      for (let page = 1; page <= maxPages; page++) {
        const tvOptions = {
          method: "GET",
          url: `https://api.themoviedb.org/3/discover/tv?with_genres=${tvGenreId}&include_adult=false&language=es-ES&page=${page}&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const tvResponse = await axios.request(tvOptions);
        results = results.concat(tvResponse.data.results);
      }
    } catch (error) {
      console.error("Error fetching TV shows:", error);
    }
  }

  return results;
}

module.exports = searchByGenre;