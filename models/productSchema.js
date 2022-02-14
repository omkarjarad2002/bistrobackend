const mongoose = require("mongoose")


const productSchema = new mongoose.Schema({
    name:{
        type:String 
    },
    price:{
        type:Number 
    }, 
    quentity:{
        type:Number 
    },
    type:{
        type:String
    }, 
    file:{
        type:String
    },
    restaurantID:{
        type:mongoose.Schema.Types.ObjectId 
    },
    date:{
        type:Date,
        default:Date.now
    }
})


const Product = mongoose.model("PRODUCT", productSchema)
module.exports = Product;