import {DatabaseManager} from "./data/database-manager";
import {SingleLinkServer} from "./singlelink-server";
import {AnalyticsController} from "./controllers/analytics-controller";
import {LinkController} from "./controllers/link-controller";
import {ProfileController} from "./controllers/profile-controller";
import {ThemeController} from "./controllers/theme-controller";
import {UserController} from "./controllers/user-controller";
import {InfoController} from "./controllers/info-controller";
import {Auth} from "./utils/auth";
import {CustomDomainHandler} from "./utils/custom-domain-handler";
import {AdminController} from "./controllers/admin-controller";
import {AuthController} from "./controllers/auth-controller";
import {SecurityUtils} from "./utils/security-utils";
import {JobSystem} from "./jobs/job-system";
import {DbLocks} from "./utils/db-locks";
import {SubscriptionController} from "./controllers/subscription-controller";
import {StripeCallbacksController} from "./controllers/stripe-callbacks-controller";
import {EnterpriseSettingsController} from "./controllers/enterprise-settings-controller";
import {ScreenshotUtils} from "./utils/screenshot-utils";
import {LogUtils} from "./utils/log-utils";
import {MarketplaceController} from "./controllers/marketplace-controller";
import {config} from "./config/config";
import {ProfileSerializer} from "./utils/profile-serializer";
import {PermissionUtils} from "./utils/permission-utils";
import {TeamController} from "./controllers/team-controller";

console.log("Initializing Tinypage Enterprise");

let server: SingleLinkServer = new SingleLinkServer();
let database = new DatabaseManager();

start().then(() => {
    // do nothing
});

async function start() {
    await database.initialize();

    // Tinypage Utils
    // Initialize Lock System
    await DbLocks.initialize(database.pool);

    // Initialize Utilities
    Auth.initialize(database.pool);
    SecurityUtils.initialize(database.pool);
    CustomDomainHandler.initialize(database.pool);
    LogUtils.initialize(database.pool);
    ProfileSerializer.initialize(database.pool);
    PermissionUtils.initialize(database.pool);

    // Initialize screenshot API
    await ScreenshotUtils.initialize();

    // Initialize Job System
    await JobSystem.initialize(database.pool);

    // Tinypage main controllers
    server.addController(new AnalyticsController(server.fastify, database));
    server.addController(new AuthController(server.fastify, database));
    server.addController(new LinkController(server.fastify, database));
    server.addController(new ProfileController(server.fastify, database));
    server.addController(new ThemeController(server.fastify, database));
    server.addController(new UserController(server.fastify, database));
    server.addController(new TeamController(server.fastify, database));

    // Management controllers
    server.addController(new MarketplaceController(server.fastify, database));

    // Admin controllers
    server.addController(new AdminController(server.fastify, database));

    // Load Enterprise features
    if (config.payments.stripeSecret && config.payments.stripeWebhookSecret) {
        server.addController(new SubscriptionController(server.fastify, database));
        server.addController(new StripeCallbacksController(server.fastify, database));
    }

    server.addController(new EnterpriseSettingsController(server.fastify, database));

    // Server utility controllers
    server.addController(new InfoController(server.fastify, database));

    server.startServer();
}
