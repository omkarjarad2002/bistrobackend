const mongoose = require("mongoose");
const DB = process.env.DATABASE;

const connection = async (req, res) => {
  try {
    const response = await mongoose.connect(DB);

    if (response) {
      console.log("Connection successful");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = { connection };
