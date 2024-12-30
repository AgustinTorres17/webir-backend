const tv_genres = require("../constants/tvGenres");

async function fetchTvByGenre(genre) {
  const genreId = tv_genres.find((g) =>
    g.name.toLowerCase().trim().includes(genre.toLowerCase())
  )?.id;
  if (!genreId) return [];
  let seriesGenre = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/tv?with_genres=${genreId}&include_adult=false&language=es-ES&page=${number}&sort_by=popularity.desc`,
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