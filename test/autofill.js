require("dotenv").config();
process.argv.splice(0, 2);

const puppeteer = require("puppeteer");

const targetUrl = !!process.env.HOST ? `http://${process.env.HOST}:80/` : "https://it-project-1-dev.herokuapp.com/";
const name = "bot";
const email = "bot@botmail.com";
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

    let res = (await page.$eval("body > pre", (e) => JSON.parse(e.textContent)));

    await page.close();

    return res;
}

async function singleInstance(headless) {
    const browser = await puppeteer.launch({
        headless: headless
    });

    const page = (await browser.pages())[0];

    return await autofillTarget({
        page: page,
        data: {
            url: targetUrl
        }
    }).catch(e => {
        page.close();
        console.error(e);
    });
}

async function clusterInstance(clusterSize, headless) {
    clusterSize = Math.max(1, clusterSize);
    headless = !!headless;

    let cluster = Array(clusterSize);
    for (let i = 0; i < clusterSize; i++) {
        cluster[i] = singleInstance(headless);
    }

    let retVals = await Promise.all(cluster);
    console.log(retVals);

    return retVals;
    // const cluster = await Cluster.launch({
    //     concurrency: Cluster.CONCURRENCY_CONTEXT,
    //     maxConcurrency: clusterSize,
    //     puppeteerOptions: {
    //         headers: false
    //     }
    // });

    // await cluster.task(autofillTarget);
    // await cluster.queue(targetUrl);

    // await cluster.idle();
    // await cluster.close();
}


if (require.main == module) {
    let size = parseInt(process.argv[0]) || 1;
    clusterInstance(size, !!process.argv[1]);
} else {
    module.exports = {
        clusterInstance,
        singleInstance,
        autofillTarget,
    };
}