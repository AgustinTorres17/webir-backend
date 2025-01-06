const { genreEquivalents } = require("../constants/genreEquivalents");
const compromise = require("compromise");
const stopwords = require("../constants/stopWords");
const normalizeText = require("./normalizeText");
const removeSpaces = require("./removeSpaces");
const leven = require("fast-levenshtein");

const splitByStopwordsGenre = (text) => {
  text = text.replace(/\s/g, " y ");
  const regex = new RegExp(`\\b(${stopwords.join("|")})\\b`, "gi");
  return text
    .split(regex)
    .filter(
      (word) => !stopwords.includes(normalizeText(word)) && word.trim() !== ""
    );
};

const splitByStopwordsActor = (text) => {
  const regex = new RegExp(`\\b(${stopwords.join("|")})\\b`, "gi");
  const textSplit = text.split(regex)
  .filter(
    (word) => !stopwords.includes(normalizeText(word)) && word.trim() !== ""
  );
  return text
};

const convertKeywordsToGenres = (keywords) => {
  const genreMapping = {};
  genreEquivalents.forEach((genreEquivalent) => {
    const { name, equivalents } = genreEquivalent;
    equivalents.forEach((equivalent) => {
      const normalizedEquivalent = normalizeText(removeSpaces(equivalent));
      if (!genreMapping[normalizedEquivalent]) {
        genreMapping[normalizedEquivalent] = [];
      }
      genreMapping[normalizedEquivalent].push(name);
      genreMapping[normalizedEquivalent].push(
        ...equivalents.map((eq) => normalizeText(removeSpaces(eq)))
      );
    });
  });
  const convertedKeywords = keywords.map((keyword) => {
    const normalizedKeyword = normalizeText(removeSpaces(keyword));
    for (const normalizedEquivalent in genreMapping) {
      if (leven.get(normalizedEquivalent, normalizedKeyword) <= 2) {
        return genreMapping[normalizedEquivalent];
      }
    }
    return [keyword];
  });
  return convertedKeywords;
};

const getKeywords = (text, isActor) => {
  const doc = compromise(text);
  const keywords = doc
    .nouns()
    .out("array")
    .concat(doc.adjectives().out("array"))
    .concat(doc.verbs().out("array"));
  let filteredKeywords = [];
  if (isActor) {
    filteredKeywords = keywords.flatMap((keyword) =>
      splitByStopwordsActor(keyword)
    );
  } else {
    filteredKeywords = keywords.flatMap((keyword) =>
      splitByStopwordsGenre(keyword)
    );
  }
  return filteredKeywords;
};

module.exports = {
  getKeywords,
  convertKeywordsToGenres,
};
