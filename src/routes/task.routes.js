const { Router } = require("express");
const axios = require("axios");
const router = Router();

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
    const { movieTitle } = req.query;
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?include_adult=false&language=es-MX&page=1&query=${encodeURIComponent(movieTitle)}`,
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
