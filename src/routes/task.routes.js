const { Router } = require("express");
const axios = require("axios");
const router = Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const configModel =
  "Tu tarea es proporcionar una lista de títulos exactos de películas, series o programas de televisión en español de México, basados en la descripción proporcionada por el usuario sobre lo que quiere ver o lo que le gusta. Debes cumplir con los siguientes requisitos: Devuelve únicamente los nombres oficiales y exactos de las películas, series o programas de televisión. El formato debe ser un array de strings, donde cada string es el nombre de una película, serie o programa de televisión. Evita usar cualquier carácter especial que no esté presente en el nombre oficial. Si el usuario pide películas, proporciona títulos de películas; si pide series o programas de televisión, proporciona títulos de series o programas de televisión. Intenta proporcionar al menos 10 y no más de 20 nombres, siempre que sea posible. Por ejemplo, si un usuario describe que le gusta la ciencia ficción y las aventuras, tu respuesta debe ser un array de títulos que se ajusten a esa descripción.";

const genAI = new GoogleGenerativeAI("AIzaSyAuYrl-PtzBQNJL-V61QAe-OHZhGwiaV6o");

const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

router.post("/generate", async (req, res) => {
  let { prompt } = req.body;
  console.log(prompt);
  if (!prompt)
    return res.status(400).json({ message: "No se proporcionó un prompt" });
  prompt = configModel + prompt;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  // Extrae el texto de la respuesta
  console.log(response);
  const text = response?.candidates[0]?.content?.parts[0]?.text;

  if (!text)
    return res.status(500).json({ message: "No se pudo generar el texto" });

  // Divide el texto por los saltos de línea para obtener un array de nombres de películas
  const movieNames = text?.split("\n");

  // Elimina los guiones del principio de cada nombre de película, reemplaza los espacios por %20 y convierte todo a minúsculas
  const cleanedMovieNames = movieNames.map((name) =>
    name.replace(/^- /, "").replace(/ /g, "%20").toLowerCase()
  );

  // Envía el array de nombres de películas como respuesta
  res.json(cleanedMovieNames);
});

router.get("/", async (req, res) => {
  res.send("Working");
});

router.get("/movies", async (req, res) => {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
    },
  };

  const response = await axios.request(options);

  res.json(response.data);
});

router.get("/series", async (req, res) => {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/tv?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
    },
  };

  const response = await axios.request(options);
  const series = response.data.results.map((series) => ({
    ...series,
    release_date: series.first_air_date,
    title: series.name,
  }));
  res.json({ ...response.data, results: series });
});

router.get("/genres", async (req, res) => {
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/genre/movie/list?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
    },
  };

  const response = await axios.request(options);
  res.json(response.data);
});

router.get("/movie", async (req, res) => {
  try {
    let { movieTitle } = req.query;
    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?include_adult=false&language=es-MX&page=1&query=${movieTitle}`,
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    let results = response.data.results;

    // Si no hay resultados de películas, buscar series de TV
    if (!results.length) {
      options.url = `https://api.themoviedb.org/3/search/tv?language=es-MX&query=${movieTitle}`;
      const response2 = await axios.request(options);
      if (!response2.data.results.length) {
        return res.status(404).json({ message: "No se encontraron resultados" });
      }
      results = response2.data.results.map(tvShow => ({
        ...tvShow,
        title: tvShow.name,
      }));
    }

    // Ordenar resultados por vote_average de forma descendente
    results.sort((a, b) => b.vote_average - a.vote_average);

    // Si hay más de 3 resultados, quedarnos solo con los 3 primeros
    if (results.length > 3) {
      results = results.slice(0, 3);
    }

    return res.json({ results });
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/cast", async (req, res) => {
  try {
    const { movieId } = req.query;
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/movie/${movieId}/credits?language=es-MX`,
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

router.get("/providers", async (req, res) => {
  try {
    const { movieId } = req.query;
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

module.exports = router;
