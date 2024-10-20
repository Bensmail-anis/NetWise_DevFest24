const { defaultTo } = require("lodash")
const mongoose = require("mongoose")

const managersSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    max : {
        type : Number,
        required : true
    },
    min : {
        type : Number,
        default: 15
    },
    current : {
        type : Number
    }
}, { collection : "managers"}
)

module.exports = mongoose.model("managers", managersSchema)