// Author: Neel Paranjape
//Desricption: A JS bot to filli in forms in parallel.
//date: 01/05/2021

// This code works

const puppeteer = require('puppeteer');
(
    async () => {

        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://it-project-1-dev.herokuapp.com/')

        await page.type('body > app > form > input[type=text]:nth-child(1)', 'bot')

        await page.type('body > app > form > input[type=email]:nth-child(2)', 'bot@botmail.com')

        await page.type('body > app > form > textarea', 'I am a bot')


        await page.click('body > app > form > input[type=submit]:nth-child(4)')


        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.send('Network.clearBrowserCookies')
    })();





// For some reason I am unable to get the puppeteer-cluster package to work properly
//-------------------------------------------------------------------------------------
// const {Cluster} = require('puppeteer-cluster');
//
// (async () => {
//     const cluster = await Cluster.launch({
//         headless: false, // headless mode turned off so browser actions are seen
//         concurrency: Cluster.CONCURRENCY_PAGE, // use one browser per worker
//         maxConcurrency: 4, // Open up to four pages in parallel
//     });
//
//     // Define a task to be executed for your data, this function will be run for each URL
//     await cluster.task(async ({page, data: url}) => {
//         await page.goto('https://it-project-1-dev.herokuapp.com/');
//         // filling in first 'name' field
//         await page.type('body > app > form > input[type=text]:nth-child(1)', 'bot')
//         // filling in second 'email' field
//         await page.type('body > app > form > input[type=email]:nth-child(2)', 'bot@botmail.com')
//         // filling in third 'message' box
//         await page.type('body > app > form > textarea', 'I am a bot')
//
//         // clicking submit and sending request
//         await page.click('body > app > form > input[type=submit]:nth-child(4)')
//
//         //clearing all cookies and cache from specific sessions
//         const client = await page.target().createCDPSession();
//         await client.send('Network.clearBrowserCache');
//         await client.send('Network.clearBrowserCookies')
//     });
//
//     // URL of form to fill in
//     cluster.queue('https://it-project-1-dev.herokuapp.com/');
//     // ...
//
//     // Wait for cluster to idle and close it
//     await cluster.idle();
//     await cluster.close();
// })();
//------------------------------------------------------------------------------------------