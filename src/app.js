const dotenv = require("dotenv")
const express = require("express"); 
const app = express();
const mongoose = require("mongoose")  
const path = require("path")
dotenv.config({path: './config.env'})
const {connection} = require("../db/conn")
connection() 

const cookieParser = require("cookie-parser")
app.use(cookieParser())

const bodyParser = require("body-parser")
app.use(bodyParser.json())

const cors = require("cors")
app.use(cors({origin:"http://localhost:3000", credentials:true}))

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(express.json({limit:"10mb"}));
const User = require("../models/userSchema") 
const RestaurantNewUser = require("../models/userSchemaAD")
app.use(require("../router/auth"))  

const PORT = process.env.PORT || 4457;

// 3: step heroku

if(process.env.NODE_ENV == "production"){
    app.use(express.static("client/build"));
}
 
app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`)
})

