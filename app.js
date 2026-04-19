require("dotenv").config();
const express = require("express");
const path = require("path");
const DatabaseConnection = require("./app/config/dbcon");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const RateLimit = require("./app/utils/limiter");

const app = express();

//database connection
DatabaseConnection();

app.use(morgan("dev"));
app.use(helmet());
app.use(RateLimit);
app.use(cors());
//define json
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//static files
app.use(express.static(path.join(__dirname, "public")));

//define routes
app.use(require("./app/routes/index"));

const port = 3004;
app.listen(port, () => {
  console.log("server is running on port", port);
});
