const RestaurantNewUser = require("../models/userSchemaAD")
const multer = require("multer");
const { application } = require("express");
 
const Uploadfile=()=>{

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, path.join(__dirname, "../uploads"));
        },
        filename: (req, file, cb) => {
          const uniqueFileName = `${Date.now()}-${crypto
            .randomBytes(6)
            .toString("hex")}${path.extname(file.originalname)}`;
          cb(null, uniqueFileName);
        },
      });
      
      const upload = multer({ storage });
    
}

module.exports = Uploadfile;