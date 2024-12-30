const express = require("express");
const morgan = require("morgan");
const app = express();
const recommendationRoutes = require("./routes/recommendation.routes");
require("dotenv").config();
const SERVER_PORT = process.env.SERVER_PORT || 3000;

const cors = require("cors");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());


app.use(recommendationRoutes);

app.listen(SERVER_PORT);

console.log("Server on port", SERVER_PORT);