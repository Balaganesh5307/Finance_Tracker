const mongoose = require('mongoose');

const aiUsageLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    apiType: {
        type: String,
        enum: ['groq', 'gemini'],
        required: true
    },
    modelName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    promptTokens: {
        type: Number,
        default: 0
    },
    completionTokens: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('AIUsageLog', aiUsageLogSchema);
