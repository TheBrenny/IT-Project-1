require("dotenv").config();
process.argv.splice(0, 2);

const puppeteer = require("puppeteer");

const targetUrl = process.env.BOT_URL || (!!process.env.HOST ? `http://${process.env.HOST}:80/` : "https://it-project-1-dev.herokuapp.com/");
const name = "bot";
const email = "bot@botmail.bot";
const message = "I am a bot";

const domTargets = [
    "body > app > form > input[type=text]:nth-child(1)",
    "body > app > form > input[type=email]:nth-child(2)",
    "body > app > form > textarea",
    "body > app > form > input[type=submit]:nth-child(4)"
];

async function autofillTarget(opts) {
    let page = opts.page;
    let url = opts.data.url;

    await page.goto(url);
    await page.type(domTargets[0], name);
    await page.type(domTargets[1], email);
    await page.type(domTargets[2], message);
    await Promise.all([
        page.waitForNavigation(),
        page.click(domTargets[3])
    ]);

    // waits until we navigate before we try to reset cookies

    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCache");
    await client.send("Network.clearBrowserCookies");

    let res = "";
    try {
        res = (await page.$eval("body > pre", (e) => JSON.parse(e.textContent)));
    } catch (err) {
        res = "n/a";
    }

    return res;
}

async function singleInstance(iterations, headless) {
    const browser = await puppeteer.launch({
        headless: headless
    });

    const page = (await browser.pages())[0];

    let ret = [];
    let sequentialPromise = Promise.resolve();

    for (let iter = 0; iter < iterations; iter++) {

        sequentialPromise = sequentialPromise
            .then(async () => [iter, await autofillTarget({ //jshint ignore:line
                page: page,
                data: {
                    url: targetUrl
                }
            })])
            .then(r => ret[r[0]] = r[1]); //jshint ignore:line
    }

    sequentialPromise = sequentialPromise.catch(e => {
        console.error(e);
    });


    await sequentialPromise;
    await page.close();

    return ret;
}

async function clusterInstance(clusterSize, iterations, headless) {
    clusterSize = Math.max(1, clusterSize);
    headless = !!headless;

    let cluster = Array(clusterSize);
    for (let i = 0; i < clusterSize; i++) {
        cluster[i] = singleInstance(iterations, headless);
    }

    let retVals = await Promise.all(cluster);
    console.log(retVals);

    return retVals;
}


if (require.main == module) {
    let size = parseInt(process.argv[0]) || 1;
    let iters = parseInt(process.argv[1]) || 1;
    clusterInstance(size, iters, !!process.argv[2]);
} else {
    module.exports = {
        clusterInstance,
        singleInstance,
        autofillTarget,
    };
}