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

module.exports = router;
