import mongoose, { model,Schema } from "mongoose";
console.log("Connected to")

const UserSchema = new Schema({

    username : {type : String , unique : true, required : true},
    password : {type : String , required : true}
})

export const userModel = model("User" , UserSchema);

const ContentSchema = new Schema({

    title : String ,
    link : String,
    tags : [{
        type : mongoose.Types.ObjectId ,
        ref : 'Tag'
    }],
    userId : {
        type : mongoose.Types.ObjectId,
        ref : 'User'
    }
})

export const contentModel = model("Content" , ContentSchema)