exports.config = {
    helpers: {
        WebDriverIO: {
            host: process.env.SELENIUM_HOST || '127.0.0.1',
            port: process.env.SELENIUM_PORT || 4444,
            url: process.env.APP_URL || 'http://localhost:3000',
            browser: 'chrome',
            desiredCapabilities: {
                chromeOptions: {
                    args: [ "--headless", "--disable-gpu" ]
                }
            }
        }
    },
    tests: "./acceptance/**/*.js",
    timeout: 10000,
    output: "/tmp/output"
};
