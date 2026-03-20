let users = {};

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {

  // 🔥 USER JOIN
  socket.on("join", (username) => {
    socket.username = username;

    // store user
    users[socket.id] = username;

    console.log(username + " joined");

    // 🔥 send updated user list to everyone
    io.emit("userList", Object.values(users));
  });

  // 🔥 JOIN ROOM
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(socket.username + " joined room: " + roomId);
  });

  // 🔥 CHAT MESSAGE
  socket.on("chat message", async ({ msg, roomId }) => {

    if (!msg || msg.trim() === "") return;

    try {
      const translated = await translateMessage(msg);

      io.to(roomId).emit("chat message", {
        user: socket.username || "Anonymous",
        original: msg,
        translated: translated || msg,
        suggestion: "AI disabled"
      });

    } catch (error) {
      console.error("Chat Error:", error.message);

      socket.emit("chat message", {
        user: socket.username || "Anonymous",
        original: msg,
        translated: "Error occurred",
        suggestion: "Try again"
      });
    }
  });

  // 🔥 USER DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // remove user
    delete users[socket.id];

    // update list
    io.emit("userList", Object.values(users));
  });
});

// Translation function
async function translateMessage(text) {
  try {
    const res = await axios.post(
      "https://libretranslate.de/translate",
      {
        q: text,
        source: "auto",
        target: "en",
        format: "text"
      }
    );

    return res.data.translatedText || text;

  } catch (err) {
    console.error("Translation API Error:", err.message);
    return text;
  }
}

app.use(express.static("public"));

server.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});