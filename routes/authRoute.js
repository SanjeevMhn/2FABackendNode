const express = require("express");
const router = express.Router();
const verifyJWT = require('../middlewares/verifyJWT')

router
  .route("/register")
  .post(require("../controllers/authController").register);
router
    .route("/login")
    .post(require("../controllers/authController").login);

router
    .route("/me")
    .get(verifyJWT,require("../controllers/authController").getUserDetails)

router
    .route("/verify-password")
    .post(verifyJWT, require("../controllers/authController").verifyPassword)

router
    .route("/enable-2fa")
    .post(verifyJWT, require("../controllers/authController").enableTwoFA)

router
    .route("/disable-2fa")
    .post(verifyJWT, require("../controllers/authController").disableTwoFA)

router
    .route("/verify-otp")
    .post(require("../controllers/authController").verifyOTP)

module.exports = router