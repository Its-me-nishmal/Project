const mongoose = require ('mongoose')
const {url} = require('./dbconfig');

async function connect ()  {
    try {
        console.log(url);
        await mongoose.connect (
            url, {})
        console.log('connected to mongo DB');
    } catch (error) {
        console.log(error);
    }
}

module.exports = connect;