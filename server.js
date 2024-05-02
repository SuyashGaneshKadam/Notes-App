const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const clc = require("cli-color");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);

// File imports
const { userDataValidation } = require("./utils/authUtil");
const userModel = require("./models/userModel");
const { isAuth } = require("./middlewares/authMiddleware");
const noteModel = require("./models/noteModel");

// Constants
const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;
const store = new mongoDbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

// Middlewares
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  })
);
app.use(express.static("public"));

// DB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(clc.yellowBright.bold("MongoDB connected")))
  .catch((err) => console.log(clc.redBright("Error: ", err)));

// APIs

app.get("/", (req, res) => {
  res.render("registerPage.ejs");
});

app.get("/login", (req, res) => {
  res.render("loginPage.ejs");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  // console.log(name, email, username, password);

  // Data validation
  try {
    await userDataValidation({ username, password });
  } catch (error) {
    return res.send({ status: 400, message: "Invalid user data", error });
  }

  // Checking if username already exists
  const usernameExists = await userModel.findOne({ username });
  if (usernameExists) {
    return res.send({ status: 400, message: "Username already exists" });
  }

  // Storing in the database
  const userObj = new userModel({
    username,
    password,
  });
  try {
    const userDb = await userObj.save();
    // res.send({status: 200, message:"User data saved successfully", data: userDb});
    return res.redirect("/login");
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let userDb;
  // Search for the user
  try {
    userDb = await userModel.findOne({ username });

    // console.log(userDb);
    if (!userDb) {
      return res.send({
        status: 400,
        message: "User not found, please register",
      });
    }

    // Comparing passwords
    if (password !== userDb.password) {
      return res.send({ status: 400, message: "Password is incorrect" });
    }

    // Session based Auth
    req.session.isAuth = true;
    req.session.user = {
      userId: userDb._id,
      username: userDb.username,
    };

    return res.redirect("/dashboard");
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error: error });
  }
});

app.get("/dashboard", isAuth, (req, res) => {
  return res.render("dashboardPage");
});

app.post("/logout", isAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send({ status: 500, message: "Log out failed" });
    } else {
      return res.redirect("/login");
    }
  });
});

app.post("/create-note", isAuth, async (req, res) => {
  const { title, content, tags, color, archived } = req.body;
  const userId = req.session.user.userId;

  // console.log(title, content, tags, color, archived, userId);

  //Data validation
  if (!title.trim()) {
    return res.send({ status: 400, message: "Title is missing" });
  } else if (!content.trim()) {
    return res.send({ status: 400, message: "Content is missing" });
  }

  // Creating note object
  const noteObj = new noteModel({
    userId,
    title,
    content,
    tags,
    color,
    archived,
  });

  //Saving note in the Database
  try {
    const noteDb = await noteObj.save();
    return res.send({
      status: 201,
      message: "Note saved successfully",
      data: noteDb,
    });
  } catch (error) {
    res.send({ status: 500, message: "Database error", error });
  }
  // return res.send("Created");
});

app.get("/read-notes", isAuth, async (req, res) => {
  const { userId } = req.session.user;
  try {
    const notes = await noteModel.find({ userId });
    // console.log(notes);
    if (notes.length === 0) {
      return res.send({
        status: 400,
        message: "No Notes found",
      });
    }
    return res.send({
      status: 200,
      message: "Notes fetched successfully",
      data: notes,
    });
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
});

app.post("/update-color", isAuth, async (req, res) =>{
  const { noteId, color } = req.body;
  const { userId } = req.session.user;
  // console.log("id:", noteId);

  try {
    // Searching for note
    const noteDb = await noteModel.findOne({ _id: noteId });
    // console.log(noteDb);

    if (!noteDb) {
      return res.send({ status: 400, message: "Note not found" });
    }

    // Checking ownership
    if (!userId.equals(noteDb.userId)) {
      return res.send({
        status: 403,
        message: "You are not authorized to change background color of this note",
      });
    }

    // Changing the background color of the note

    const note = await noteModel.findOneAndUpdate(
        { _id: noteId },
        { color }
      );

    res.send({
      status: 200,
      message: "Note deleted/restored successfully",
      data: note,
    });
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
})

app.post("/delete-note", isAuth, async (req, res) => {
  const { noteId } = req.body;
  const { userId } = req.session.user;
  // console.log("id:", noteId);

  try {
    // Searching for note
    const noteDb = await noteModel.findOne({ _id: noteId });
    // console.log(noteDb);

    if (!noteDb) {
      return res.send({ status: 400, message: "Note not found" });
    }

    // Checking ownership
    if (!userId.equals(noteDb.userId)) {
      return res.send({
        status: 403,
        message: "You are not authorized to delete this note",
      });
    }

    // Deleting/Restoring the note

    let note;
    if (noteDb.isDeleted) {
      note = await noteModel.findOneAndUpdate(
        { _id: noteId },
        { isDeleted: false, deletedAt: null }
      );
    } else {
      note = await noteModel.findOneAndUpdate(
        { _id: noteId },
        { isDeleted: true, deletedAt: Date.now() }
      );
    }

    res.send({
      status: 200,
      message: "Note deleted/restored successfully",
      data: note,
    });
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
});

app.post("/archive-note", isAuth, async (req, res) => {
  const { noteId } = req.body;
  const { userId } = req.session.user;
  // console.log("id:", noteId);

  try {
    // Searching for note
    const noteDb = await noteModel.findOne({ _id: noteId });
    // console.log(noteDb);

    if (!noteDb) {
      return res.send({ status: 400, message: "Note not found" });
    }

    // Checking ownership
    if (!userId.equals(noteDb.userId)) {
      return res.send({
        status: 403,
        message: "You are not authorized to archive this note",
      });
    }

    // Archiving/Unarchiving the note
    const archivedNote = await noteModel.findOneAndUpdate(
      { _id: noteId },
      { archived: !noteDb.archived }
    );

    res.send({
      status: 200,
      message: "Note Archived/Unarchived successfully",
      data: archivedNote,
    });
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
});

app.post("/delete-note-forever", isAuth, async (req, res) =>{
  const { noteId } = req.body;
  const { userId } = req.session.user;
  // console.log("id:", noteId);

  try {
    // Searching for note
    const noteDb = await noteModel.findOne({ _id: noteId });
    // console.log(noteDb);

    if (!noteDb) {
      return res.send({ status: 400, message: "Note not found" });
    }

    // Checking ownership
    if (!userId.equals(noteDb.userId)) {
      return res.send({
        status: 403,
        message: "You are not authorized to delete this note",
      });
    }

    // Deleting/Restoring the note

    let deletedNote = await noteModel.findOneAndDelete(
        { _id: noteId }
      );

    res.send({
      status: 200,
      message: "Note deleted forever",
      data: deletedNote,
    });
  } catch (error) {
    return res.send({ status: 500, message: "Database error", error });
  }
})

app.listen(PORT, () => {
  console.log(
    clc.blue("Server started on:"),
    clc.cyan.underline.bold(`http://localhost:${PORT}`)
  );
});
