const axios = require("axios");
const normalizeText = require("./normalizeText");
const movie_genres = require("../constants/movieGenres");
const tv_genres = require("../constants/tvGenres");
async function getGenreId(genreName) {
  try {
    const genres = movie_genres.concat(tv_genres).map((g) => ({
      ...g,
      name: normalizeText(g.name),
    }));
    const genre = genres.find(
      (g) => g.name.toLowerCase() === genreName.toLowerCase()
    );
    return genre ? genre.id : null;
  } catch (error) {
    return null;
  }
}

module.exports = getGenreId;
