const express = require("express");
const router = express.Router();
const sessions = require("client-sessions");
const calc = require("./calculator");

let config = {
    cookieName: "silentCaptcha",
    secret: "silentCaptchaSecret",
    duration: 3600000, // sets the expiry date
    activeDuration: 300000, // extends the expiry date if required
    keyLength: 20,
    threshold: 0.5,
    route: "/captcha",
    debug: false,
    maxEventGap: 1500,
};

function handleData(req, res) {
    session = getSession(req);
    if (!session.sessionID) session.sessionID = generateRandomID();

    let dataPoints = calc.deriveDataPoints(req.body, config.maxEventGap);

    let score = 0;
    let maxScore = 0;

    for (let dp of dataPoints) {
        if (dp.length > 3) {
            score += calc.getEfficiency(dp);
            maxScore += 1;
        }
    }

    session.score = (session.score || 0) + score;
    session.maxScore = (session.maxScore || 0) + maxScore;

    if (config.debug) console.log(session.sessionID + ": " + session.score.toFixed(2) + "/" + session.maxScore.toFixed(2) + " = " + (session.score / session.maxScore).toFixed(2));
    res.json({
        score: session.score,
        maxScore: session.maxScore,
        percent: session.score / session.maxScore
    });
}

function getSession(req) {
    if (!req[config.cookieName]) req[config.cookieName] = {}; // safety check but this might break something?
    return req[config.cookieName];
}

function isLegitimate(req) {
    let session = getSession(req);
    let score = session.score;
    let maxScore = session.maxScore;

    return score / maxScore < config.threshold;
}

function generateRandomID() {
    return [...Array(config.keyLength).keys()].map(() => Math.floor(Math.random() * 36).toString(36)).join("");
}

// Inside a function so we can pass options
module.exports = function (opts) {
    Object.assign(config, opts || {});

    router.use(sessions(config));
    router.post(config.route, handleData);

    this.router = router;
    this.isLegitimate = isLegitimate;
    return router;
};
