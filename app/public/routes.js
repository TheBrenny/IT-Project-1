const express = require("express");
const router = express.Router();
const appConfig = require("./../../config");
const captcha = require("./captcha/captcha")({
    route: "/captcha",
    debug: appConfig.debug,
    secret: appConfig.session.secret
});

function getPageData(req, _) {
    let part = req.url.substring(1);
    let nextSlash = part.indexOf("/");
    if (nextSlash >= 0) part = part.substring(0, nextSlash);

    return {
        page: part
    };
}

// ====== SET CAPTCHA URL HERE ======
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

    if(appConfig.debug) {
        res.json({
            isBot: !legit
        }).end();
    } else {
        res.redirect("/");
    }
});

module.exports = router;