import {StatusCodes} from "http-status-codes";
import {Pool} from "pg";
import {HttpError} from "./http-error";

export class Permission {
    static FREE: Permission = {
        name: "free",
        permLevel: 0
    };

    static PRO: Permission = {
        name: "pro",
        permLevel: 2
    };

    static GODMODE: Permission = {
        name: "godmode",
        permLevel: 30
    };

    static ADMIN: Permission = {
        name: "admin",
        permLevel: 999,
    };

    name: string = 'free';
    permLevel: number = 0;

    static parse(s: string): Permission {
        switch (s) {
            case "pro":
                return Permission.PRO;
            case "godmode":
                return Permission.GODMODE;
            case "admin":
                return Permission.ADMIN;
            default:
                return Permission.FREE;
        }
    }
}

export class PermissionUtils {
    /**
     * Private pool instance for Security Utils.
     * @private
     */
    private static pool: Pool;

    /**
     * Initialize Security Utils.
     * @param pool
     */
    static initialize(pool: Pool) {
        this.pool = pool;
    }

    static async getRoleForMember(profileId: string, memberId: string) {
        let queryResult = await this.pool.query<{ role: string }>("select role from enterprise.profile_members where user_id=$1 and profile_id=$2",
            [
                memberId,
                profileId
            ]);

        if (queryResult.rowCount < 1)
            return null;

        return queryResult.rows[0].role;
    }

    /**
     * Checks if the user has the required permission level.
     */
    static async hasPermission(userId: string, required: Permission): Promise<boolean> {
        let userPerm = await this.getCurrentPermission(userId);

        return userPerm.permLevel >= required.permLevel;
    }

    /**
     * Checks if the user has the required permission level.
     */
    static async getCurrentPermission(userId: string): Promise<Permission> {
        if (await this.isGodMode(userId)) {
            return Permission.GODMODE;
        }

        let sub = await this.getSubscription(userId);
        let dbProduct = await this.getGreatestProductPurchase(userId);

        let subPermission = Permission.parse(sub.tier);
        let purchasePermission = Permission.parse(dbProduct.tier);

        return purchasePermission.permLevel > subPermission.permLevel ? purchasePermission : subPermission;
    }

    static async getSubscription(userId: string): Promise<DbSubscription> {
        let queryResult = await this.pool.query<DbSubscription>("select * from enterprise.subscriptions where user_id=$1", [userId]);

        if (queryResult.rowCount > 0) {
            let row = queryResult.rows[0];
            row.purchase_type = 'recurring';
            return row;
        }

        return {
            user_id: userId,
            tier: "free",
            product_id: null,
            created_on: null,
            last_updated: null,
            purchase_type: 'recurring'
        };
    }

    /**
     * Returns true if the account has unlimited access to everything.
     * @param userId
     */
    static async isGodMode(userId: string) {
        let queryResult = await this.pool.query("select 1 from enterprise.god_mode where user_id=$1", [userId]);

        if (queryResult.rowCount > 0)
            return true;

        let adminCheck = await this.pool.query("select 1 from app.perm_groups where user_id=$1 and group_name='admin'", [userId]);

        return adminCheck.rowCount > 0;
    }

    static async listGodModeUsers() {
        let queryResult = await this.pool.query<{ user_id: string }>("select * from enterprise.god_mode");

        return queryResult.rows;
    }

    /**
     * Returns true if the account has unlimited access to everything.
     * @param userId
     * @param godMode
     */
    static async setGodMode(userId: string, godMode: boolean) {
        if (godMode) {
            await this.pool.query<{ user_id: string }>("insert into enterprise.god_mode(user_id) values($1) on conflict do nothing");
        } else {
            await this.pool.query<{ user_id: string }>("delete from enterprise.god_mode where user_id=$1", [userId]);
        }
    }

    static async getGreatestProductPurchase(userId: string): Promise<DbProduct> {
        let queryResult = await this.pool.query<DbProduct>("select * from enterprise.products where user_id=$1", [userId]);
        let greatest: DbProduct = {
            user_id: userId,
            tier: "free",
            product_id: null,
            created_on: null,
            purchase_type: 'free'
        };

        for (let row of queryResult.rows) {
            let permission = Permission.parse(row.tier);

            if (permission.permLevel > Permission.parse(greatest.tier).permLevel) {
                greatest.tier = row.tier;
                greatest.product_id = row.product_id;
                greatest.created_on = row.created_on;
                greatest.purchase_type = "recurring";
            }
        }

        return greatest;
    }

    static async hasPurchasedProduct(userId: string, tier: SubscriptionTier) {
        let queryResult = await this.pool.query("select 1 from enterprise.products where user_id=$1 and tier=$2", [userId, tier]);

        return queryResult.rowCount > 0;
    }

    static async listProductPurchases(tier: SubscriptionTier) {
        let queryResult = await this.pool.query<{ user_id: string }>("select * from enterprise.products where tier=$1", [tier]);

        return queryResult.rows;
    }

    /**
     * Records the product purchase into the database.
     *
     * @param user
     * @param tier
     * @param productId
     */
    static async addProductPurchase(user: User, tier: SubscriptionTier, productId: string) {
        let queryResult = await this.pool.query<DbUser>("insert into enterprise.products(user_id, tier, product_id) values ($1, $2, $3) returning *",
            [
                user.id,
                tier,
                productId
            ]);

        if (queryResult.rowCount <= 0) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");
        }
    }

    static async removeProductPurchase(user: User, tier: SubscriptionTier, productId: string) {
        let queryResult = await this.pool.query<DbUser>("delete from enterprise.products where user_id=$1 and tier=$2 and product_id=$3 returning *",
            [
                user.id,
                tier,
                productId
            ]);

        if (queryResult.rowCount <= 0) {
            throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");
        }
    }

}
