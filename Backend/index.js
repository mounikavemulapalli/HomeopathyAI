const express = require("express");
const cors = require("cors");

const analyzeRouter = require("./routes/analyzeRoutes");
const repertoryRouter = require("./routes/repertoryRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", analyzeRouter);
app.use("/api", repertoryRouter);

app.listen(5000, () => {
  console.log("Node.js backend running on http://localhost:5000");
});
