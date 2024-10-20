const mongoose = require("mongoose")

const clientsSchema = new mongoose.Schema({
    ip_adress :{
        type : String,
        required : true
    },
    connected : {
        type : Boolean,
        required : true
    },
    max : {
        type : Number,
        default : 15
    },
    interface : {
        type : "String",
        required : true
    }
}, { collection : "clients"}
)

module.exports = mongoose.model("clients", clientsSchema)