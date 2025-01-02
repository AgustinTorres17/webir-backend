const { TMDB_API_KEY } = require("../config");
const axios = require("axios");

async function fetchTvByGenre(genreId) {
  let seriesGenre = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/tv?with_genres=${genreId}&include_adult=false&language=es-ES&page=${number}&sort_by=popularity.desc&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    const response = await axios.request(options);
    seriesGenre = seriesGenre?.concat(response.data.results);
  }
  return seriesGenre;
}

module.exports = fetchTvByGenre;