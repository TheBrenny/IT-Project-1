// console.log("Going to use express (maybe MetorJS) to serve up a simple app that renders using Scetch.");
// console.log("Deploy to Heroku: https://devcenter.heroku.com/articles/getting-started-with-nodejs#prepare-the-app");
// DECISION MADE: Using Heroku to deploy an Electron/Node/Scetch stack! (Heroku uses Postgres instead of SQLite,
//                  so we'll need to create a driver changer for use on Heroku.)

require("./util_and_polyfill"); // only needs to be called once for the app!
// require("./db/db"); // initial load of the DB.

const config = require("./config");
const serverInfo = config.serverInfo;

// Express related stuff
const path = require('path');
const express = require('express');
const scetch = require('scetch')();
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

// Make the app
let app = express();
app.use(morgan('common', config.morgan));
app.use(helmet(config.helmet));
app.use(cors());
app.use(express.json());

let public = path.join(__dirname, "app", "public");

app.set('views', path.join(public, 'views'));
app.engine('sce', scetch.engine);
app.set('view engine', 'sce');

app.use("/assets", express.static(path.join(public, "assets")));
// app.use('/api', require('./app/api/routes'));
app.use(require('./app/public/routes'));
app.use(require('./app/errorRouter'));
app.use(require('./app/errorRouter').handler);

app.listen(serverInfo.port, serverInfo.host, () => {
    if (process.env.NODE_ENV === 'dev' && process.env.GUPLING == 'true') serverInfo.port = 81;
    console.log(`Server is listening at http://${serverInfo.host}:${serverInfo.port}...`);
});