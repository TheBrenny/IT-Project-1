const express = require("express");
const router = express.Router();
const sessions = require("client-sessions");
//const calc = require("./calculator");
const calc = {
    generateRSquared: (inputs) => Math.random(),
    deriveDataPoints: (obj, maxEventGap) => {
        // returns an array of arrays identifying the ***different partitions*** of user interaction

        let allEvents = [];

        // Take the values that we care about from the events received
        let arr = [];
        for (let key of Object.keys(obj)) {
            arr = obj[key];
            switch (key) {
                case "mouse":
                    // Mouse Coordinates
                    allEvents = allEvents.concat(arr.map(e => Object.assign({
                        x: e.x,
                        y: e.y,
                        time: e.time,
                        type: "mouse"
                    })));
                    break;

                case "mousePress":
                    // Mouse Press Coordinates
                    allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.timeUp - e.timeDown,
                        time: e.timeDown,
                        type: "mousePress"
                    })));
                    break;

                case "keys":
                    // Key Press length
                    allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.timeUp - e.timeDown,
                        time: e.timeDown,
                        type: "keyPress"
                    })));
                    // Key Press gap timing
                    allEvents = allEvents.concat(arr.slice(1).map((e, i) => Object.assign({ // jshint ignore:line
                        x: i,
                        y: arr[i + 1].timeDown - arr[i].timeUp, // this gives us the timing gap between two key presses
                        time: e.timeDown,
                        type: "skip"
                    })));
                    break;

                case "focus":
                    // Focus Timing
                    allEvents = allEvents.concat(arr.map((e, i) => Object.assign({
                        x: i,
                        y: e.blurTime - e.focusTime,
                        time: e.focusTime,
                        type: "focus"
                    })));
                    // Blur Timing -- Do we actually need this?
                    // allEvents.concat(arr.map((e, i) => Object.assign({
                    //     x: i,
                    //     y: e.blurTime - e.focusTime,
                    //     time: e.blurTime,
                    //     type: "focus"
                    // })));
                    break;
            }
        }

        // Sort the events based on time
        allEvents.sort((a, b) => a.time - b.time);

        // Partition the events based on type and gaps in time
        let ret = [];
        let sub = [];
        let currentTime = 0;
        let currentType = "skip";
        let currentEvent = {};
        for (let i = 0; i < allEvents.length; i++) {
            currentEvent = allEvents[i];
            if (currentEvent.type === "skip") continue; // skip the skipables

            if (currentEvent.type !== currentType) {
                if (sub.length > 0) ret.push(sub);
                sub = [currentEvent];
            } else if (currentTime - currentEvent.time >= maxEventGap) {
                if (sub.length > 0) ret.push(sub);
                sub = [currentEvent];
            } else {
                sub.push(currentEvent);
            }

            currentType = currentEvent.type;
            currentTime = currentEvent.time;
        }
        if (sub.length > 0) ret.push(sub); // add the last sub array

        // Return the ret array which has partitioned events!
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