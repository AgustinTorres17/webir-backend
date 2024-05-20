const express = require("express");
const morgan = require("morgan");
const app = express();
const taskRoutes = require("./routes/task.routes");
require("dotenv").config();

const cors = require("cors");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(taskRoutes);

app.listen(3000);
