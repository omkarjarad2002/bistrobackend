const jwt = require("jsonwebtoken");
const mongoose = require("mongoose")



const userSchemaAD = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:Number,
        required:true,
        unique:true
    },
    items:{
        type:Number,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    file:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    tokens:[
        {
            token:{
                type:String,
                required:true
            }
        }
    ]
})

userSchemaAD.methods.generateAuthToken = async function(){
    try {
        let generateToken = jwt.sign({_id:this._id}, process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({token : generateToken})
        await this.save();
        return generateToken;

        
    } catch (error) {
        console.log("ERROR OCCURED AT USERCHEMA OF ADD RESTAURANT IN BACKEND")
    }
}

const RestaurantNewUser = mongoose.model("RESTAURANTNEWUSER", userSchemaAD)
module.exports = RestaurantNewUser;