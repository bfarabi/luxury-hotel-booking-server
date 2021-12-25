const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab2-71a03-firebase-adminsdk-l4qek-3e230af003.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fway0.mongodb.net/luxuryHotel?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("luxuryHotel").collection("RoomBookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedId > 0);
    });
  });
  app.get("/booking", (req, res) => {
    const bearer = req.headers.authorization;
    // console.log(bearer);
    if (bearer && bearer.startsWith("Bearer ")) {
      idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          //now double verification email.
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          }
        })
        .catch((error) => {
          res.status(401).send("unauthorized access");
        });
    } else {
      res.status(401).send("unauthorized access"); 
    }
  });
});


app.listen(process.env.PORT ||port);
