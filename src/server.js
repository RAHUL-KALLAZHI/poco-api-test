require("dotenv").load();

const AccessToken = require("twilio").jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = require("twilio").twiml.VoiceResponse;
const defaultIdentity = "alice";
const callerId = "+916282649883";
const MODERATOR = "+18149134172";
// Use a valid Twilio number by adding to your account via https://www.twilio.com/console/phone-numbers/verified
const callerNumber = "+916282649883";
const serverUrl = "https://poco-api-test.onrender.com";

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
/**
 * Creates an access token with VoiceGrant using your Twilio credentials.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The Access Token string
 */
const { v4: uuidv4 } = require("uuid");
const VideoGrant = AccessToken.VideoGrant;

// use the Express JSON middleware

// create the twilioClient
const twilioClient = require("twilio")(
  process.env.API_KEY_SID,
  process.env.API_SECRET,
  { accountSid: process.env.ACCOUNT_SID }
);

const findOrCreateRoom = async (roomName, response) => {
  try {
    // see if the room exists already. If it doesn't, this will throw
    // error 20404.
    await twilioClient.video.rooms(roomName).fetch();
  } catch (error) {
    // the room was not found, so create it
    if (error.code == 20404) {
      console.log("new room created");
      await twilioClient.video.rooms.create({
        uniqueName: roomName,
        type: "group",
      });
      // return response.status(200).send(room)
    } else {
      // let other errors bubble up
      throw error;
    }
  }
};

const getAccessToken = (roomName, identity) => {
  // create an access token
  const token = new AccessToken(
    process.env.ACCOUNT_SID,
    process.env.API_KEY_SID,
    process.env.API_SECRET,
    // generate a random unique identity for this participant
    { identity: identity ? identity : uuidv4() }
  );
  // create a video grant for this specific room
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  // add the video grant
  token.addGrant(videoGrant);
  // serialize the token and return it
  return token.toJwt();
};

function tokenGenerator(request, response) {
  // Parse the identity from the http request
  var identity = null;
  if (request.method == "POST") {
    identity = request.body.identity;
  } else {
    identity = request.query.identity;
  }

  if (!identity) {
    identity = defaultIdentity;
  }

  // Parse the OS from the http request
  var os = null;
  if (request.method == "POST") {
    os = request.body.os;
  } else {
    os = request.query.os;
  }

  if (!os) {
    os = "ios";
  }

  // Used when generating any kind of tokens
  const accountSid = process.env.ACCOUNT_SID;
  const apiKey = process.env.API_KEY_SID;
  const apiSecret = process.env.API_SECRET;

  // Used specifically for creating Voice tokens
  var pushCredSid;
  if (os === "android") {
    pushCredSid = process.env.PUSH_CREDENTIAL_SID;
  } else {
    pushCredSid = process.env.IOS_PUSH_CREDENTIAL_SID;
  }
  const outgoingApplicationSid = process.env.APP_SID;

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: outgoingApplicationSid,
    pushCredentialSid: pushCredSid,
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(accountSid, apiKey, apiSecret);
  token.addGrant(voiceGrant);
  token.identity = identity;
  var grant = new VideoGrant();
  token.addGrant(grant);
  console.log("Token:" + token.toJwt());
  return response.send(token.toJwt());
}
/** */
async function validateCallerId(request, response) {
  console.log(request);
  var phone = null;
  var name = null;
  if (request.method == "POST") {
    phone = request.body.phone;
    name = request.body.name;
    console.log("body::", request.body);
  } else {
    phone = request.query.phone;
    name = request.query.name;
  }

  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  try {
    const numberValidation = await client.validationRequests.create({
      friendlyName: name,
      phoneNumber: phone,
    });
    console.log(numberValidation);
    return response.send(numberValidation.validationCode);
  } catch (error) {
    console.log(error);
    return response.send(error);
  }
}

/**
 * Creates an endpoint that can be used in your TwiML App as the Voice Request Url.
 * <br><br>
 * In order to make an outgoing call using Twilio Voice SDK, you need to provide a
 * TwiML App SID in the Access Token. You can run your server, make it publicly
 * accessible and use `/makeCall` endpoint as the Voice Request Url in your TwiML App.
 * <br><br>
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {Object} - The Response Object with TwiMl, used to respond to an outgoing call
 */
async function voice(request, response) {
  const twiml = new VoiceResponse();

  // Start with a <Dial> verb
  const dial = twiml.dial();
  // If the caller is our MODERATOR, then start the conference when they
  // join and end the conference when they leave
  if (request.body.from == MODERATOR) {
    dial.conference("My conference", {
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
    });
  } else {
    // Otherwise have the caller join as a regular participant
    dial.conference("My conference", {
      startConferenceOnEnter: false,
    });
  }

  // Render the response as XML in reply to the webhook request
  response.type("text/xml");
  console.log("Response dial:" + twiml.toString());
  return response.send(twiml.toString());
}

async function makeCall(request, response) {
  // The recipient of the call, a phone number or a client
  var to = null;
  var conferenceId = null;
  var from = null;
  console.log("request makeCall =>", request);
  if (request.method == "POST") {
    to = request.body.to;
    conferenceId = request.body.conferenceId;
    console.log("bode::", request.body);
  } else {
    to = request.query.to;
    conferenceId = request.query.conferenceId;
  }

  const voiceResponse = new VoiceResponse();

  if (!to) {
    voiceResponse.say(
      "Congratulations! You have made your first call! Good bye Rahul."
    );
  } else if (isNumber(to)) {
    from = request.body.from;
    console.log("makeCall isNumber(to) =>", serverUrl, conferenceId, to, from);
    client.calls
      .create(
        {
          statusCallback: `${serverUrl}/events?conferenceId=${conferenceId}`,
          statusCallbackEvent: [
            "initiated",
            "answered",
            "ringing",
            "completed",
            "cancel",
            "transportClose",
            "reject",
          ],
          statusCallbackMethod: "POST",
          url: `${serverUrl}/dial?conferenceId=${conferenceId}&to=${to}&callerId=${from}`, // TODO: end point for /dial
          to: to,
          from: from, // TODO: replace with twilio purchased no
          method: "GET",
        },
        function (err, call) {
          if (err) console.log(err.message);
          else console.log(call);
        }
      )
      .then((e) => console.log("else if (isNumber(to))", e));
  } else {
    if (request.method == "POST") {
      from = request.body.from;
    } else {
      from = request.query.from;
    }

    if (!from) {
      from = callerId;
    }
    console.log("makeCall isNumber(to) =>", serverUrl, conferenceId, to, from);
    client.calls
      .create(
        {
          statusCallback: `${serverUrl}/events?conferenceId=${conferenceId}`,
          statusCallbackEvent: [
            "initiated",
            "answered",
            "ringing",
            "completed",
            "cancel",
            "transportClose",
            "reject",
          ],
          statusCallbackMethod: "POST",
          url: `${serverUrl}/dial?conferenceId=${conferenceId}&callerId=${from}&to=${to}`, // TODO: end point for /dial
          to: to,
          from: from, // TODO: replace with twilio purchased no
          method: "GET",
        },
        function (err, call) {
          if (err) console.log("makeCall =>", err.message);
          else console.log(call);
        }
      )
      .then((e) => console.log("else ", e));
  }
  const dial = voiceResponse.dial({ callerId: from, answerOnBridge: true });
  dial.conference(conferenceId, {
    beep: "false",
    participantLabel: from,
    endConferenceOnExit: "true",
    statusCallbackEvent: ["leave"],
    statusCallbackMethod: "POST",
    statusCallback: `${serverUrl}/leave?to=${to}&callerId=${from}`,
  });
  return response.send(voiceResponse.toString());
}

async function sendMessage(request, response) {
  var twilioTo = null;
  var twilioFrom = null;
  var messageBody = null;
  var serviceSid = process.env.MESSAGE_SERVICE_SID;
  if (request.method == "POST") {
    twilioTo = request.body.to;
    twilioFrom = request.body.from;
    messageBody = request.body.message;
  } else {
    twilioTo = request.query.to;
    twilioFrom = request.query.from;
    message = request.query.message;
  }
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  message = await client.messages.create({
    messagingServiceSid: serviceSid,
    body: messageBody,
    from: twilioFrom,
    to: twilioTo,
  });
  return response.send(message);
}
/**
 * Makes a call to the specified client using the Twilio REST API.
 *
 * @param {Object} request - POST or GET request that provides the recipient of the call, a phone number or a client
 * @param {Object} response - The Response Object for the http request
 * @returns {string} - The CallSid
 */
async function placeCall(request, response) {
  // The recipient of the call, a phone number or a client
  var to = null;
  if (request.method == "POST") {
    to = request.body.to;
  } else {
    to = request.query.to;
  }
  console.log(to);
  // The fully qualified URL that should be consulted by Twilio when the call connects.
  var url = request.protocol + "://" + request.get("host") + "/incoming";
  console.log(url);
  const accountSid = process.env.ACCOUNT_SID;
  const apiKey = process.env.API_KEY;
  const apiSecret = process.env.API_KEY_SECRET;
  const client = require("twilio")(apiKey, apiSecret, {
    accountSid: accountSid,
  });

  if (!to) {
    console.log("Calling default client:" + defaultIdentity);
    call = await client.api.calls.create({
      url: url,
      to: "client:" + defaultIdentity,
      from: callerId,
    });
  } else if (isNumber(to)) {
    console.log("Calling number:" + to);
    call = await client.api.calls.create({
      url: url,
      to: to,
      from: callerNumber,
    });
  } else {
    console.log("Calling client:" + to);
    call = await client.api.calls.create({
      url: url,
      to: "client:" + to,
      from: callerId,
    });
  }
  console.log(call.sid);
  //call.then(console.log(call.sid));
  return response.send(call.sid);
}

/**
 * Creates an endpoint that plays back a greeting.
 */
function incoming() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say(
    "Congratulations! You have received your first inbound call! Good bye."
  );
  console.log("Response incoming:" + voiceResponse.toString());
  return voiceResponse.toString();
}

function welcome() {
  const voiceResponse = new VoiceResponse();
  voiceResponse.say("Welcome to Twilio, vinoy Have a nice day");
  console.log("Response welcome:" + voiceResponse.toString());
  return voiceResponse.toString();
}

async function callHistory(request, response) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  from = request.body.from;
  to = request.body.to;
  if (request.method == "POST") {
    from = request.body.from;
    to = request.body.to;
  } else {
    from = request.query.from;
    to = request.query.to;
  }
  call = await client.calls.list({ to: to, from: from, limit: 1 });
  return response.send(call);
}

function isNumber(to) {
  if (to.length == 1) {
    if (!isNaN(to)) {
      console.log("It is a 1 digit long number" + to);
      return true;
    }
  } else if (String(to).charAt(0) == "+") {
    number = to.substring(1);
    if (!isNaN(number)) {
      console.log("It is a number " + to);
      return true;
    }
  } else {
    if (!isNaN(to)) {
      console.log("It is a number " + to);
      return true;
    }
  }
  console.log("not a number");
  return false;
}

async function listCallerIds(request, response) {
  var callerIds = [];
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  await client.outgoingCallerIds
    .list({ limit: 20 })
    .then((outgoingCallerIds) =>
      outgoingCallerIds.forEach((o) => callerIds.push(o))
    );
  console.log(callerIds);
  return response.send(callerIds);
}

async function login(request, response) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const serviceSid = process.env.SERVICE_SID;
  const client = require("twilio")(accountSid, authToken);
  var channel = null;
  var to = null;
  if (request.method == "POST") {
    channel = request.body.channel;
    to = `+${request.body.phoneNumber}`;
  } else {
    channel = request.query.channel;
    to = `+${request.query.phoneNumber}`;
  }
  client.verify
    .services(serviceSid)
    .verifications.create({
      to: to,
      channel: channel,
    })
    .then((data) => {
      response.status(200).send(data);
    });
}

async function verify(request, response) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const serviceSid = process.env.SERVICE_SID;
  const client = require("twilio")(accountSid, authToken);
  var code = null;
  var to = null;
  if (request.method == "POST") {
    code = request.body.code;
    to = `+${request.body.phoneNumber}`;
  } else {
    code = request.query.code;
    to = `+${request.query.phoneNumber}`;
  }
  console.log(to, code);
  client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({
      to: to,
      code: code,
    })
    .then((data) => {
      response.status(200).send(data);
    })
    .catch((err) => response.status(404).send(err));
}

function dialResponse(request, response) {
  let twiml = new VoiceResponse();
  console.log("dialResponse request=>", request, response);
  const conferenceId = request.query.conferenceId;
  const caller = request.query.callerId;
  const to = request.query.to;
  const dial = twiml.dial({ callerId: caller, answerOnBridge: true });

  // TODO: Pass conference name from UI
  dial.conference(conferenceId, {
    beep: "false",
    participantLabel: to,
    statusCallbackEvent: ["leave"],
    statusCallbackMethod: "POST",
    statusCallback: `${serverUrl}/leave?to=${to}&callerId=${from}`,
  });

  return response.send(twiml.toString());
}

function events(request, response) {
  console.log(request.body.CallStatus);
  var participants = [];
  var conferenceSid = null;
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const conferenceId = request.query.conferenceId;
  const client = require("twilio")(accountSid, authToken);
  client.conferences
    .list({
      friendlyName: conferenceId,
      status: "in-progress",
      limit: 1,
    })
    .then((conference) => {
      conferenceSid = conference[0].sid;
      client
        .conferences(conferenceSid)
        .participants.list({ limit: 20 })
        .then((participant) => {
          participant.forEach((p) => {
            participants.push(p.callSid);
          });
        })
        .then(() => {
          console.log(participants, ": participantdSid");
          if (
            request.body.CallStatus === "busy" ||
            request.body.CallStatus === "no-answer"
          ) {
            console.log("callee is busy");
            if (participants.length == 1) {
              console.log("call participant disconnected");
              client.conferences(conferenceSid).update({ status: "completed" });
            }
          }
        });
    });
  return response.send(request.body);
}

async function disconnectParticipant(request, response) {
  console.log(request.body.participant);
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const participant = request.body.participant;
  const conferenceId = request.query.conferenceId;
  const client = require("twilio")(accountSid, authToken);
  client.conferences
    .list({
      friendlyName: conferenceId,
      status: "in-progress",
      limit: 1,
    })
    .then((conference) => {
      conferenceSid = conference[0].sid;
      client.conferences(conferenceSid).participants(participant).remove();
    });
  return response.send("call disconnected");
}

async function addParticipant(request, response) {
  console.log(request.body);
  let conferenceSid = null;
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const conferenceId = request.body.conferenceId;
  const client = require("twilio")(accountSid, authToken);
  const from = request.body.from;
  const to = request.body.to;
  client.conferences
    .list({
      friendlyName: conferenceId,
      status: "in-progress",
      limit: 1,
    })
    .then((conference) => {
      conferenceSid = conference[0].sid;
      console.log(conference, conferenceSid);
      client
        .conferences(conferenceSid)
        .participants.create({
          label: to,
          earlyMedia: true,
          beep: "onEnter",
          statusCallback: `${serverUrl}/participantEvents?to=${to}&callerId=${from}&conferenceId=${conferenceId}`,
          statusCallbackEvent: [
            "initiated",
            "answered",
            "ringing",
            "completed",
          ],
          from: from,
          to: to,
        })
        .then((participant) => {
          console.log(participant.callSid);
          return response.send("partcipant added");
        })
        .catch((err) => console.log(err));
    });
}

async function leaveConference(request, response) {
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const caller = request.query.callerId;
  const to = request.query.to;
  console.log(request.body);
  const conferenceSid = request.body.ConferenceSid;
  const client = require("twilio")(accountSid, authToken);
  const participants = await client
    .conferences(conferenceSid)
    .participants.list();
  console.log(participants);
  if ((request.body.StatusCallbackEven = "participant-leave")) {
    console.log("no more participant");
    if (participants.length == 1) {
      console.log("no participants");
      client.conferences(conferenceSid).update({ status: "completed" });
    } else if (participants.length == 0) {
      call = await client.calls.list({ to: to, from: caller, limit: 1 });
      console.log("no more calls");
      console.log(call, "list");
      const callSid = call[0].sid;
      client.calls(callSid).update({ status: "completed" });
      console.log(callSid, "call ended");
    } else {
      call = await client.calls.list({ to: to, from: caller, limit: 1 });
      console.log("two or more participants left");
      console.log("list of availabel participant");
      console.log(call);
      const callSid = call[0].sid;
    }
  }
  return;
}

async function muteConference(request, response) {
  var conferenceSid = null;
  const conferenceId = request.body.conferenceId;
  const participant = request.body.participant;
  const toMute = request.body.mute;
  console.log(request.body);
  client.conferences
    .list({
      friendlyName: conferenceId,
      status: "in-progress",
      limit: 1,
    })
    .then((conference) => {
      console.log(conference);
      conferenceSid = conference[0].sid;
      if (toMute == false) {
        client
          .conferences(conferenceSid)
          .participants(participant)
          .update({ muted: true })
          .then((participant) => {
            console.log(participant.callSid);
            return response.send("muted");
          });
      } else {
        client
          .conferences(conferenceSid)
          .participants(participant)
          .update({ muted: false })
          .then((participant) => {
            console.log(participant.callSid);
            return response.send("unmuted");
          });
      }
    });
}

async function muteCall(request, response) {
  var conferenceSid = null;
  const conferenceId = request.body.conferenceId;
  const participant = request.body.participant;
  const toMute = request.body.mute;
  console.log(request.body);
  client.conferences
    .list({
      friendlyName: conferenceId,
      status: "in-progress",
      limit: 1,
    })
    .then((conference) => {
      console.log(conference);
      conferenceSid = conference[0].sid;
      if (toMute == false) {
        client
          .conferences(conferenceSid)
          .participants(participant)
          .update({ muted: true })
          .then((participant) => {
            console.log(participant.callSid);
            return response.send("muted");
          });
      } else {
        client
          .conferences(conferenceSid)
          .participants(participant)
          .update({ muted: false })
          .then((participant) => {
            console.log(participant.callSid);
            return response.send("unmuted");
          });
      }
    });
}

function disconnectVideoRoom(request, response) {
  let uniqueName = null;
  if (request.method == "POST") {
    uniqueName = request.body.uniqueName;
  } else {
    uniqueName = request.query.uniqueName;
  }
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  client.video.v1
    .rooms(uniqueName)
    .fetch()
    .then((room) => {
      console.log(room);
      client.video.v1
        .rooms(room.sid)
        .update({ status: "completed" })
        .then((room) => {
          console.log(room);
          return response.send(room);
        });
    });
}

function disconnectRemoteParticipant(request, response) {
  let identity = null;
  let uniqueName = null;
  console.log(request.body);
  if (request.method == "POST") {
    identity = request.body.identity;
    uniqueName = request.body.uniqueName;
  } else {
    identity = request.query.identity;
    uniqueName = request.body.uniqueName;
  }
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);

  client.video.v1
    .rooms(uniqueName)
    .participants(identity)
    .update({ status: "disconnected" })
    .then((participant) =>
      console.log(participant.sid, "successfully disconnected")
    );
}

function muteRemoteVideoParticipant(request, response) {
  let identity = null;
  let uniqueName = null;
  let participantList = null;
  if (request.method == "POST") {
    identity = request.body.identity;
    uniqueName = request.body.uniqueName;
    participantList = request.body.participantList;
    notMuted = request.body.notMuted;
  } else {
    identity = request.query.identity;
    uniqueName = request.body.uniqueName;
    partcipantList = request.query.participantList;
    notMuted = request.query.notMuted;
  }
  console.log(request.body);
  const accountSid = process.env.ACCOUNT_SID;
  const authToken = process.env.AUTH_TOKEN;
  const client = require("twilio")(accountSid, authToken);
  if (notMuted) {
    participantList.map((participant) => {
      client.video
        .rooms(uniqueName)
        .participants.get(participant)
        .subscribeRules.update({
          rules: [
            { type: "include", all: true },
            { type: "exclude", publisher: identity, kind: "audio" },
          ],
        })
        .then((result) => {
          console.log("Subscribe Rules updated successfully", result);
          response.send({ data: "muted successfully" });
        })
        .catch((error) => {
          console.log("Error updating rules " + error);
        });
    });
  } else {
    participantList.map((participant) => {
      client.video
        .rooms(uniqueName)
        .participants.get(participant)
        .subscribeRules.update({
          rules: [{ type: "include", all: true }],
        })
        .then((result) => {
          console.log("Subscribe Rules updated successfully", result);
          response.send({ data: "unmuted successfully" });
        })
        .catch((error) => {
          console.log("Error updating rules " + error);
        });
    });
  }
}

function participantEvents(request, response) {
  console.log(request.body);
}

exports.tokenGenerator = tokenGenerator;
exports.makeCall = makeCall;
exports.placeCall = placeCall;
exports.incoming = incoming;
exports.welcome = welcome;
exports.validateCallerId = validateCallerId;
exports.findOrCreateRoom = findOrCreateRoom;
exports.getAccessToken = getAccessToken;
exports.voice = voice;
exports.callHistory = callHistory;
exports.sendMessage = sendMessage;
exports.listCallerIds = listCallerIds;
exports.login = login;
exports.verify = verify;
exports.dialResponse = dialResponse;
exports.events = events;
exports.disconnectParticipant = disconnectParticipant;
exports.leaveConference = leaveConference;
exports.addParticipant = addParticipant;
exports.muteConference = muteConference;
exports.muteCall = muteCall;
exports.participantEvents = participantEvents;
exports.disconnectVideoRoom = disconnectVideoRoom;
exports.disconnectRemoteParticipant = disconnectRemoteParticipant;
exports.muteRemoteVideoParticipant = muteRemoteVideoParticipant;
