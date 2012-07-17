var express = require("express");
var http = require("http");

var app = express();
app.configure(function() {
  app.use(express.static(__dirname + "/public"));
});
var server = http.createServer(app)

var io = require("socket.io").listen(server);
var nicknames = {};
io.sockets.on("connection", function(socket) {
  socket.on("nickname", function(nickname, fn) {
    old_nickname = socket.nickname;
    if (!nickname) {
      fn("Empty nickname");
      return;
    }
    if (nicknames[nickname]) {
      fn("Nickname already taken");
      return;
    }
    nicknames[nickname] = socket.nickname = nickname;
    if (old_nickname) {
      delete nicknames[old_nickname];
      io.sockets.emit("name change", {
        old_nickname: old_nickname,
        nickname: nickname
      });
    } else {
      io.sockets.emit("joined", { nickname: nickname });
    }
  });

  socket.on("message", function(msg, fn) {
    if (!socket.nickname) {
      fn("Must pick a nickname before sending messages.");
      return;
    }
    io.sockets.emit("message", {
      nickname: socket.nickname,
      message: msg
    });
  });

  socket.on("nicknames", function(fn) {
    fn({ nicknames: nicknames });
  });

  socket.on("disconnect", function() {
    if (!socket.nickname) {
      return;
    }

    io.sockets.emit("left", { nickname: socket.nickname });
    delete nicknames[socket.nickname];
  });
});

server.listen(8080);

