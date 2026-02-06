import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";

/* ================== ENV VARIABLES ================== */
const PORT = Number(process.env.PORT) || 3001;
const DB_URL = process.env.DB_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

const allowedOrigins = [`${process.env.FRONTEND_URL}` ,"http://localhost:5173"]

if (!DB_URL || !JWT_SECRET || !SALT_ROUNDS) {
  throw new Error("Missing required environment variables");
}

/* ================== IMPORTS ================== */
import { contentModel, linkModel, userModel } from "./db";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

/* ================== APP SETUP ================== */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://second-brain-frontend-smoky.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// VERY IMPORTANT
app.options("*", cors());

/* ================== AUTH ROUTES ================== */
app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await userModel.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({
        message: "Incorrect credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET
    );

    return res.status(200).json({
      message: "Signin successful",
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.post("/api/v1/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Username, password and email are required",
      });
    }

    const existingUser = await userModel.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(200).json({
      message: "Signup successful",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

/* ================== CONTENT ROUTES ================== */
app.post("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { title , link, type } = req.body;

    await contentModel.create({
      type,
      title,
      link,
      userId: req.userId,
      tags: [],
    });

    return res.status(200).json({
      message: "Content added",
    });
  } catch (error) {
    console.error("Create content error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const content = await contentModel
      .find({ userId: req.userId })
      .populate("userId", "username");

    return res.status(200).json({
      content,
    });
  } catch (error) {
    console.error("Fetch content error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { contentId } = req.body;

    if (!contentId) {
      return res.status(400).json({
        message: "contentId is required",
      });
    }

    const deleted = await contentModel.findOneAndDelete({
      _id: contentId,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Content not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete content error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

/* ================== BRAIN SHARE ROUTES ================== */
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  try {
    const { share } = req.body;

    if (!share) {
      await linkModel.deleteMany({ userId: req.userId });

      return res.status(200).json({
        message: "Sharable link disabled",
        hash: null,
      });
    }

    const existingLink = await linkModel.findOne({
      userId: req.userId,
    });

    if (existingLink) {
      return res.status(200).json({
        message: "Sharable link already exists",
        hash: existingLink.hash,
      });
    }

   
    const hash = random(10);

    await linkModel.create({
      userId: req.userId,
      hash,
    });

    return res.status(200).json({
      message: "Sharable link created",
      hash,
    });
  } catch (error) {
    console.error("Share link error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});


app.get("/api/v1/brain/:shareLink", async (req, res) => {
  try {
    const { shareLink } = req.params;

    const entry = await linkModel.findOne({ hash: shareLink }).populate("userId" , "username");

    if (!entry) {
      return res.status(404).json({
        message: "No data found for this link",
      });
    }

    const content = await contentModel
      .find({ userId: entry.userId })
      .populate("userId", "username");

    return res.status(200).json({
      message: "Data fetched successfully",
      content,
      entry
    });
  } catch (error) {
    console.error("Shared brain fetch error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

/* ================== SERVER START ================== */
const start = async () => {
  try {
    await mongoose.connect(DB_URL);
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
      console.log(frontendUrl);
      console.log(allowedOrigins)
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

start();
