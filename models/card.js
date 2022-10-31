const mongoose = require("mongoose");

const cardschema = mongoose.Schema(
    {
        title: {type: String, required: true},
        description: {type: String, required: false},
        board: {type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true},
        members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    }
);

module.exports = mongoose.model('Card', cardschema);
