const knex = require("../knex/knex");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide all the required data",
      });
    }
    // const secret = speakeasy.generateSecret({ length: 20 });
    const alreadyExist = await knex
      .select("user_id")
      .from("users")
      .where("user_email", email);
    if (alreadyExist.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      user_name: username,
      user_email: email,
      user_password: hashedPassword,
    };

    await knex("users").insert({
      user_name: username,
      user_email: email,
      user_password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Error on user register",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    let userExists = await knex
      .select(
        "user_id",
        "user_name",
        "user_email",
        "user_password",
        "user_secret"
      )
      .from("users")
      .where("user_email", email);

    if (userExists.length == 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const decryptPassword = await bcrypt.compare(
      password,
      userExists[0].user_password
    );

    if (!decryptPassword) {
      return res.status(403).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      {
        user_info: {
          user_id: userExists[0].user_id,
          user_email: userExists[0].user_email,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // const refreshToken = jwt.sign(
    //   {
    //     user_info: {
    //       user_id: userExists[0].user_id,
    //       user_email: userExists[0].user_email,
    //     },
    //   },
    //   process.env.REFRESH_TOKEN_SECRET,
    //   { expiresIn: "1d" }
    // );

    // const currenDate = new Date();
    // const tokenExpire = new Date(currenDate.getTime() + 24 * 60 * 60 * 1000);
    // await knex("refresh_tokens").insert({
    //   user_id: userExists[0].user_id,
    //   token: refreshToken,
    //   expires_at: tokenExpire,
    // });

    // res.cookie("jwt", refreshToken, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "Strict",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      accessToken: accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { user_id, user_email } = req;
    if (!user_id || !user_email) {
      return res.status(404).json({
        success: false,
        message: "User details not found",
      });
    }

    const getUser = await knex
      .select("user_name", "user_email", "user_secret")
      .from("users")
      .where("user_id", user_id);

    if (getUser.length == 0) {
      return res.status(404).json({
        success: false,
        message: "User details not found",
      });
    }

    let { user_secret, ...userDetails } = getUser[0];
    userDetails = {
      ...userDetails,
      user_secret_exists: user_secret == null ? false : true,
    };

    let qrCode;

    if (userDetails.user_secret_exists) {
      const parsedUserSecret = JSON.parse(user_secret);
      QRCode.toDataURL(parsedUserSecret.otpauth_url, (err, image_data) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Error generation 2FA QR Code",
          });
        }

        qrCode = image_data;
        return res.status(200).json({
          success: true,
          userDetails: { ...userDetails, qrCode: image_data },
        });
      });
      return;
    }

    return res.status(200).json({
      success: true,
      userDetails: { ...userDetails },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error getting user details",
    });
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { user_id, user_email } = req;
    const { password } = req.body;
    if (!password) {
      return res.status(404).json({
        success: false,
        message: "Please provide the required fields.",
      });
    }

    const userExists = await knex
      .select("user_password")
      .from("users")
      .where("user_id", user_id);

    if (userExists.length == 0) {
      return res.status(404).json({
        success: true,
        message: "User not found",
      });
    }

    const decryptedPassword = await bcrypt.compare(
      password,
      userExists[0].user_password
    );

    if (!decryptedPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password verified",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error while verifying password",
    });
  }
};

const enableTwoFA = async (req, res) => {
  try {
    const { user_id } = req;

    const userExists = await knex
      .select("user_id")
      .from("users")
      .where("user_id", user_id);

    if (userExists.length == 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userSecret = speakeasy.generateSecret({ length: 20 });

    await knex("users")
      .where("user_id", user_id)
      .update("user_secret", userSecret);


    return res.status(200).json({
      success: true,
      message: "2FA enabled successfully",
    });
    // });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error enabling 2 factor authentication",
    });
  }
};

const disableTwoFA = async (req, res) => {
  try {
    const { user_id } = req;

    const userExists = await knex
      .select("user_id", "user_secret")
      .from("users")
      .where("user_id", user_id);

    if (userExists.length == 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(userExists[0].user_secret == null){
      return res.status(400).json({
        success: false,
        message: "User does not have 2FA enabled",
      });
    }

    await knex("users")
      .where("user_id", user_id)
      .update("user_secret", null);


    return res.status(200).json({
      success: true,
      message: "2FA disabled successfully",
    });
    // });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error enabling 2 factor authentication",
    });
  }
};

module.exports = {
  register,
  login,
  getUserDetails,
  verifyPassword,
  enableTwoFA,
  disableTwoFA
};
