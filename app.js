if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// importing modules
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const MongoStore = require('connect-mongo');

const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");


const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";
// const dbUrl = "mongodb://localhost:27017/yelp-camp";
// Connecting mongoose database
mongoose.connect(dbUrl);

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
app.use(mongoSanitize());

const secret = process.env.SECRET || 'ThisShouldBeABetterSecret';
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: {
    secret: secret
  }
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
})
const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure : true, 
    // if secure is set to true, cookies will only be accessed through https requests.
    // local host is not a secure, hence we cannot activate during development
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet());
// app.use(helmet({ contentSecurityPolicy: false }));
// app.use(helmet({ crossOriginEmbedderPolicy: false }));
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net/",
  "https://res.cloudinary.com/yelpcampabhi/"
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net/",
  "https://res.cloudinary.com/yelpcampabhi/"
];
const connectSrcUrls = [
  "https://*.tiles.mapbox.com",
  "https://api.mapbox.com",
  "https://events.mapbox.com",
  "https://res.cloudinary.com/yelpcampabhi/"
];
const fontSrcUrls = ["https://res.cloudinary.com/yelpcampabhi/"];

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://res.cloudinary.com/yelpcampabhi/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
          "https://images.unsplash.com/"
        ],
        fontSrc: ["'self'", ...fontSrcUrls],
        mediaSrc: ["https://res.cloudinary.com/yelpcampabhi/"],
        childSrc: ["blob:"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// For every single request, we get the message from flash function and
// it will be stores in the local storage so that it can be accessed from anywhere
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/fakeUser", async (req, res) => {
  const user = new User({ email: "abhi@gmail.com", username: "Abhi" });
  const newUser = await User.register(user, "goodboy");
  res.send(newUser);
});
// Routes

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`SERVING ON PORT ${port}`);
});
