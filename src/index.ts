import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { contentModel, userModel } from "./db";
import { userMiddleware } from "./middleware";

dotenv.config();

/* ================== ENV VARIABLES ================== */
const PORT = Number(process.env.PORT) || 3000;
const DB_URL = process.env.DB_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

if (!DB_URL || !JWT_SECRET || !SALT_ROUNDS) {
  throw new Error("Missing required environment variables");
}

/* ================== APP SETUP ================== */
const app = express();
app.use(express.json());

/* ================== AUTH ROUTES ================== */
app.post("/api/v1/signin", async (req, res) => {
    
    const {username , password } = req.body;
    if(!username || !password){
        return res.status(400).json({
            message : "Username and password are required"
        })
    }

    try {
        const user = await userModel.findOne({
            username
        })
    
        if(!user){
            return res.status(400).json({
                message : "User does not exist"
            })
        }
    
        const isValid = await bcrypt.compare(password, user.password)
        if(!isValid){
            return res.status(400).json({
                message : "Incorrect Credentials"
            })
        }
    
        const token = jwt.sign({
            id : user._id
        } , JWT_SECRET)
    
        return res.status(200).json({
            message : "Signin Successful",
            token : token
        })
    } catch (error) {
        console.log("Error " , error);
        return res.status(500).json({
            message : "Internal Server Error"
        })
    }
    

});

app.post("/api/v1/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  try {
    const user = await userModel.findOne({ username });

    if (user) {
      return res.status(400).json({
        message: "User Already Exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await userModel.create({
      username,
      password: hashedPassword
    });

    return res.status(200).json({
      message: "Signup Successful"
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
});


app.post("/api/v1/content", userMiddleware , async (req, res) => {
    
    const title = req.body.title
    const link = req.body.link;
    const type = req.body.type;
    
    await contentModel.create({

        title,
        link ,
        userId : req.userId,
        tags : []
    })

    return res.status(200).json({
        message : "Content Added"
    })

});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
  
      const content = await contentModel.find({
        userId
      }).populate("userId" , "username");
  
      return res.status(200).json({
        content
      });
    } catch (error) {
      console.error("Get content error:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  });
  

  app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    try {
      const contentId = req.body.contentId;
  
      if (!contentId) {
        return res.status(400).json({
          message: "contentId is required"
        });
      }
  
      const deletedContent = await contentModel.findOneAndDelete({
        _id: contentId,
        userId: req.userId
      });
  
      if (!deletedContent) {
        return res.status(404).json({
          message: "Content not found or unauthorized"
        });
      }
  
      return res.status(200).json({
        message: "Content deleted successfully"
      });
    } catch (error) {
      console.error("Delete content error:", error);
      return res.status(500).json({
        message: "Internal Server Error"
      });
    }
  });
  

app.get("/api/v1/brain/:shareLink", (req, res) => {
  return res.status(501).json({ message: "Not implemented yet" });
});

/* ================== SERVER START ================== */
const start = async () => {
  try {
    await mongoose.connect(DB_URL);
    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

start();