const { Router } = require("express");
const axios = require("axios");
const router = Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const configModel =
  "Tu tarea es proporcionar una lista de títulos exactos de películas, series o programas de televisión en español. Esto es crucial porque el público es de habla hispana y los nombres en inglés no serán entendidos. Basándote en la descripción proporcionada por el usuario sobre lo que quiere ver o lo que le gusta, debes cumplir con los siguientes requisitos: Devuelve únicamente los nombres oficiales y exactos de las películas, series o programas de televisión. El formato debe ser un array de strings, donde cada string es el nombre de una película, serie o programa de televisión. Evita usar cualquier carácter especial que no esté presente en el nombre oficial y omite los números si están presentes.Si el usuario pide películas, proporciona títulos de películas; si pide series o programas de televisión, proporciona títulos de series o programas de televisión. Intenta proporcionar al menos 10 y no más de 20 nombres, siempre que sea posible. Si el usuario menciona una película o serie como ejemplo, los títulos que debes retornar deben ser de películas o series contemporáneas o relacionadas con la mencionada por el usuario. Por ejemplo, si un usuario describe que le gusta la ciencia ficción y las aventuras, tu respuesta debe ser un array de títulos que se ajusten a esa descripción. Este es el prompt del usuario: ";

const genAI = new GoogleGenerativeAI("AIzaSyAuYrl-PtzBQNJL-V61QAe-OHZhGwiaV6o");

const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

router.post("/generate", async (req, res) => {
  let { prompt } = req.body;
  //console.log(prompt);
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
    url: "https://api.themoviedb.org/3/discover/tv?include_video=false&language=es-ES&page=1&sort_by=popularity.desc",
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

router.get("/movie/:id", async (req, res) => {
  const { id } = req.params;
  const options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${id}?language=es-ES`,
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    console.log("voy por series");
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
      Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
    },
  };
  try {
    const response = await axios.request(options);
    return res.json(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}) 

router.get("/movie", async (req, res) => {
  try {
    let { movieTitle } = req.query;
    let options = {
      method: "GET",
      url: `https://api.themoviedb.org/3/search/movie?query=${movieTitle}&page=1&language=es-MX`,
      headers: {
        accept: "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
      },
    };

    const response = await axios.request(options);
    let results = response.data.results;

    // Si no hay resultados de películas, buscar series de TV
    options.url = `https://api.themoviedb.org/3/search/tv?query=${movieTitle}&page=1&language=es-MX`;
    const response2 = await axios.request(options);
    if (!response2.data.results.length) {
      return res.status(404).json({ message: "No se encontraron resultados" });
    }
    results = results.concat(response2.data.results.map((tvShow) => ({
      ...tvShow,
      title: tvShow.name,
    })));

    // Ordenar resultados por vote_average de forma descendente
    results.sort((a, b) => b.popularity - a.popularity);

    // Si hay más de 3 resultados, quedarnos solo con los 3 primeros
    if (results.length >= 3) {
      results = results.slice(0, 3);
    }

    /* console.log(results); */

    return res.json({ results });
  } catch (error) {
    console.error("Error al obtener detalles de la película:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/movie/cast/:movieId", async (req, res) => {
  const { movieId } = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/movie/${movieId}/credits?language=es-MX`,
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
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
  const {serieId}  = req.params;
  let options = {
    method: "GET",
    url: `https://api.themoviedb.org/3/tv/${serieId}/credits?language=es-MX`,
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwYmUzOTliYjZmZDY0NDMxYjNiYmUzNThiODUyODRjNyIsInN1YiI6IjY1OTA4ZDI2Y2U0ZGRjNmVkNTdkNWM2YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.hDyxnpPH2gk96U1Kl_8-53fAI5L47FiqJwjYzDyiqio",
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

router.post("/validate", async (req, res) => {
  const { recommendation, prompt } = req.body;
  if (!recommendation || !prompt) {
    return res.status(400).json({ message: "Faltan datos" });
  }
  const {title, year, genres} = recommendation;
  const promptFinal = `
  A continuación, te proporciono la prompt ingresada por el usuario junto con la recomendación obtenida. Necesito que verifiques si la recomendación es acorde a la prompt del usuario. Si la recomendación no coincide con los criterios especificados en la prompt del usuario, por favor, indícalo para poder corregirlo.
  
  Prompt del usuario: "${prompt}"
  
  Recomendación obtenida:
  - Título: "${title}"
  - Año: "${year}"
  - Géneros: "${genres.join(', ')}"
  
  Tu tarea es:
  1. Revisar si la recomendación proporcionada coincide exactamente con la descripción y los criterios mencionados en la prompt del usuario.
  2. Mantén en cuenta que el público es de habla hispana, por lo tanto, los nombres en inglés no serán entendidos.
  3. Basándote en la descripción proporcionada por el usuario sobre lo que quiere ver o lo que le gusta, verifica que la recomendación:
     - Sea de una película, serie o programa de televisión en español o con un nombre reconocido en español.
     - Cumpla con los géneros, temas o ejemplos mencionados por el usuario.
  
  Respuesta esperada: 
  - Si la recomendación es adecuada: "true"
  - Si la recomendación no es adecuada: "false"
  `;
  const result = await model.generateContent(promptFinal);
  const response = await result.response;
  // Extrae el texto de la respuesta
  console.log(response);
  const text = response?.candidates[0]?.content?.parts[0]?.text;
  res.send(text)
})

module.exports = router;
