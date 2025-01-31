const express = require("express");
const router = express.Router();
const cors = require("cors");
const PORT = 8000;

const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/auth', require('./routes/authRoute'));

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
