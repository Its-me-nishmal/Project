const mongoose = require('mongoose');
const { url } = require('./dbconfig');

// Set up error handling for the Mongoose connection
mongoose.connection.on('error', (error) => {
  console.error('Mongoose connection error:', error);
});
const connect = async() =>{
    try {
        console.log(url);
        await mongoose.connect(url);
        console.log('MongoDB connected successfully');
      } catch (error) {
        console.error('Error connecting to MongoDB:', error);
      }
}

module.exports = connect;
