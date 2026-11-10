module.exports = {
    server: {
        location: "ATLANTA_1",
        port: process.env.PORT || 3000
    },
    account: {
        currency: "USD"
    },
    risk: {
        maxDailyDrawdown: 0.02,
        minRiskPerTrade: 0.005,
        maxRiskPerTrade: 0.01,
        kellyFraction: 0.25,
        maxConsecutiveLosses: 2 
    },
    killzones: {
        LONDRES: { start: 3, end: 6 },
        NUEVA_YORK: { start: 8, end: 11 }
    },
    quant: {
        minRR: 2.0,
        minEV: 0.15,
        atrMultiplierSL: 1.5,
        montecarloIterations: 10000
    }
};
