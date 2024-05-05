const express = require("express");
const morgan = require("morgan");
const app = express();
const taskRoutes = require("./routes/task.routes");


app.use(morgan("dev"));
app.use(express.json());

app.use(taskRoutes);


app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(3000);


