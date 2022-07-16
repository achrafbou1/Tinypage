import chalk from "chalk";
import fastifyInit from "fastify";
import fastify_static from "fastify-static";
import cookie, {FastifyCookieOptions} from 'fastify-cookie';
import config from "./config/config";
import {RouteHandler} from "./route-handler";
import path from "path";

const fastify = fastifyInit({logger: false});

let routeHandler = new RouteHandler(fastify);
routeHandler.registerRoutes();

fastify.register(fastify_static, {
    root: path.join(__dirname, 'static'),
    list: false,
    wildcard: false
});

fastify.register(cookie, {
    parseOptions: {}
} as FastifyCookieOptions);

// Run the server!
async function start() {
    try {
        console.clear();
        console.log(`${chalk.cyan.bold(config.appName)}: Starting application...`);

        await fastify.listen(config.port, config.host);

        console.log(`${chalk.cyan.bold(config.appName)}: Application listening on port ${config.port}`);
    } catch (err) {
        console.log(`${chalk.cyan.bold(config.appName)}: Error!`);
        console.log(`${chalk.cyan.bold(config.appName)}: ${err}`);

        process.exit(1);
    }
}

start().then(() => {
});
