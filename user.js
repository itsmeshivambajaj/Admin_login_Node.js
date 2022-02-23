const mongoose = require('mongoose')
const schema = mongoose.Schema

const userSchema = new schema({
    name: {
        type: String
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    }
}, {timestamp: true})

const user = mongoose.model('user', userSchema)
module.exports = user