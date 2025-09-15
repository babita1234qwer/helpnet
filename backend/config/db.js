const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
async function main() {
     //console.log("DB URI:", process.env.DB_CONNECT_STRING);

   await  mongoose.connect("mongodb+srv://patelsebu2006:babita12@cluster0.saubrie.mongodb.net/helpnet");}
 module.exports=main;