const mongoose = require('mongoose');

const savingGoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    targetDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SavingGoal', savingGoalSchema);
