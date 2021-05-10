const express = require("express");
const router = express.Router();
const sessions = require("client-sessions");
const calc = require("./calculator");
const beaconListener = new(require("events").EventEmitter)();
const savedBeacons = {};

// beaconListener.on("beacon", function (session) {
//     savedBeacons[session.sessionID] = session;
// });

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

    beaconListener.emit(session.sessionID, session);

    if (config.debug) {
        console.log(session.sessionID + ": " + session.score.toFixed(2) + "/" + session.maxScore.toFixed(2) + " = " + (session.score / session.maxScore).toFixed(2));
        res.json(getScoreObject(req));
    } else {
        res.end();
    }
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

async function ensureSession(req, timeout, checkDelay) {
    timeout = timeout || config.ensureSessionTimeout;
    checkDelay = checkDelay || config.ensureSessionCheckDelay;

    const start = new Date();
    const wait = () => new Promise((resolve) => setTimeout(resolve, checkDelay));
    while (getSession(req).similarTo({}) && (new Date() - start) < timeout) await wait().then(() => console.log(getSession(req))); //jshint ignore:line

    return (new Date() - start) < timeout;
}

async function waitForSessionOrBeacon(req, timeout) {
    let session = getSession(req);
    let resolved = false;
    const beaconHandler = (res, d) => (Object.assign(session, d), res(resolved = true));

    return new Promise((res) => {
        console.log(session);
        if (Object.keys(session).length > 1) return res(true); // if we have a session


        // Otherwise handle when a new session comes in
        let bh = beaconHandler.bind(null, res);
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
    router.use((req, res, next) => {
        createSessionIfEmpty(req);
        next();
    });
    router[config.method.toLowerCase()](config.route, handleData);

    this.router = router;
    this.isLegitimate = isLegitimate;
    this.getScoreObject = getScoreObject;
    this.clearScore = clearScore;
    this.ensureSession = ensureSession;
    this.waitForSessionOrBeacon = waitForSessionOrBeacon;
    this.createSessionIfEmpty = createSessionIfEmpty;
    return this;
};