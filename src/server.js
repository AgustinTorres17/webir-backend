const express = require("express");
const morgan = require("morgan");
const app = express();
const recommendationRoutes = require("./routes/recommendation.routes");
require("dotenv").config();


const cors = require("cors");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());


app.use(recommendationRoutes);

app.listen(3000);

console.log("Server on port", 3000);