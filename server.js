const express = require("express");
const app = express();
const morgan = require("morgan");

app.use(morgan("dev"));
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(3000);


