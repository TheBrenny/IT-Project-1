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
router.post("/contact", (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let message = req.body.message;

    let legit = captcha.isLegitimate(req);

    if (legit) {
        // push to success
    } else {
        // throw error to client side
    }

    let scoreObject = captcha.getScoreObject(req);
    if (appConfig.session.save.doSave && !!saveData) saveData(Object.assign(scoreObject, {
        isBot: email === "bot@botmail.bot" // TODO: MAKE SURE THIS IS THE RIGHT BOTMAIL ADDRESS TO LISTEN FOR!
    }));
    if (appConfig.debug) {
        res.json({
            isBot: !legit,
            ...scoreObject
        }).end();
    } else {
        res.redirect("/");
    }
});

module.exports = router;