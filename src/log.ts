import * as winston from "winston";

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: "verbose",
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

class LogStream {
    public write(text: string) {
        logger.info(text);
    }
}

export const logStream = new LogStream();

export default logger;
