const axios = require("axios");
const { TMDB_API_KEY } = require("../config");
const { shuffleArray } = require("../utils/shuffleArray");
const fetchTvByGenre = require("../utils/fetchTvByGenre");
const searchByGenre = require("../utils/searchByGenre");
const fetchTvListHome = require("../utils/fetchTVListHome");
const limitArray = require("../utils/limitSize");
const getGenreIds = require("../utils/getGenreId");

async function getMovieDetails(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    try {
      const response2 = await axios.get(
        `https://api.themoviedb.org/3/tv/${id}?language=es-ES`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        }
      );
      const data = response2.data;
      data.title = data.name;
      return data;
    } catch (error2) {
      return null;
    }
  }
}
const fetchPopularData = async () => {
  const movieOptions = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const tvOptions = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/tv?include_adult=false&language=es-ES&page=1&sort_by=popularity.desc&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  try {
    const [movieResponse, tvResponse] = await Promise.all([
      axios.request(movieOptions),
      axios.request(tvOptions),
    ]);

    return {
      movies: movieResponse.data.results,
      tvShows: tvResponse.data.results,
    };
  } catch (error) {
    /* console.error(error); */
    return null;
  }
};

async function fetchMovies() {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc&watch_region=UY&with_original_language=en%7Ces",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  const response = await axios.request(options);
  return response.data.results;
}

async function fetchSeries() {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/tv?include_adult=false&include_video=false&language=es-ES&page=2&sort_by=popularity.desc&watch_region=UY&with_original_language=en%7Ces",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const response = await axios.request(options);
  const series = response.data.results.map((series) => ({
    ...series,
  }));
  return series;
}

async function fetchGenres() {
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/genre/movie/list?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const response = await axios.request(options);
  return response.data.genres;
}

async function getContentByGenre(genre) {
  const [movieGenreId, tvGenreId] = await getGenreIds(genre);
  if (!movieGenreId && !tvGenreId) return [];

  let respuesta = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=${movieGenreId}&include_video=false&language=es-ES&page=${number}&sort_by=popularity.desc&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    try {
      const response = await axios.request(options);
      respuesta = respuesta?.concat(response.data.results);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  }

  if (tvGenreId) {
    const seriesGenre = await fetchTvByGenre(tvGenreId);
    respuesta = respuesta?.concat(seriesGenre);
  }

  respuesta = shuffleArray(respuesta);
  respuesta = respuesta.filter(
    (result) => result.overview && result.overview.trim() !== ""
  );

  return respuesta;
}

async function getMovieOrSerieByTitle(movieTitle) {
  try {
    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?query=${movieTitle}&page=1&language=es-MX`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };

    const response = await axios.request(options);
    let results = response.data.results;

    // Si no hay resultados de películas, buscar series de TV
    options.url = `https://api.themoviedb.org/3/search/tv?query=${movieTitle}&page=1&language=es-MX`;
    const response2 = await axios.request(options);
    if (!response2.data.results.length && !results.length) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }

    results = results.concat(response2.data.results);

    results = results.filter(
      (result) => result.overview && result.overview.trim() !== ""
    );

    // Ordenar resultados por vote_average de forma descendente
    results.sort((a, b) => b.popularity - a.popularity);
    return results;
  } catch (error) {
    console.error("Error al buscar películas:", error);
    return null;
  }
}

async function getMovieById(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function getSerieById(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/${id}?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

async function getMovieTrailer(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/videos`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.results;
  } catch (error) {
    return null;
  }
}

async function getSerieTrailer(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/${id}/videos`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.results;
  } catch (error) {
    return null;
  }
}

async function getMovieProviders(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/watch/providers?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.results;
  } catch (error) {
    return null;
  }
}

async function getSerieProviders(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/${id}/watch/providers?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.results;
  } catch (error) {
    return null;
  }
}

async function getMovieCast(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/credits?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.cast;
  } catch (error) {
    return null;
  }
}

async function getSerieCast(id) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/tv/${id}/credits?language=es-ES`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    return response.data.cast;
  } catch (error) {
    return null;
  }
}

async function getDiscoverMovies() {
  let aggregatedResults = [];
  let numbersHistory = [];
  for (let i = 0; i < 5; i++) {
    let randomPage = Math.floor(Math.random() * 100) + 1;
    while (numbersHistory.includes(randomPage)) {
      randomPage = Math.floor(Math.random() * 100) + 1;
    }
    numbersHistory.push(randomPage);

    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/movie?language=es-ES&page=${randomPage}&include_adult=false&sort_by=popularity.desc&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO`,
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    };
    try {
      const response = await axios.request(options);
      if (response.data && response.data.results) {
        aggregatedResults = aggregatedResults.concat(response.data.results);
      }
    } catch (error) {
      // Handle error
    }
  }
  return aggregatedResults;
}

async function getDiscoverSeries() {
  let aggregatedResults = [];
  let numbersHistory = [];
  for (let i = 0; i < 5; i++) {
    let randomPage = Math.floor(Math.random() * 100) + 1;
    while (numbersHistory.includes(randomPage)) {
      randomPage = Math.floor(Math.random() * 100) + 1;
    }
    numbersHistory.push(randomPage);

    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/tv?language=es-ES&page=${randomPage}&include_adult=false&with_origin_country=US|AR|UY|ES|CO|PE|CL|VE|EC|BO|BR|MX|CR|PA|GT|HN|NI|SV|PR|DO`,
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    };
    try {
      const response = await axios.request(options);
      if (response.data && response.data.results) {
        aggregatedResults = aggregatedResults.concat(response.data.results);
      }
    } catch (error) {
      // Handle error
    }
  }
  return aggregatedResults;
}

async function getHomeData() {
  const respuesta = {};

  try {
    // Obtener datos populares
    const popularData = await fetchPopularData();
    respuesta.popularData = shuffleArray(popularData);
    respuesta.popularData.movies = limitArray(respuesta.popularData.movies, 20);
    respuesta.popularData.tvShows = limitArray(
      respuesta.popularData.tvShows,
      20
    );

    // Obtener películas y series
    const movies = await fetchMovies();
    respuesta.pelis = shuffleArray(movies);
    respuesta.pelis = limitArray(respuesta.pelis, 20);

    const series = await fetchSeries();
    respuesta.tvs = shuffleArray(series);
    respuesta.tvs = limitArray(respuesta.tvs, 20);

    // Obtener géneros específicos (ejemplo: Fantasía, Acción, etc.)
    const fantasyMovies = await searchByGenre("Fantasia", TMDB_API_KEY);
    const tvList = await fetchTvListHome(TMDB_API_KEY);
    const fantasySeries = tvList.find((tv) => tv.genre === "Sci-Fi & Fantasy");
    const mixedFantasy = fantasyMovies.concat(fantasySeries);
    respuesta.fantasiaPelis = shuffleArray(mixedFantasy);
    respuesta.fantasiaPelis = limitArray(respuesta.fantasiaPelis, 20);

    const actionMovies = await searchByGenre("Accion", TMDB_API_KEY);
    respuesta.accionPelis = shuffleArray(actionMovies);
    respuesta.accionPelis = limitArray(respuesta.accionPelis, 20);

    const comedyMovies = await searchByGenre("Comedia", TMDB_API_KEY);
    const comedySeries = tvList.find((tv) => tv.genre === "Comedia");
    const mixedComedy = comedyMovies.concat(comedySeries.results);
    respuesta.comediaPelis = shuffleArray(mixedComedy);
    respuesta.comediaPelis = limitArray(respuesta.comediaPelis, 20);

    const documentaries = tvList.find((tv) => tv.genre === "Documental");
    const warAndPolitics = tvList.find((tv) => tv.genre === "War & Politics");
    const mixedDocs = documentaries.results.concat(warAndPolitics.results);
    respuesta.docs = shuffleArray(mixedDocs);
    respuesta.docs = limitArray(respuesta.docs, 20);

    const horrorMovies = await searchByGenre("Terror", TMDB_API_KEY);
    const horrorSeries = tvList.find((tv) => tv.genre === "Crimen");
    const mixedHorror = horrorMovies.concat(horrorSeries.results);
    respuesta.horrorPelis = shuffleArray(mixedHorror);
    respuesta.horrorPelis = limitArray(respuesta.horrorPelis, 20);

    const adventureMovies = await searchByGenre("Aventura", TMDB_API_KEY);
    const adventureSeries = tvList.find(
      (tv) => tv.genre === "Action & Adventure"
    );
    const mixedAdventure = adventureMovies.concat(adventureSeries.results);
    respuesta.aventuraPelis = shuffleArray(mixedAdventure);
    respuesta.aventuraPelis = limitArray(respuesta.aventuraPelis, 20);

    return respuesta;
  } catch (error) {
    console.error("Error al obtener los datos del home:", error);
    throw new Error("Error interno del servidor");
  }
}

module.exports = {
  getMovieDetails,
  fetchMovies,
  fetchSeries,
  fetchGenres,
  getContentByGenre,
  getMovieOrSerieByTitle,
  getMovieById,
  getSerieById,
  getMovieTrailer,
  getSerieTrailer,
  getMovieProviders,
  getSerieProviders,
  getMovieCast,
  getSerieCast,
  getHomeData,
  getDiscoverMovies,
  getDiscoverSeries,
};
