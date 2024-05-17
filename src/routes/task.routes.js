const { Router } = require("express");
const axios = require("axios");
const router = Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const configModel = "Devuelve un array con los nombres de las peliculas, series o tv shows que, a tu parecer, sean los mas adecuados. Estos tienen que estar en español de méxico, debes de darme solo el nombre de las peliculas, series o tv shows candidatas. El formato debe ser un array que contenga en cada celda el nombre como un string. El nombre de la pelicula, serie o tv show debe ser exacto, es decir, el nombre publicado oficialmente. Evita usar cualquier caracter especial que no este en el nombre. Trata de, en el caso de ser posible, dar al menos 10 nombres y no mas de 20. Tambien, si respetar el tipo, si el usuario pide peliculas debes de dar peliculas, si pide series o tv shows, debes de dar series o tv shows."

const genAI = new  GoogleGenerativeAI("AIzaSyAuYrl-PtzBQNJL-V61QAe-OHZhGwiaV6o");

const model = genAI.getGenerativeModel({model: 'gemini-1.0-pro'})

router.post("/generate", async (req, res) => {
  let { prompt } = req.body;
  console.log(prompt);
  if (!prompt) return res.status(400).json({ message: "No se proporcionó un prompt" });
  prompt += configModel;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  // Extrae el texto de la respuesta
  console.log(response)
  const text = response?.candidates[0]?.content?.parts[0]?.text;

  if (!text) return res.status(500).json({ message: "No se pudo generar el texto" });

  // Divide el texto por los saltos de línea para obtener un array de nombres de películas
  const movieNames = text?.split('\n');

  // Elimina los guiones del principio de cada nombre de película, reemplaza los espacios por %20 y convierte todo a minúsculas
  const cleanedMovieNames = movieNames.map(name => name.replace(/^- /, '').replace(/ /g, '%20').toLowerCase());

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
    movieTitle = movieTitle.toLowerCase().replace(/ /g, "%20");
    console.log(movieTitle);
    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?include_adult=false&language=es-MX&page=1&query=${encodeURIComponent(movieTitle)}`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    let response = await axios.request(options);
    if(!response.data.results.length){
      options.url = `https://api.themoviedb.org/3/search/tv?language=es-MX&query=${encodeURIComponent(movieTitle)}`
      response = await axios.request(options);
      console.log(response.data?.results[0].name);
      response.data.results[0].title = response.data?.results[0].name;
    }
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: req.query});
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
        Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error al obtener detalles de la película" });
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
        Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error al obtener detalles de la película" });
  }
});


module.exports = router;
