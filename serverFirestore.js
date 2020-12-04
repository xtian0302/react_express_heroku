//const mongoose = require("mongoose");
const admin = require("firebase-admin");
// const serviceAccount = require("./dev-test-25bc6-firebase-adminsdk-hxe8h-af23768f71.json");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");
const bodyParser = require("body-parser");
var path = require("path");
let apiPort = 4000;

const app = express();

// initialize Firestore
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(
      Buffer.from(process.env.GOOGLE_CONFIG_BASE64, "base64").toString("ascii")
    )
  ),
});
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
const db = admin.firestore();
//Middleware -------------------------------------------------------------

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//Cors
app.use(cors({ origin: true, credentials: true }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
});
//Initialize cookie secret
app.use(
  session({
    secret: "sectr",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("sectr"));
//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
require("./passportFirestore")(passport);

//Serve React Files

app.use(express.static(path.join(__dirname, "build")));

//Routes -------------------------------------------------------------
app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.send("No User Exists");
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        res.send("Successfully Authenticated");
        console.log("Authernticated User (stored to session) ");
      });
    }
  })(req, res, next);
});

app.get("/logout", function (req, res) {
  req.logout();
  res.send("logout success");
});

app.post("/register", async (req, res) => {
  try {
    let result1;
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await db
      .collection("users")
      .add({
        username: req.body.username,
        password: hashedPassword,
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
        result1 = docRef.id;
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
      });
    res.send("account created at ID : " + result1);
  } catch (err) {
    // ... error checks
    console.log(err);
    res
      .status(400)
      .send(new Error("Failed to register account due to : " + err));
  }
});

app.get("/getUser", async (req, res) => {
  //res.json(req.session.user); //use this while passport is broken. or deploy same site with heroku
  res.send(req.user); //req.user stores the user session that has been authenticated
});

app.get("/getChartData", async (req, res) => {
  res.send({
    datasetname: "this is le dataseto",
    labels: ["A", "B", "C"],
    data: [1, 2, 3],
  }); //req.user stores the user session that has been authenticated
});

app.get("/getInsult", async (req, res) => {
  await axios({
    method: "GET",
    url: "https://insult.mattbas.org/api/insult",
  }).then(async (result) => {
    res.send(result.data);
  });
});

app.get("/getMapPosition", async (req, res) => {
  res.send({
    zoom: 12,
    position: [14.5386049, 120.9812023],
    label: "Hello World",
  }); //req.user stores the user session that has been authenticated
});

app.get("/freeget", async (req, res) => {
  res.send("this is free!"); //req.user stores the user session that has been authenticated
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

console.log(process.env.API_DOMAIN);
//Start Web Service
app.listen(process.env.PORT || apiPort, () => {
  console.log(
    "Auth Server started at !",
    apiPort,
    " or at :",
    process.env.PORT
  );
});
