const mongoose = require ('mongoose')
const {url} = require('./dbconfig');

async function connect ()  {
    try {
        console.log(url);
        await mongoose.connect (
            url, {
            useNewUrlParser : true,
            useUnifiedTopology : true
        })
        console.log('connected to mongo DB');
    } catch (error) {
        console.log(error);
    }
}

module.exports = connect;