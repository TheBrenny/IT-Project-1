const express = require("express");
const router = express.Router();
const sessions = require("client-sessions");
//const calc = require("./calculator");
const calc = {
    generateRSquared: (inputs) => Math.random(),
    deriveDataPoints: (obj) => {
        // returns an array of arrays identifying the ***different partitions*** of user interaction
        // TODO: Make it so there actually are different partitions -- maybe by splitting into sub arrays based on timings from different events?

        let ret = [];
        let arr = [];
        for (let key of Object.keys(obj)) {
            arr = obj[key];
            switch (key) {
                case "mouse":
                    ret.push(arr.map(e => Object.assign({
                        x: e.x,
                        y: e.y
                    })));
                    break;

                case "mousePress":
                    ret.push(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.timeUp - e.timeDown
                    })));
                    break;

                case "keys":
                    ret.push(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.timeUp - e.timeDown
                    })));
                    ret.push(arr.slice(1).map((_, i) => Object.assign({ // jshint ignore:line
                        x: i,
                        y: arr[i+1].timeDown - arr[i].timeUp // this gives us the timing gap between two key presses
                    })));
                    break;

                case "focus":
                    ret.push(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.blurTime - e.focusTime
                    })));
                    break;
            }
        }

        return ret;
    }
};

let config = {
    cookieName: "silentCaptcha",
    secret: "silentCaptchaSecret",
    duration: 3600000, // sets the expiry date
    activeDuration: 300000, // extends the expiry date if required
    keyLength: 20,
    threshold: 0.5,
    route: "/captcha",
    debug: false,
};

function handleData(req, res) {
    session = getSession(req);
    if (!session.sessionID) session.sessionID = generateRandomID();

    // TODO: separate the data into likely chunks based on time?
    let dataPoints = calc.deriveDataPoints(req.body);

    let score = 0;
    let maxScore = 0;

    for (let dp of dataPoints) {
        if (dp.length > 3) {
            score += calc.generateRSquared(dp);
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