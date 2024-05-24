const { Router } = require("express");
const axios = require("axios");
const router = Router();
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_KEY;
const GOOGLE_KEY = process.env.GOOGLE_KEY;
const GOOGLE_AUX_KEY = process.env.GOOGLE_AUX_KEY;

const { GoogleGenerativeAI } = require("@google/generative-ai");

const configModel =
  "Tu tarea es proporcionar una lista de títulos exactos de películas, series o programas de televisión en español. Esto es crucial porque el público es de habla hispana y los nombres en inglés no serán entendidos. Basándote en la descripción proporcionada por el usuario sobre lo que quiere ver o lo que le gusta, debes cumplir con los siguientes requisitos: Devuelve únicamente los nombres oficiales y exactos de las películas, series o programas de televisión. El formato debe ser un array de strings, donde cada string es el nombre de una película, serie o programa de televisión. Evita usar cualquier carácter especial que no esté presente en el nombre oficial y omite los números si están presentes.Si el usuario pide películas, proporciona títulos de películas; si pide series o programas de televisión, proporciona títulos de series o programas de televisión. Intenta proporcionar al menos 10 y no más de 20 nombres, siempre que sea posible. Si el usuario menciona una película o serie como ejemplo, los títulos que debes retornar deben ser de películas o series contemporáneas o relacionadas con la mencionada por el usuario. Por ejemplo, si un usuario describe que le gusta la ciencia ficción y las aventuras, tu respuesta debe ser un array de títulos que se ajusten a esa descripción. Este es el prompt del usuario: ";

const genAI = new GoogleGenerativeAI(`${GOOGLE_KEY}`);

const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

const tv_genres = [
  {
    id: 10759,
    name: "Action & Adventure",
  },
  {
    id: 16,
    name: "Animation",
  },
  {
    id: 35,
    name: "Comedy",
  },
  {
    id: 80,
    name: "Crime",
  },
  {
    id: 99,
    name: "Documentary",
  },
  {
    id: 9648,
    name: "Mystery",
  },
  {
    id: 10764,
    name: "Reality",
  },
  {
    id: 10765,
    name: "Fantasy",
  },
  {
    id: 10768,
    name: "War & Politics",
  },
];

const fetchTvListHome = async () => {
  const tvList = await Promise.all(
    tv_genres.map(async (genre) => {
      const options = {
        method: "GET",
        url: `https://api.themoviedb.org/3/discover/tv?with_genres=${genre.id}&include_adult=false&language=es-ES&page=1&sort_by=popularity.desc`,
        headers: {
          accept: "application/json",
          Authorization: "Bearer " + TMDB_API_KEY,
        },
      };
      const response = await axios.request(options);
      return {
        genre: genre.name,
        results: response.data.results,
      };
    })
  );
  return tvList;
};

const fetchTvByGenre = async (genre) => {
  const genreId = tv_genres.find((g) =>
    g.name.toLowerCase().trim().includes(genre.toLowerCase())
  )?.id;
  if (!genreId) return [];
  let seriesGenre = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/tv?with_genres=${genreId}&include_adult=false&language=es-ES&page=${number}&sort_by=popularity.desc`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    const response = await axios.request(options);
    seriesGenre = seriesGenre?.concat(response.data.results);
  }
  return seriesGenre;
};

router.post("/generate", async (req, res) => {
  let { prompt } = req.body;

  if (!prompt)
    return res.status(400).json({ message: "No se proporcionó un prompt" });
  prompt = configModel + prompt;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  // Extrae el texto de la respuesta
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

// Función para obtener el ID del género
async function getGenreId(genreName) {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/genre/movie/list`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      }
    );
    const genres = response.data.genres;
    const genre = genres.find(
      (g) => g.name.toLowerCase() === genreName.toLowerCase()
    );
    return genre ? genre.id : null;
  } catch (error) {
    console.error("Error fetching genre ID:", error);
    return null;
  }
}

// Función para buscar películas y series por género
async function searchByGenre(genreName) {
  const genreId = await getGenreId(genreName);

  const maxPages = 4; // Número máximo de páginas a obtener
  let movieResults = [];

  try {
    for (let page = 1; page <= maxPages; page++) {
      const movieOptions = {
        method: "GET",
        url: `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&include_adult=false&include_video=false&language=es-MX&page=${page}`,
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      };

      const movieResponse = await axios.request(movieOptions);
      movieResults = movieResults.concat(movieResponse.data.results);
    }
    return movieResults;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const fetchPopularData = async () => {
  const movieOptions = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const tvOptions = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/tv?include_adult=false&language=es-ES&page=1&sort_by=popularity.desc",
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
    console.error(error);
    return null;
  }
};

router.get("/movies", async (req, res) => {
  let moviesResp = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=${number}&sort_by=popularity.desc`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    try {
      const response = await axios.request(options);
      moviesResp = moviesResp.concat(response.data.results);
    } catch (error) {
      console.error("Error al obtener las películas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
  moviesResp = shuffleArray(moviesResp);
  res.json(moviesResp);
});

router.get("/series", async (req, res) => {
  let seriesResp = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/tv?include_video=false&language=es-ES&page=${number}&sort_by=popularity.desc`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    try {
      const response = await axios.request(options);
      seriesResp = seriesResp.concat(response.data.results);
    } catch (error) {
      console.error("Error al obtener las series:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
  seriesResp = shuffleArray(seriesResp);
  res.json(seriesResp);
});

const fetchMovies = async () => {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  const response = await axios.request(options);
  return response.data.results;
};

const fetchSeries = async () => {
  const options = {
    method: "GET",
    url: "https://api.themoviedb.org/3/discover/tv?include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const response = await axios.request(options);
  const series = response.data.results.map((series) => ({
    ...series,
    release_date: series.first_air_date,
    title: series.name,
  }));
  return series;
};

router.get("/genres", async (req, res) => {
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/genre/movie/list?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };

  const response = await axios.request(options);
  res.json(response.data);
});

router.get("/genre", async (req, res) => {
  const { genre } = req.query;
  const genreId = await getGenreId(genre);
  let respuesta = [];
  let numbers = [];
  for (let i = 1; i <= 5; i++) {
    let number = Math.floor(Math.random() * 70) + 1;
    while (numbers.includes(number)) {
      number = Math.floor(Math.random() * 70) + 1;
    }
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&include_adult=false&include_video=false&language=es-ES&page=${number}&sort_by=popularity.desc`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
      },
    };
    try {
      const response = await axios.request(options);
      respuesta = respuesta?.concat(response.data.results);
    } catch (error) {
      console.error("Error al obtener las películas por género:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
  const seriesGenre = await fetchTvByGenre(genre);
  respuesta = shuffleArray(respuesta?.concat(seriesGenre));
  respuesta = respuesta.filter(
    (result) => result.overview && result.overview.trim() !== ""
  );
  res.json(respuesta);
});

router.get("/movie/:id", async (req, res) => {
  const { id } = req.params;
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${id}?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    options.url = `https://api.themoviedb.org/3/tv/${id}?language=es-MX`;
    try {
      const response2 = await axios.request(options);
      if (!response2) {
        return res
          .status(404)
          .json({ message: "No se encontraron resultados" });
      }
      response2.data.title = response2.data.name;
      return res.json(response2.data);
    } catch (error) {
      console.error("Error al obtener detalles de la película:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
});

router.get("/serie/:id", async (req, res) => {
  const { id } = req.params;
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${id}?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/movie", async (req, res) => {
  try {
    let { movieTitle } = req.query;
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

    results = results.concat(
      response2.data.results.map((tvShow) => ({
        ...tvShow,
        title: tvShow.name,
      }))
    );

    results = results.filter(
      (result) => result.overview && result.overview.trim() !== ""
    );

    // Ordenar resultados por vote_average de forma descendente
    results.sort((a, b) => b.popularity - a.popularity);

    // Si hay más de 3 resultados, quedarnos solo con los 3 primeros
    if (results.length > 3) {
      results = results.slice(0, 3);
    }

    const validatedResults = await validateRecommendations(results, movieTitle);

    const finalResults = results.filter((_, index) => validatedResults[index]);

    return res.json({ results: finalResults });
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/movie/cast/:movieId", async (req, res) => {
  const { movieId } = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${movieId}/credits?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

router.get("/serie/cast/:serieId", async (req, res) => {
  const { serieId } = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${serieId}/credits?language=es-MX`,
    headers: {
      accept: "application/json",
      Authorization: "Bearer " + TMDB_API_KEY,
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

router.get("/movie-providers", async (req, res) => {
  try {
    const { movieId } = req.query;
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/movie/${movieId}/watch/providers`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateContentWithRetries = async (
  model,
  prompt,
  maxRetries = 2,
  backoff = 400
) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      if (error.status === 429) {
        attempts++;
        await sleep(backoff * attempts); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

const validateRecommendations = async (recommendations, prompt) => {
  const promptFinal = recommendations
    .map((recommendation) => {
      let { title, year, overview } = recommendation;

      title = title || "-";
      year = year || "-";
      overview = overview || "-";

      return `
      Prompt del usuario: "${prompt}"
      Recomendación obtenida:
      - Título: "${title}"
      - Año: "${year}"
      - Sinópsis: "${overview}"
    `;
    })
    .join("\n");

  const promptComplete = `
    A continuación, te proporciono la prompt ingresada por el usuario junto con las recomendaciones obtenidas. Necesito que verifiques si cada recomendación es acorde a la prompt del usuario.
    ${promptFinal}
    Tu tarea es:
    1. Revisar si cada recomendación proporcionada coincide exactamente con la descripción y los criterios mencionados en la prompt del usuario.
    2. Mantén en cuenta que el público es de habla hispana, por lo tanto, los nombres en inglés no serán entendidos.
    3. Ten en cuenta el año y la sinópsis de cada recomendación para verificar si se ajusta a los criterios mencionados por el usuario. Si el año no corresponde con la película o la sinópsis no coincide con los géneros o temas mencionados por el usuario, la recomendación no es adecuada.
    Respuesta esperada: 
    - Si la recomendación es adecuada: "true"
    - Si la recomendación no es adecuada: "false"
    - Si no estás seguro: "false"
    No respondas otra información adicional, solo "true", "false".
  `;

  try {
    const result = await generateContentWithRetries(model, promptComplete);
    const response = await result?.response;

    if (!response) {
      throw new Error("Error al consultar a la IA");
    }

    const text = response?.candidates[0]?.content?.parts[0]?.text;
    if (!text) throw new Error("No se pudo generar el texto");

    const validatedResults = text
      ?.split("\n")
      .map((line) => line.includes("true"));
    return validatedResults;
  } catch (error) {
    throw new Error("Error al consultar a la IA: " + error.message);
  }
};

router.get("/serie-providers", async (req, res) => {
  try {
    const { serieId } = req.query;
    const options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/tv/${serieId}/watch/providers`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + TMDB_API_KEY,
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

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

router.get("/get-data-home", async (req, res) => {
  const respuesta = {};
  try {
    const popularData = await fetchPopularData();
    respuesta.popularData = shuffleArray(popularData);
    const movies = await fetchMovies();
    respuesta.pelis = shuffleArray(movies);
    const series = await fetchSeries();
    respuesta.tvs = shuffleArray(series);
    const fantasyMovies = await searchByGenre("Fantasy");
    const tvList = await fetchTvListHome();
    const fantasySeries = tvList.find((tv) => tv.genre === "Fantasy");
    const mixedFantasy = fantasyMovies.concat(fantasySeries.results);
    respuesta.fantasiaPelis = shuffleArray(mixedFantasy);
    const actionMovies = await searchByGenre("Action");
    respuesta.accionPelis = actionMovies;
    const comedyMovies = await searchByGenre("Comedy");
    const comedySeries = tvList.find((tv) => tv.genre === "Comedy");
    const mixedComedy = comedyMovies.concat(comedySeries.results);
    respuesta.comediaPelis = shuffleArray(mixedComedy);
    const documentaries = tvList.find((tv) => tv.genre === "Documentary");
    const warAndPolitics = tvList.find((tv) => tv.genre === "War & Politics");
    const mixedDocs = documentaries.results.concat(warAndPolitics.results);
    respuesta.docs = shuffleArray(mixedDocs);
    const horrorMovies = await searchByGenre("Horror");
    const horrorSeries = tvList.find((tv) => tv.genre === "Crime");
    const mixedHorror = horrorMovies.concat(horrorSeries.results);
    respuesta.horrorPelis = shuffleArray(mixedHorror);
    const adventureMovies = await searchByGenre("Adventure");
    const adventureSeries = tvList.find(
      (tv) => tv.genre === "Action & Adventure"
    );
    const mixedAdventure = adventureMovies.concat(adventureSeries.results);
    respuesta.aventuraPelis = shuffleArray(mixedAdventure);
    res.json(respuesta);
  } catch (error) {
    console.error("Error al obtener los datos del home");
  }
});

module.exports = router;
