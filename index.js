const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { readdirSync } = require("fs");
const http = require("http");

const app = express();
const server = http.createServer(app);
// const io = require("socket.io")(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// app.set("io", io);

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// io.on("connection", (socket) => {
//   console.log("user connected");
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

readdirSync("./Routes").map((r) => app.use(require("./Routes/" + r)));

server.listen(3000, () => console.log("Server is running on port 3000"));