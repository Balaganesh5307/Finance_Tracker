const Config = require('../models/Config');

const getConfigValue = async (key, fallback) => {
    try {
        const config = await Config.findOne({ key: key.trim() });
        return config && config.value ? config.value : fallback;
    } catch (err) {
        console.error(`[Config Service] Error loading key ${key}:`, err.message);
        return fallback;
    }
};

module.exports = {
    getConfigValue
};
