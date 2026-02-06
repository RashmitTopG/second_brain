import mongoose, { model,Mongoose,Schema } from "mongoose";
console.log("Connected to")

const UserSchema = new Schema({

    email : {type : String , unique : true , required : true},
    username : {type : String , unique : true, required : true},
    password : {type : String , required : true}
})

export const userModel = model("User" , UserSchema);

const ContentSchema = new Schema({

    title : String,
    type : String,
    link : String,
    tags : [{
        type : mongoose.Types.ObjectId ,
        ref : 'Tag'
    }],
    userId : {
        type : mongoose.Types.ObjectId,
        ref : 'User',
        required : true
    }
})

export const contentModel = model("Content" , ContentSchema)

const LinkSchema = new Schema({
    hash : String,
    userId :{type : mongoose.Types.ObjectId , ref : 'User' , required : true , unique : true}

})

export const linkModel = model("Links" , LinkSchema); 