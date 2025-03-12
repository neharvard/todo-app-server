const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // name: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
