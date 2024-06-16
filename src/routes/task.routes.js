const { Router } = require("express");
const axios = require("axios");
const compromise = require("compromise");
const natural = require("natural");
const router = Router();
const leven = require("fast-levenshtein");
require("dotenv").config();

const TMDB_API_KEY = process.env.TMDB_KEY;
const GOOGLE_KEY = process.env.GOOGLE_KEY;
const GOOGLE_AUX_KEY = process.env.GOOGLE_AUX_KEY;

const { GoogleGenerativeAI } = require("@google/generative-ai");

var promptGlobal = "";

const configModel = `
Tu tarea es proporcionar una lista de títulos exactos de películas, series o programas de televisión en español. Esto es crucial porque el público es de habla hispana y los nombres en inglés no serán entendidos. Basándote en la descripción proporcionada por el usuario sobre lo que quiere ver o lo que le gusta, debes cumplir con los siguientes requisitos:
- Devuelve únicamente los nombres oficiales y exactos de las películas, series o programas de televisión.
- Evita usar cualquier carácter especial que no esté presente en el nombre oficial y omite los números si están presentes.
- Si el usuario pide películas, proporciona títulos de películas; si pide series o programas de televisión, proporciona títulos de series o programas de televisión.
- Intenta proporcionar la mayor cantidad de nombres, con un mínimo de 15 y un máximo de 25. Esto es muy importante porque el usuario necesita opciones para elegir.
- Si el usuario menciona una película o serie como ejemplo, los títulos que debes retornar deben ser de películas o series contemporáneas o relacionadas con la mencionada por el usuario.
La respuesta debe ser un arreglo de strings con los nombres de las películas, series o programas de televisión. Cada nombre debe estar entre comillas dobles y separado por comas. Omite cualquier otro tipo de información adicional. Solamente los nombres.`;

const genAI = new GoogleGenerativeAI(`${GOOGLE_KEY}`);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generation_config: "application/json",
});

const tv_genres = [
  {
    id: 10759,
    name: "Action & Adventure",
  },
  {
    id: 16,
    name: "Animación",
  },
  {
    id: 35,
    name: "Comedia",
  },
  {
    id: 80,
    name: "Crimen",
  },
  {
    id: 99,
    name: "Documental",
  },
  {
    id: 18,
    name: "Drama",
  },
  {
    id: 10751,
    name: "Familia",
  },
  {
    id: 10762,
    name: "Kids",
  },
  {
    id: 9648,
    name: "Misterio",
  },
  {
    id: 10763,
    name: "News",
  },
  {
    id: 10764,
    name: "Reality",
  },
  {
    id: 10765,
    name: "Sci-Fi & Fantasy",
  },
  {
    id: 10766,
    name: "Soap",
  },
  {
    id: 10767,
    name: "Talk",
  },
  {
    id: 10768,
    name: "War & Politics",
  },
  {
    id: 37,
    name: "Western",
  },
];

const movie_genres = [
  {
    id: 28,
    name: "Acción",
  },
  {
    id: 12,
    name: "Aventura",
  },
  {
    id: 16,
    name: "Animación",
  },
  {
    id: 35,
    name: "Comedia",
  },
  {
    id: 80,
    name: "Crimen",
  },
  {
    id: 99,
    name: "Documental",
  },
  {
    id: 18,
    name: "Drama",
  },
  {
    id: 10751,
    name: "Familia",
  },
  {
    id: 14,
    name: "Fantasía",
  },
  {
    id: 36,
    name: "Historia",
  },
  {
    id: 27,
    name: "Terror",
  },
  {
    id: 10402,
    name: "Música",
  },
  {
    id: 9648,
    name: "Misterio",
  },
  {
    id: 10749,
    name: "Romance",
  },
  {
    id: 878,
    name: "Ciencia ficción",
  },
  {
    id: 10770,
    name: "Película de TV",
  },
  {
    id: 53,
    name: "Suspense",
  },
  {
    id: 10752,
    name: "Bélica",
  },
  {
    id: 37,
    name: "Western",
  },
];

const genreEquivalents = [
  {
    name: "Action & Adventure",
    equivalents: [
      "Acción",
      "Aventura",
      "Superheroes",
      "Heroica",
      "Epica",
      "Batallas",
      "Epicas",
    ],
  },
  {
    name: "Animation",
    equivalents: [
      "Animación",
      "Animada",
      "Infantil",
      "Dibujos animados",
      "Dibujos",
      "Dibujo",
      "Dibujada",
      "Dibujadas",
      "Dibujado",
      "Dibujados",
      "Disney",
      "Pixar",
      "Dreamworks",
      "Animé",
      "Anime",
      "Cartoon",
      "Cartoons",
      "Superheroes",
      "Animacion 3D",
    ],
  },
  {
    name: "Comedia",
    equivalents: [
      "Comedy",
      "Divertida",
      "Graciosa",
      "Risas",
      "Cómica",
      "Humor",
      "Humorística",
      "Divertidas",
      "Graciosas",
      "Cómicas",
      "Humorísticas",
      "Divertidos",
      "Graciosos",
      "Cómicos",
      "Humorísticos",
      "Parodia",
      "Satira",
      "Burlesca",
    ],
  },
  {
    name: "Crimen",
    equivalents: [
      "Crime",
      "Policial",
      "Detective",
      "Investigación",
      "Investigativa",
      "Investigativo",
      "Investigativos",
      "Investigativas",
      "Policíaca",
      "Policíaco",
      "Policíacas",
      "Policíacos",
      "Policiales",
      "Policíacos",
      "Detectives",
      "Criminal",
      "Criminales",
      "Criminalistica",
      "Crimen Real",
      "Thriller Policial",
      "Noir",
    ],
  },
  {
    name: "Documental",
    equivalents: [
      "Documentary",
      "Documentales",
      "Documentales de",
      "Documentales sobre",
      "Documentales acerca de",
      "Docudrama",
      "Biografia",
      "Autobiografica",
      "Autobigrafia",
      "Naturalista",
      "Autobiografias",
    ],
  },
  {
    name: "Mystery",
    equivalents: [
      "Misterio",
      "Intriga",
      "Enigma",
      "Enigmas",
      "Misteriosa",
      "Misteriosas",
      "Misterioso",
      "Misteriosos",
      "Intrigante",
      "Intrigantes",
      "Enigmática",
      "Enigmáticas",
      "Enigmático",
      "Enigmáticos",
      "Thriller",
      "Investigacion Paranormal",
    ],
  },
  {
    name: "Reality",
    equivalents: ["Competicion", "Docu-reality", "Telerrealidad"],
  },
  {
    name: "Fantasy",
    equivalents: [
      "Fantasía",
      "Fantasia",
      "fantasia",
      "Fantasiosa",
      "Fantasías",
      "Fantasiosas",
      "Fantasioso",
      "Fantasiosos",
      "Fantástica",
      "Fantásticas",
      "Fantástico",
      "Fantasía épica",
      "Fantasías épicas",
      "Fantasía medieval",
      "Fantasías medievales",
      "Fantasía oscura",
      "Fantasías oscuras",
      "Fantasía urbana",
      "Fantasías urbanas",
      "Fantasía de",
      "Fantasías de",
      "Superheroes",
      "Ficcion magica",
      "Cuento de hadas",
      "Cuentos de hadas",
      "Fantasia heroica",
      "Magos",
      "Hechiceros",
    ],
  },
  {
    name: "War & Politics",
    equivalents: [
      "Bélica",
      "Bélicas",
      "Bélico",
      "Bélicos",
      "Guerra",
      "Guerras",
      "Política",
      "Políticas",
      "Político",
      "Políticos",
      "Guerra y política",
      "Guerras y política",
      "Guerra y político",
      "Guerras y político",
      "Bélica y política",
      "Bélicas y política",
      "Bélico y político",
      "Bélicos y político",
      "Guerra mundial",
      "Guerra fria",
      "Guerras mundiales",
      "Conflicto belico",
      "Thriller politico",
    ],
  },
  {
    name: "Horror",
    equivalents: [
      "Terror",
      "Terrorífica",
      "Terroríficas",
      "Terrorífico",
      "Terroríficos",
      "Horror",
      "Horrorífica",
      "Horroríficas",
      "Horrorífico",
      "Horroríficos",
      "Horrorosa",
      "Horrorosas",
      "Horroroso",
      "Horrorosos",
      "Miedo",
      "Sobrenatural",
      "Sobrenaturales",
      "Gore",
      "Slasher",
    ],
  },
  {
    name: "Thriller",
    equivalents: [
      "Suspense",
      "Terror",
      "Terrorífica",
      "Terroríficas",
      "Terrorífico",
      "Terroríficos",
      "Horror",
      "Horrorífica",
      "Horroríficas",
      "Horrorífico",
      "Horroríficos",
      "Horrorosa",
      "Horrorosas",
      "Horroroso",
      "Horrorosos",
      "Suspenso",
      "Miedo",
    ],
  },
  {
    name: "Drama",
    equivalents: ["Drama", "Melodrama", "Tragedia", "Dramedia"],
  },
  {
    name: "Family",
    equivalents: [
      "Familia",
      "Familiar",
      "Familias",
      "Familiares",
      "Infantil",
      "Infantiles",
      "Niños",
      "Niñas",
      "Niñez",
      "Infancia",
      "Infantilidad",
      "Infantilidades",
      "Familiaridad",
      "Familiaridades",
      "Familiarismo",
      "Familiarismos",
      "Familiaridad",
      "Familiaridades",
      "Familiera",
      "Familieras",
      "Pelicula familiar",
      "Peliculas familiares",
      "Comedia familiar",
      "Aventura familiar",
    ],
  },
  {
    name: "History",
    equivalents: [
      "Historia",
      "Histórica",
      "Históricas",
      "Histórico",
      "Históricos",
    ],
  },
  { name: "Music", equivalents: ["Música", "Musical", "Opera", "Concierto"] },
  { name: "Romance", equivalents: ["Romance", "Amor", "Amorosa"] },
  {
    name: "Sci-Fi & Fantasy",
    equivalents: [
      "Ciencia ficción",
      "Ficción",
      "Ciencia",
      "Futurista",
      "Futuristas",
      "Futurístico",
      "Futurísticos",
      "Futurística",
      "Futurísticas",
      "Futurismo",
      "Futurismos",
      "Superheroes",
      "Espacial",
    ],
  },
  { name: "TV Movie", equivalents: ["Película de TV", "Miniserie"] },
  {
    name: "Western",
    equivalents: [
      "Western",
      "Oeste",
      "Viejo Oeste",
      "Vaqueros",
      "Vaquero",
      "Cowboy",
      "Cowboys",
      "Cowgirl",
      "Cowgirls",
    ],
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

//Leer el prompt del usuario y generar recomendaciones
router.post("/generate", async (req, res) => {
  let { prompt } = req.body;
  /* console.log(prompt); */
  promptGlobal = prompt;
  if (!prompt)
    return res.status(400).json({ message: "No se proporcionó un prompt" });

  prompt = configModel + prompt;
  try {
    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response?.candidates[0]?.content?.parts[0]?.text;

    if (!text)
      return res.status(500).json({ message: "No se pudo generar el texto" });

    try {
      const movieNamesArray = JSON.parse(text); // Parsear el JSON
      const movieNames = movieNamesArray
        .map((name) => name.trim().replace(/,$/, "").replace(/^"|"$/, ""))
        .filter((name) => name); // Eliminar elementos vacíos
      /* console.log(movieNames); */
      res.json(movieNames);
    } catch (error) {
      /* console.log(text); */
      /* console.error("Error al parsear el texto:", error); */
      /* console.log(error); */
      res.status(500).json({ message: text });
    }
  } catch (error) {
    /* console.error("Error al generar contenido:", error); */
    return res.status(500).json({ message: "Error al generar contenido" });
  }
});

router.get("/", async (req, res) => {
  res.send("Working");
});

function getGenreName(genreIds) {
  if (genreIds.length === 0) return [];
  const genres = movie_genres.concat(tv_genres);
  let genresNames = [];
  for (let i = 0; i < genreIds.length; i++) {
    const genre = genres.find((g) => g.id === genreIds[i]);
    if (genre) genresNames.push(genre.name);
  }
  return genresNames;
}

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
    /* console.error("Error fetching genre ID:", error); */
    return null;
  }
}

// Función para buscar películas y series por género
async function searchByGenre(genreName) {
  const genreId = await getGenreId(genreName);
  /*  console.log(genreId); */
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
    /* console.error(error); */
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
    /* console.error(error); */
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
      /* console.error("Error al obtener las películas:", error); */
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
      /* console.error("Error al obtener las series:", error); */
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
      /* console.error("Error al obtener las películas por género:", error); */
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
      /* console.error("Error al obtener detalles de la película:", error); */
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
    /* console.error("Error al obtener detalles de la película:", error); */
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/movie2", async (req, res) => {
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

    return res.json({ results: results });
  } catch (error) {
    /* console.error("Error al obtener detalles de la película:", error); */
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Funcion para fetchear peliculas y series por titulo
router.get("/movie", async (req, res) => {
  try {
    let { movieTitle } = req.query;

    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?query=${movieTitle}&page=1&language=es-MX`,
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    };

    const response = await axios.request(options);
    let results = response.data.results;

    // Function to get cast for a specific result
    const getCast = async (result) => {
      try {
        let options = {
          method: "GET",
          url: `https://api.themoviedb.org/3/movie/${result.id}/credits?language=es-ES`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const response = await axios.request(options);
        result.cast = response.data.cast
          .slice(0, 10)
          .map((actor) => actor.name);
        return result;
      } catch (error) {
        result.cast = [];
        return result;
      }
    };

    // Get cast for all movie results
    results = await Promise.all(
      results.map(async (movie) => {
        const data = await getCast(movie);
        movie.cast = data.cast;
        return movie;
      })
    );

    // Get TV shows
    options.url = `https://api.themoviedb.org/3/search/tv?query=${movieTitle}&page=1&language=es-ES`;
    const response2 = await axios.request(options);
    let tvResults = response2.data.results;

    const getTvCast = async (result) => {
      try {
        let options = {
          method: "GET",
          url: `https://api.themoviedb.org/3/tv/${result.id}/credits?language=es-ES`,
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        };
        const response = await axios.request(options);
        result.cast = response.data.cast
          .slice(0, 10)
          .map((actor) => actor.name);
        return result;
      } catch (error) {
        result.cast = [];
        return result;
      }
    };

    tvResults = await Promise.all(
      tvResults.map(async (tvShow) => {
        const data = await getTvCast(tvShow);
        tvShow.cast = data.cast;
        return tvShow;
      })
    );

    // Combine results
    results = results.concat(
      tvResults.map((tvShow) => ({
        ...tvShow,
        title: tvShow.name,
        year: tvShow.first_air_date?.split("-")[0],
      }))
    );

    // Filter results
    let resultsCorrected = results.filter((result) => {
      return (
        result.overview.length > 30 &&
        result.poster_path != null &&
        result.vote_average > 1
      );
    });

    resultsCorrected.sort((a, b) => b.popularity - a.popularity);

    const resSeparados = resultsCorrected.slice(0, 5);

    return res.json({ results: resSeparados });
  } catch (error) {
    /* console.error("Error al obtener detalles de la película:", error); */
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

router.get("/movie/trailer/:movieId", async (req, res) => {
  const { movieId } = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-EN`,
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

router.get("/serie/trailer/:serieId", async (req, res) => {
  const { serieId } = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${serieId}/videos?language=en-EN`,
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
    /* console.error("Error al obtener detalles de la película:", error); */
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

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

const removeSpaces = (text) => text.replace(/\s+/g, "").trim();

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
};

// Función para extraer palabras clave
const stopwords = [
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "y",
  "a",
  "que",
  "en",
  "es",
  "por",
  "con",
  "para",
  "o",
  "serie",
  "series",
  "peliculas",
  "pelicula",
  "como",
  "actue",
  "este",
  "protagonizada",
  "favorito",
  "protagonizado",
  "sea",
  "protagonista",
  "son",
];

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
  return text
    .split(regex)
    .filter(
      (word) => !stopwords.includes(normalizeText(word)) && word.trim() !== ""
    );
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
  console.log("Extracted Keywords:", filteredKeywords);
  return filteredKeywords.map((keyword) => keyword.toLowerCase());
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

  const convertedKeywords = keywords
    .map((keyword) => {
      const normalizedKeyword = normalizeText(removeSpaces(keyword));
      for (const normalizedEquivalent in genreMapping) {
        if (leven.get(normalizedEquivalent, normalizedKeyword) <= 2) {
          return genreMapping[normalizedEquivalent];
        }
      }
      return [keyword];
    })
    .flat();

  /* console.log("Converted Keywords to Genres:", convertedKeywords); */
  return convertedKeywords;
};

// Modificación de la función isGenreInPrompt
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

  // Verifica si alguno de los géneros normalizados está en las palabras clave
  const keywordInGenres = normalizedKeywords.some((keyword) =>
    normalizedGenres.some((genre) => {
      const distance = leven.get(genre, keyword);
      return distance <= Math.min(genre.length, keyword.length) / 3;
    })
  );

  return keywordInGenres;
};

// Función para validar recomendaciones usando Cosine Similarity
async function validateRecommendations(recommendations, prompt) {
  if (!recommendations || recommendations.length === 0) return [];
  const promptNormalized = normalizeText(prompt);
  let promptKeywords = getKeywords(promptNormalized, true);
  /* console.log("Prompt Keywords:", promptKeywords); */

  const filteredByActor = recommendations.filter((rec) => {
    if (!rec || !rec.cast || rec.cast.length === 0) return false;
    /* console.log("Checking Actor in:", rec.title, rec.cast); */
    if (isPersonInPrompt(rec.cast, promptKeywords)) {
      return true;
    }
  });
  console.log("Filtered by Actor:", filteredByActor.length);

  if (filteredByActor.length > 0) return filteredByActor;
  promptKeywords = getKeywords(promptNormalized, false);
  const filteredByGenre = recommendations.filter((rec) => {
    if (!rec || rec.overview.length < 30) return false;
    const genres_ids = rec.genre_ids;
    const genres = getGenreName(genres_ids);
    if (!genres || genres.length === 0) return false;
    /* console.log("Checking Genre in:", rec.title, genres); */
    return isGenreInPrompt(genres, promptKeywords);
  });
  console.log("Filtered by Genre:", filteredByGenre.length);

  if (filteredByGenre.length > 0) return filteredByGenre;

  return recommendations;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

router.post("/validate", async (req, res) => {
  const { recommendations, prompt } = req.body;
  console.log(prompt);
  /* console.log("llamaron validar"); */
  const uniqueRecommendations = [...new Set(recommendations)];

  const validatedRecommendations = await validateRecommendations(
    uniqueRecommendations,
    prompt
  );
  const sortedRecommendations = validatedRecommendations
    .filter((rec) => rec.cast.length > 1)
    .filter((rec) => rec.overview.length > 30);
  const finalRecommendations = sortedRecommendations.sort(
    (a, b) => b.popularity - a.popularity
  );
  /* console.log(finalRecommendations.map((rec) => rec.title)); */
  res.json({ results: finalRecommendations });
});

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
    /* console.error("Error al obtener detalles de la película:", error); */
    res
      .status(500)
      .json({ message: "Error al obtener detalles de la película" });
  }
});

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
    const fantasySeries = tvList.find((tv) => tv.genre === "Sci-Fi & Fantasy");
    const mixedFantasy = fantasyMovies.concat(fantasySeries.results);
    respuesta.fantasiaPelis = shuffleArray(mixedFantasy);
    const actionMovies = await searchByGenre("Action");
    respuesta.accionPelis = actionMovies;
    const comedyMovies = await searchByGenre("Comedy");
    const comedySeries = tvList.find((tv) => tv.genre === "Comedia");
    const mixedComedy = comedyMovies.concat(comedySeries.results);
    respuesta.comediaPelis = shuffleArray(mixedComedy);
    const documentaries = tvList.find((tv) => tv.genre === "Documental");
    const warAndPolitics = tvList.find((tv) => tv.genre === "War & Politics");
    const mixedDocs = documentaries.results.concat(warAndPolitics.results);
    respuesta.docs = shuffleArray(mixedDocs);
    const horrorMovies = await searchByGenre("Horror");
    const horrorSeries = tvList.find((tv) => tv.genre === "Crimen");
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
    /* console.error("Error al obtener los datos del home", error); */
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;
