const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omnilog';

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log(`\x1b[32m[MongoDB]\x1b[0m Connexion réussie à la base : ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Error]\x1b[0m Échec de connexion :`, error.message);
    throw error;
  }
}

module.exports = { connectDB, mongoose };
