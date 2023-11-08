const mongoose = require ('mongoose')
const {url} = require('./dbconfig');

async function connect ()  {
    try {
        console.log(url);
        mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
          console.log('CONNECTED')
    } catch (error) {
        console.log(error);
    }
}

module.exports = connect;