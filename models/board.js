const mongoose = require('mongoose');

const boardschema = mongoose.Schema(
    {
        name: {type: String, required: true},
        description: {type: String, required: false},
        owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
        doingCards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Card'}],
        doneCards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Card'}],
        todoCards: [{type: mongoose.Schema.Types.ObjectId, ref: 'Card'}]
    }
);

boardschema.pre('remove', function(next) {
        this.model('Card').deleteMany({board: this._id}, next);
});

module.exports = mongoose.model('Board', boardschema);
