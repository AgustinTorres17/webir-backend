const { Router } = require("express");
const {
  generateRecommendations,
  getHomeData,
  validateRecommendations,
  getMovies,
  getSeries,
  getGenres,
  getContentByGenre,
  getMovieById,
  getSerieById,
  searchMovieAlternative,
  searchMovieDetailed,
  getMovieCast,
  getMovieTrailer,
  getSerieTrailer,
  getSerieCast,
  getMovieProviders,
  getSerieProviders,
} = require("../controllers/recommendation.controller");

const router = Router();

// Rutas que mapean a controladores

router.post("/generate", generateRecommendations);

router.get("/", (req, res) => {
  res.send("Working");
});

router.get("/movies", getMovies);
router.get("/series", getSeries);
router.get("/genres", getGenres);
router.get("/genre", getContentByGenre); // utiliza req.query.genre

router.get("/movie/:id", getMovieById);
router.get("/serie/:id", getSerieById);
router.get("/movie2", searchMovieAlternative); // busca con movieTitle por query
router.get("/movie", searchMovieDetailed); // busca con movieTitle por query

router.get("/movie/cast/:movieId", getMovieCast);
router.get("/movie/trailer/:movieId", getMovieTrailer);
router.get("/serie/trailer/:serieId", getSerieTrailer);
router.get("/serie/cast/:serieId", getSerieCast);

router.get("/movie-providers", getMovieProviders); // usa query: movieId
router.get("/serie-providers", getSerieProviders); // usa query: serieId

router.post("/validate", validateRecommendations);

router.get("/get-data-home", getHomeData);

module.exports = router;
