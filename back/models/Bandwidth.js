const mongoose = require("mongoose")

const bandwidthSchema = new mongoose.Schema({
    ip_client : {
        type : String,
        required : true
    },
    timestamp : {
        type : Date,
        default : Date.now
    },
    want : {
        type : Number,
        required : true
    },
    get : {
        type : Number,
        required : true
    },
    id_client : {
        type: mongoose.Types.ObjectId,
        ref: 'clients', 
        required: true
    }
}, { collection : "bandwidth"}
)

module.exports = mongoose.model("bandwidth", bandwidthSchema)