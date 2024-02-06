const express = require("express");
const path = require("path");
require('dotenv').config();

const {
  doc,
  setDoc,
  increment,
  getDoc
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

app.post("/rankings", async (req, res) => {
  const { collection } = req.body
  const docRef = doc(db, "rankings", collection);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // console.log("Document data:", docSnap.data());
    return res.json({ message: "success", data: docSnap.data() });
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
    return res.status(404).json({ message: "fail" });
  }
});

app.post("/fire", async (req, res) => {
  const { name, status } = req.body;

  if (status != "like" && status != "dislike")
    return res.status(400).json({ message: "fail" });

  if (status == "like") {
    await setDoc(
      doc(db, "rankings", name),
      {
        like: increment(1),
        dislike: increment(0),

      },
      { merge: true }
    );
  } else if (status == "dislike") {
    await setDoc(
      doc(db, "rankings", name),
      {
        dislike: increment(1),
        like: increment(0),

      },
      { merge: true }
    );
  }

  return res.json({ message: "success" });
});

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}`);
});
