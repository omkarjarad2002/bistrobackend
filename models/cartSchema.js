const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    UserAddress:{
        type:String,
        required:true,
    }, 
    UserID:{
        type:String,
        required:true,
        
    },
     
    totalPrice:{
        type:String,
        required:true,
        
    },
    restaurantID:{
        type:mongoose.Schema.Types.ObjectId,
        required:true, 
    },
    date:{
        type:Date,
        default:Date.now
    },
    orderStatus:{
        type:String,
        default:"Placed",
    },
    reason:{
        type:String,
        default:"Thanks for reaching us !"
    }
})


const Cart = mongoose.model("CART",cartSchema)
module.exports = Cart;