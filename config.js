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
        secret: process.env.secret || "thisIsSecretHaHa"
    },
    debug: !!process.env.debug
};

module.exports.helmet = !process.env.GULPING ? {} : {
    contentSecurityPolicy: false
};