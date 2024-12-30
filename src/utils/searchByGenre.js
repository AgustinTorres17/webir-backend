const getGenreId = require("./getGenreId");
const axios = require("axios");
// Función para buscar películas y series por género
async function searchByGenre(genreName , TMDB_API_KEY) {
  const genreId = await getGenreId(genreName);
  const maxPages = 4; // Número máximo de páginas a obtener
  let movieResults = [];
  try {
    for (let page = 1; page <= maxPages; page++) {
      const movieOptions = {
        method: "GET",
        url: `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&include_adult=false&include_video=false&language=es-ES&page=${page}`,
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      };
      const movieResponse = await axios.request(movieOptions);
      movieResults = movieResults.concat(movieResponse.data.results);
    }
    return movieResults;
  } catch (error) {
    /* console.error(error); */
    return null;
  }
}

module.exports = searchByGenre;
