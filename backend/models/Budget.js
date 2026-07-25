const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    limit: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: String, // format YYYY-MM
        required: true
    }
}, { timestamps: true });

// Avoid duplicate category budgets for the same month for a user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
