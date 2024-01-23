const mongoose = require('mongoose');

// Define the schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  content: String,
});

// Create the model
const Contact = mongoose.model('Contact', contactSchema);

// Export the schema and model
module.exports = { contactSchema, Contact };
