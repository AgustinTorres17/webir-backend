const leven = require("fast-levenshtein");
const removeSpaces = require("./removeSpaces");
const normalizeText = require("./normalizeText");

const isPersonInPrompt = (cast, promptKeywords) => {
    const normalizedCast = cast.map((person) =>
      removeSpaces(normalizeText(person))
    );
  
    let normalizedKeywords = [];
    if (promptKeywords.length === 1) {
      normalizedKeywords = promptKeywords[0]
        .split(" ")
        .filter((word) => word.length > 4);
      normalizedKeywords = normalizedKeywords.map((keyword) =>
        removeSpaces(normalizeText(keyword))
      );
    } else {
      normalizedKeywords = promptKeywords.map((keyword) =>
        removeSpaces(normalizeText(keyword))
      );
    }
  
    const keywordInCast = normalizedKeywords.some((person) =>
      normalizedCast.some((actor) => {
        const distance = leven.get(actor, person);
        return distance <= Math.min(actor.length, person.length) / 3; // Permite un tercio del tamaño como errores
      })
    );
  
    return keywordInCast;
  };

  module.exports = {
    isPersonInPrompt,
  };