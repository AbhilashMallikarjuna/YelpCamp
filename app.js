// importing modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const Joi = require("joi");
const { campgroundSchema } = require("./schemas");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const Campground = require("./models/campground");

// Connecting mongoose database
mongoose.connect("mongodb://localhost:27017/yelp-camp");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});
// Creating an express app
const app = express();

app.engine("ejs", ejsMate);
// Setting ejs as view engine in the express path
app.set("view engine", "ejs");
// Creating a general path so that the app can started from anywhere
// otherwise it can only recognise views folder from the project dir
app.set("views", path.join(__dirname, "/views"));

// This will encode the response we get from the post request of a form
// Without this , the browser cannot encode the request and will show blank screen
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};
// Routes
app.get("/", (req, res) => {
  res.render("home");
});

// To show all the campgrounds
app.get(
  "/campgrounds",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);

// To create a new campground
// If this route is placed after "/campgrounds/:id" route, then the new route will not be reached
// because browser assumes the new word as an ID and search for new in the database
// So this route is placed before the show route
app.get("/campgrounds/new", (req, res) => {
  res.render("campgrounds/new");
});

app.post(
  "/campgrounds",
  validateCampground,
  catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

// TO show a campground using ID
app.get(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    res.render("campgrounds/show", { campground });
  })
);

// To edit a campground
app.get(
  "/campgrounds/:id/edit",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    res.render("campgrounds/edit", { campground });
  })
);

// To save the edited campground
app.put(
  "/campgrounds/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground, // here we are destructuring the req body
    });
    res.redirect(`/campgrounds/${campground._id}`);
  })
);
// To delete a campground
app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
  })
);

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
