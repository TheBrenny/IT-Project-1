const express = require("express");
const router = express.Router();
const sessions = require("client-sessions");
const calc = require("./calculator");
// TODO: Beacon Listener should actually be a stream so we can queue messages and they wont get lost!
const beaconListener = new(require("events").EventEmitter)();
const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

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
    method: "post",
    ensureSessionTimeout: 10000,
    ensureSessionCheckDelay: 20
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

    if (config.debug) {
        console.log(session.sessionID + ": " + session.score.toFixed(2) + "/" + session.maxScore.toFixed(2) + " = " + (session.score / session.maxScore).toFixed(2));
        res.json(getScoreObject(req));
    } else {
        res.end();
    }

    Promise.resolve().then(async () => {
        let emission = () => beaconListener.emit(session.sessionID, session);
        let emissionCount = 0;

        while (!emission() && emissionCount < 100) await wait(10);
    });
}

function createSessionIfEmpty(req) {
    let session = getSession(req);
    session.sessionID = session.sessionID || generateRandomID();
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

function getScoreObject(req) {
    let session = getSession(req);

    return {
        id: session.sessionID,
        host: req.hostname,
        score: session.score,
        maxScore: session.maxScore,
        percent: session.score / session.maxScore
    };
}

async function waitForSessionOrBeacon(req, timeout) {
    timeout = timeout || config.ensureSessionTimeout;
    let session = getSession(req);
    let resolved = false;

    return new Promise((res) => {
        if (Object.keys(session).length > 1) return res(true); // if we have a session

        // Otherwise handle when a new session comes in
        const bh = (d) => {
            Object.assign(session, d);
            resolved = true;
            res(true);
        };
        beaconListener.once(session.sessionID, bh);

        setTimeout(() => {
            if (!resolved) {
                beaconListener.removeListener(session.sessionID, bh);
                res(false);
            }
        }, timeout);
    });
}

function clearScore(req, res) {
    getSession(req).destroy();
    getSession(res).destroy();
}

// Inside a function so we can pass options
module.exports = function (opts) {
    Object.assign(config, opts || {});
    // if (!!opts.debug) config.secret = ""; // we can't unset thje secret.

    router.use(sessions(config));
    router.use(express.json());
    router.use((req, _res, next) => {
        createSessionIfEmpty(req);
        next();
    });
    router[config.method.toLowerCase()](config.route, handleData);

    this.router = router;
    this.isLegitimate = isLegitimate;
    this.getScoreObject = getScoreObject;
    this.clearScore = clearScore;
    this.waitForSessionOrBeacon = waitForSessionOrBeacon;
    this.createSessionIfEmpty = createSessionIfEmpty;
    return this;
};