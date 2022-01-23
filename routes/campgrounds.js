const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const Campground = require("../models/campground");
const campgrounds = require("../controllers/campgrounds");

const {
  isLoggedIn,
  validateCampground,
  isAuthor,
} = require("../middleware.js");

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(
    validateCampground,
    isLoggedIn,
    catchAsync(campgrounds.createCampground)
  );
// To create a new campground
// If this route is placed after "/campgrounds/:id" route, then the new route will not be reached
// because browser assumes the new word as an ID and search for new in the database
// So this route is placed before the show route
router.get("/new", isLoggedIn, campgrounds.renderNewForm);


router.route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(
    isLoggedIn,
    isAuthor,
    catchAsync(campgrounds.deleteCampground)
  );

// To edit a campground
router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
