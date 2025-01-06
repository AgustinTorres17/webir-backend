const tvAndMoviesIDGenres = require("../constants/tvAndMoviesIDGenres");

async function getGenreIds(genreName) {
  const normalizedGenreName = genreName.toLowerCase().trim();
  return tvAndMoviesIDGenres[normalizedGenreName] || [];
}

module.exports = getGenreIds;
