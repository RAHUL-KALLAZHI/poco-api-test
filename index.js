require("dotenv").load();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const methods = require("./src/server.js");
const tokenGenerator = methods.tokenGenerator;
const makeCall = methods.makeCall;
const placeCall = methods.placeCall;
const incoming = methods.incoming;
const welcome = methods.welcome;
const validateCallerId = methods.validateCallerId;
const getAccessToken = methods.getAccessToken;
const findOrCreateRoom = methods.findOrCreateRoom;
const voice = methods.voice;
const callHistory = methods.callHistory;
const sendMessage = methods.sendMessage;
const listCallerIds = methods.listCallerIds;
const login = methods.login;
const verify = methods.verify;
const dialResponse = methods.dialResponse;
const events = methods.events;
const disconnectParticipant = methods.disconnectParticipant;
const leaveConference = methods.leaveConference;
const addParticipant = methods.addParticipant;
const muteConference = methods.muteConference;
const muteCall = methods.muteCall;
const participantEvents = methods.participantEvents;
const disconnectVideoRoom = methods.disconnectVideoRoom;
const disconnectRemoteParticipant = methods.disconnectRemoteParticipant;
const muteRemoteVideoParticipant = methods.muteRemoteVideoParticipant;

// Create Express webapp
const app = express();

// parse application/x-www-form-urlencoded

// var allowCrossDomain = function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// }
// app.use(allowCrossDomain);
// const corsOptions = {
//   origin(origin, callback) {
//       callback(null, true);
//   },
//   credentials: true
// };
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

// app.get('/', function(request, response) {
//   response.send(welcome());
// });

app.post("/", function (request, response) {
  response.send(welcome());
});

app.get("/accessToken", function (request, response) {
  tokenGenerator(request, response);
});

app.post("/accessToken", function (request, response) {
  tokenGenerator(request, response);
});

app.get("/makeCall", function (request, response) {
  makeCall(request, response);
});

app.post("/makeCall", function (request, response) {
  makeCall(request, response);
});

app.post("/voice", function (request, response) {
  voice(request, response);
});
app.get("/voice", function (request, response) {
  voice(request, response);
});

app.get("/validateCallerId", bodyParser.json(), function (request, response) {
  validateCallerId(request, response);
});

app.post("/validateCallerId", bodyParser.json(), function (request, response) {
  validateCallerId(request, response);
});

app.get("/callHistory", bodyParser.json(), function (request, response) {
  callHistory(request, response);
});

app.post("/callHistory", bodyParser.json(), function (request, response) {
  callHistory(request, response);
});

app.get("/sendMessage", bodyParser.json(), function (request, response) {
  sendMessage(request, response);
});

app.post("/sendMessage", bodyParser.json(), function (request, response) {
  sendMessage(request, response);
});

app.get("/listCallerIds", bodyParser.json(), function (request, response) {
  listCallerIds(request, response);
});

app.post("/listCallerIds", bodyParser.json(), function (request, response) {
  listCallerIds(request, response);
});

app.post("/login", bodyParser.json(), function (request, response) {
  login(request, response);
});
app.get("/login", bodyParser.json(), function (request, response) {
  login(request, response);
});

app.post("/verify", bodyParser.json(), function (request, response) {
  verify(request, response);
});
app.get("/verify", bodyParser.json(), function (request, response) {
  verify(request, response);
});

app.get("/placeCall", placeCall);

app.post("/placeCall", placeCall);

app.get("/incoming", function (request, response) {
  response.send(incoming());
});

app.post("/incoming", function (request, response) {
  response.send(incoming());
});

app.post(
  "/disconnectVideoRoom",
  bodyParser.json(),
  function (request, response) {
    disconnectVideoRoom(request, response);
  }
);
app.get(
  "/disconnectVideoRoom",
  bodyParser.json(),
  function (request, response) {
    disconnectVideoRoom(request, response);
  }
);

app.post("/events", function (request, response) {
  console.log("status:", request.body);
  io.to(request.query.conferenceId).emit("statusChanged", {
    status: request.body.CallStatus,
  });
  events(request, response);
});

app.get("/events", function (request, response) {
  console.log("status:=", request.query);
  io.to(request.query.conferenceId).emit("statusChanged", {
    status: request.query.CallStatus,
  });
  events(request, response);
});

app.post("/dial", bodyParser.json(), function (request, response) {
  dialResponse(request, response);
});

app.get("/dial", bodyParser.json(), function (request, response) {
  dialResponse(request, response);
});

app.post(
  "/disconnectParticipant",
  bodyParser.json(),
  function (request, response) {
    disconnectParticipant(request, response);
  }
);

app.post(
  "/disconnectRemoteParticipant",
  bodyParser.json(),
  function (request, response) {
    disconnectRemoteParticipant(request, response);
  }
);
app.get(
  "/disconnectRemoteParticipant",
  bodyParser.json(),
  function (request, response) {
    disconnectRemoteParticipant(request, response);
  }
);

app.post(
  "/muteRemoteVideoParticipant",
  bodyParser.json(),
  function (request, response) {
    muteRemoteVideoParticipant(request, response);
  }
);
app.get(
  "/muteRemoteVideoParticipant",
  bodyParser.json(),
  function (request, response) {
    muteRemoteVideoParticipant(request, response);
  }
);

app.get("/addParticipant", bodyParser.json(), function (request, response) {
  addParticipant(request, response);
});
app.post("/addParticipant", bodyParser.json(), function (request, response) {
  addParticipant(request, response);
});

app.get("/mute", bodyParser.json(), function (request, response) {
  muteConference(request, response);
});
app.post("/mute", bodyParser.json(), function (request, response) {
  muteConference(request, response);
});

app.get("/muteCall", bodyParser.json(), function (request, response) {
  muteCall(request, response);
});
app.post("/muteCall", bodyParser.json(), function (request, response) {
  muteCall(request, response);
});

app.post("/leave", function (request, response) {
  console.log("freindlyname", request.body.FriendlyName);
  io.to(request.body.FriendlyName).emit("callEnded", { data: request.body });
  leaveConference(request, response);
});
app.get("/leave", function (request, response) {
  io.to(request.query.FriendlyName).emit("callEnded", { data: request.query });
  leaveConference(request, response);
});

app.post("/participantEvents", function (request, response) {
  console.log("participant events trigerd", request.query.conferenceId);
  console.log("participantstatus:=", request.body);
  io.to(request.query.conferenceId).emit("participantStatusChanged", {
    callStatus: request.body.CallStatus,
    participantNumber: request.body.Called,
    callSid: request.body.CallSid,
  });
  participantEvents(request, response);
});

app.post("/join-room", bodyParser.json(), function (request, response) {
  // return 400 if the request has an empty body or no roomName
  if (!request.body || !request.body.roomName) {
    return response.status(400).send("Must include roomName argument.");
  }
  const roomName = request.body.roomName;
  const identity = request.body.userName ? request.body.userName : null;
  // find or create a room with the given roomName
  findOrCreateRoom(roomName);
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName, identity);
  response.send({
    token: token,
  });
});

app.get("/join-room", bodyParser.json(), function (request, response) {
  // return 400 if the request has an empty body or no roomName
  if (!request.query || !request.query.roomName) {
    return response.status(400).send("Must include roomName argument.");
  }
  const roomName = request.query.roomName;
  const identity = request.query.userName ? request.query.userName : null;
  // find or create a room with the given roomName
  findOrCreateRoom(roomName, response);
  // generate an Access Token for a participant in this room
  const token = getAccessToken(roomName, identity);
  response.send({
    token: token,
  });
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("public/index.html");
});

const server = http.createServer(app);
const io = new Server(server, {
  origins: [
    "*",
    "capacitor://localhost",
    "http://localhost:8100",
    "http://localhost",
    "https://dev-dcp.pocnconnect.com",
    "https://silver-strudel-7bc3a2.netlify.app",
  ],
  cors: {
    origin: [
      "*",
      "capacitor://localhost",
      "http://localhost:8100",
      "http://localhost",
      "https://dev-dcp.pocnconnect.com",
      "https://silver-strudel-7bc3a2.netlify.app",
    ],
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("a user has connected!", socket.id);
  socketId = socket.id;
  // socket.emit('event', {
  //   msg: 'Server to client, do you read me? Over.'
  // });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("my message", (msg) => {
    console.log("message: " + msg);
    io.emit("my broadcast", `server: ${msg}`);
    socket.join(msg);
  });
});

server.listen(port, function () {
  console.log("Express server running on *:" + port);
});
