const admin = require("firebase-admin");
// const serviceAccount = require("./dev-test-25bc6-firebase-adminsdk-hxe8h-af23768f71.json");
const bcrypt = require("bcrypt");
const localStrategy = require("passport-local").Strategy;

// initialize Firestore
// admin.initializeApp(
//   {
//     credential: admin.credential.cert(serviceAccount),
//   },
//   "firestorePassport"
// );
admin.initializeApp(
  {
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(process.env.GOOGLE_CONFIG_BASE64, "base64").toString(
          "ascii"
        )
      )
    ),
  },
  "firestorePassport"
);
const db = admin.firestore();

//implement strategy

module.exports = function (passport) {
  passport.use(
    new localStrategy(async (username, password, done) => {
      let user = await getUser(username);
      if (user instanceof Error) {
        throw user;
      } else if (user) {
        await bcrypt.compare(password, user.password, (err, result) => {
          if (err) throw err;
          if (result === true) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        });
      }
    })
  );
  passport.serializeUser((user, cb) => {
    cb(null, user.Id);
  });

  passport.deserializeUser(async (id, cb) => {
    let user = await getUserByID(id);
    if (user instanceof Error) {
      throw user;
    } else if (user) {
      const userInformation = {
        username: user.username,
      };
      cb(null, userInformation);
    }
  });
};
getUser = async (username) => {
  try {
    let result1;
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("username", "==", username).get();
    if (snapshot.empty) {
      console.error("No matching documents.");
      return;
    }
    snapshot.forEach((doc) => {
      console.log("Dude we found one! : ", doc.id, "=>", doc.data());
      result1 = {
        Id: doc.id,
        username: doc.data().username,
        password: doc.data().password,
      };
    });
    return result1;
  } catch (err) {
    // ... error checks
    console.log(err);
    throw err;
  }
};
getUserByID = async (id) => {
  try {
    let result1;
    const userRef = db.collection("users").doc(id);
    const doc = await userRef.get();
    if (!doc.exists) {
      console.error("No such document!");
    } else {
      console.log("Dude we found one! : ", doc.id, "=>", doc.data());
      result1 = {
        Id: doc.id,
        username: doc.data().username,
        password: doc.data().password,
      };
    }
    return result1;
  } catch (err) {
    // ... error checks
    console.error(err);
    throw err;
  }
};
