const express = require("express");
const path = require("path");
require('dotenv').config();

const {
  doc,
  setDoc,
  collection,
  increment,
  getDocs,
  query,
} = require("firebase/firestore");

const { db } = require("./firebaseConfig.js");

const app = express();
const port = 3000;

app.engine("html", require("ejs").renderFile);
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.render("index.html");
});

const compareLike = (a, b) => {
  // let valA = Object.values(a)[0];
  // let valB = Object.values(b)[0];

  var likeA = a.like;
  var likeB = b.like;

  if (likeA > likeB) return -1;
  if (likeA < likeB) return 1;

  return 0;
};

const compareDilike = (a, b) => {
  // let valA = Object.values(a)[0];
  // let valB = Object.values(b)[0];

  var dislikeA = a.dislike;
  var dislikeB = b.dislike;

  if (dislikeA > dislikeB) return -1;
  if (dislikeA < dislikeB) return 1;

  return 0;
};

app.get("/charts", async (req, res) => {
  const q = query(collection(db, "rankings"));

  const querySnapshot = await getDocs(q);

  let rankingsData = [];

  querySnapshot.forEach((doc) => {
    let id = doc.id;
    let d = doc.data();
    rankingsData.push({ name: id, ...d });
  });

  console.log(rankingsData);

  let winners = rankingsData.sort(compareLike).slice(0, 3);

  let loosers = rankingsData.sort(compareDilike).slice(0, 3);

  // console.log(winners);
  // console.log(loosers);

  res.render("charts.html", { winners, loosers });
  // res.send("DONE");
});

app.post("/fire", async (req, res) => {
  const { name, status, image } = req.body;

  if (status != "like" && status != "dislike")
    return res.status(400).json({ message: "fail" });

  if (status == "like") {
    await setDoc(
      doc(db, "rankings", name),
      {
        like: increment(1),
        dislike: increment(0),
        image,
      },
      { merge: true }
    );
  } else if (status == "dislike") {
    await setDoc(
      doc(db, "rankings", name),
      {
        dislike: increment(1),
        like: increment(0),
        image,
      },
      { merge: true }
    );
  }

  return res.json({ message: "success" });
});

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}`);
});
