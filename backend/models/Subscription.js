const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense']
    },
    category: {
        type: String,
        required: true,
        default: 'Other'
    },
    frequency: {
        type: String,
        required: true,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    nextBillingDate: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
