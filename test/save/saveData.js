const config = require("../../config");
if (!config.session.save.doSave) return;

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const tableName = config.session.save.tableName;

const dbPromise = mysql.createConnection(config.session.save.url);

// Run the install - it only builds tables "if not exist"
dbPromise.then(db => {
    return db.query(fs.readFileSync(path.join(__dirname, "dbInstall.sql")).toString().replace("{{table_name}}", tableName));
});

async function saveData(data) {
    let db = await dbPromise;

    let cols = Object.keys(data).join(", ");
    let vals = JSON.stringify(Object.values(data)).substring(1, -1);

    if (config.debug) console.log(`INSERT INTO ${tableName} (${cols}) VALUES (${vals})`);

    let result = await db.query(`INSERT INTO ${tableName} (${cols}) VALUES (${vals})`);
    return result[0].insertId;
}

module.exports = {
    saveData,
};