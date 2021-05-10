const express = require("express");
const router = express.Router();
const appConfig = require("./../../config");
const captcha = require("./captcha/captcha")({
    route: "/captcha",
    debug: appConfig.debug,
    secret: appConfig.session.secret
});

// In case we can't acually require the item - this souldn't be
// an issue though if we package up the required files for production.
const saveData = (() => {
    try {
        return require("../../test/save/saveData").saveData;
    } catch (e) {
        return null;
    }
})();

function getPageData(req, _) {
    let part = req.url.substring(1);
    let nextSlash = part.indexOf("/");
    if (nextSlash >= 0) part = part.substring(0, nextSlash);

    return {
        page: part
    };
}

router.use(captcha.router);

// ====== HOME ======
router.get(["/", "/home"], (req, res) => {
    res.render("home", {
        ...getPageData(req, res),
    });
});

// ====== RECEIVE FORM ======
router.post("/contact", async (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let message = req.body.message;

    if (!(await captcha.waitForSessionOrBeacon(req))) {
        res.status(403).json({
            message: "You must have a session, or have sent session data before you can proceed.",
            success: false,
            code: 403,
        });
        return;
    }

    let legit = captcha.isLegitimate(req);

    if (legit) {
        // push to success
    } else {
        // throw error to client side
    }

    let scoreObject = captcha.getScoreObject(req);
    console.log("qwertyuiopqwertyuiopqwertyuiopqwertyuiop");
    console.log(scoreObject);
    if (appConfig.session.save.doSave && !!saveData) {
        saveData(Object.assign(scoreObject, {
            isBot: email === "bot@botmail.bot" // TODO: MAKE SURE THIS IS THE RIGHT BOTMAIL ADDRESS TO LISTEN FOR!
        }));
    }
    if (appConfig.debug) {
        res.json({
            isBot: !legit,
            ...scoreObject
        }).end();
    } else {
        if (appConfig.testing) captcha.clearScore(req, res);
        res.redirect("/");
    }
});

module.exports = router;