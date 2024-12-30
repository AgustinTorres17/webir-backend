const tv_genres = require("../constants/tvGenres.js");
const axios = require("axios");
const fetchTvListHome = async (TMDB_API_KEY) => {
  const tvList = await Promise.all(
    tv_genres.map(async (genre) => {
      const options = {
        method: "GET",
        url: `https://api.themoviedb.org/3/discover/tv?with_genres=${genre.id}&include_adult=false&language=es-MX&page=1&sort_by=popularity.desc`,
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + TMDB_API_KEY,
        },
      };
      const response = await axios.request(options);
      return {
        genre: genre.name,
        results: response.data.results,
      };
    })
  );
  return tvList;
};

module.exports = fetchTvListHome;
