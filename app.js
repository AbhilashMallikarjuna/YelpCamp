// importing modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");

const campgrounds = require("./routes/campgrounds");
const reviews = require("./routes/reviews");

// Connecting mongoose database
mongoose.connect("mongodb://localhost:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express(); // Creating an express app

app.engine("ejs", ejsMate);

app.set("view engine", "ejs"); // Setting ejs as view engine in the express path

// Creating a general path so that the app can started from anywhere
// otherwise it can only recognise views folder from the project dir
app.set("views", path.join(__dirname, "/views"));

// This will encode the response we get from the post request of a form
// Without this , the browser cannot encode the request and will show blank screen
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

const sessionConfig = {
  secret: "ThisShouldBeABetterSecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

// For every single request, we get the message from flash function and
// it will be stores in the local storage so that it can be accessed from anywhere
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
// Routes

app.use("/campgrounds", campgrounds);
app.use("/campgrounds/:id/reviews", reviews);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render("error", { err });
});
app.listen(3000, () => {
  console.log("SERVING ON PORT 3000");
});
