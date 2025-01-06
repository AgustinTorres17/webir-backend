const leven = require("fast-levenshtein");
const removeSpaces = require("./removeSpaces");
const normalizeText = require("./normalizeText");
const { convertKeywordsToGenres } = require("./preProcessPrompt");

const isGenreInPrompt = (genres, promptKeywords) => {
  if (genres.length === 0) return false;

  const normalizedGenres = genres.map((genre) =>
    removeSpaces(normalizeText(genre))
  );

  // Convertir palabras clave en géneros equivalentes
  let normalizedKeywords = promptKeywords.map((keyword) =>
    normalizeText(keyword)
  );

  if (normalizedKeywords.length === 1) {
    normalizedKeywords = normalizedKeywords[0]
      .split(" ")
      .filter((word) => word.length > 4);
    normalizedKeywords = normalizedKeywords.map((keyword) =>
      removeSpaces(keyword)
    );
  } else {
    normalizedKeywords = normalizedKeywords.map((keyword) =>
      removeSpaces(keyword)
    );
  }

  normalizedKeywords = convertKeywordsToGenres(normalizedKeywords);
  /* console.log("Normalized Genres:", normalizedGenres);
    console.log("Normalized Keywords:", normalizedKeywords); */

  // Aplanar normalizedKeywords
  const flattenedKeywords = normalizedKeywords.flat();


  const keywordInGenres = flattenedKeywords.some((keyword) =>
    normalizedGenres.some((genre) => {
      if (typeof genre === "string" && typeof keyword === "string") {
        const distance = leven.get(genre, keyword);
        return distance <= Math.min(genre.length, keyword.length) / 3;
      }
      return false;
    })
  );

  return keywordInGenres;
};

module.exports = {
  isGenreInPrompt,
};
