require("dotenv").config();

module.exports = {
    morgan: {
        stream: process.env.IS_VSCODE ? {
            write: console.log
        } : process.stdout
    },
    helmet: {},
    serverInfo: {
        host: process.env.HOST || "localhost",
        port: process.env.PORT || 80
    },
    session: {
        secret: process.env.SECRET || "thisIsSecretHaHa",
        save: {
            doSave: process.env.SAVE_SESSIONS || false,
            url: process.env.MYSQLURI || null,
            tableName: process.env.SESSION_TABLE || "sessionData"
        },
    },
    debug: !!process.env.DEBUG
};

module.exports.helmet = !process.env.GULPING ? {} : {
    contentSecurityPolicy: false
};