import {DatabaseService} from "./database-service";
import {DatabaseManager} from "../data/database-manager";
import {HttpError} from "../utils/http-error";
import {StatusCodes} from "http-status-codes";

export class EnterpriseSettingsService extends DatabaseService {
    constructor(databaseManager: DatabaseManager) {
        super(databaseManager);
    }

    private static createEmptyCustomization(): DbServerCustomization {
        return {
            metaDescription: "",
            metaImageUrl: "",
            metaTitle: "",
            brandName: "",
            colors: {mainColor: "", mainTextColor: "", secondaryColor: "", secondaryTextColor: ""},
            company: "",
            contactEmail: "",
            customCss: "",
            customHtml: "",
            icons: {favicon: "/sl-icon.svg", mainIcon: "/sl-icon.svg"},
            metadata: undefined,
            productName: "",
            title: ""
        };
    }

    private static createEmptySettings(): DbServerSettings {
        return {
            mergePublicMarketplace: false,
            messages: {inviteConfirmationEmail: "", passwordResetEmail: "", referralEmail: ""},
            metadata: undefined
        };
    }

    async setSettings(customization?: DbServerCustomization, settings?: DbServerSettings) {
        let queryResult = await this.pool.query<{ public_settings: DbServerCustomization, private_settings: DbServerSettings }>(
            "update enterprise.customization set public_settings=coalesce($1, public_settings), private_settings=coalesce($2, private_settings) returning *",
            [JSON.stringify(customization), JSON.stringify(settings)]
        );

        if (queryResult.rowCount < 1)
            throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, "The settings could not be changed.");

        return {
            customization: queryResult.rows[0].public_settings,
            settings: queryResult.rows[0].private_settings
        };
    }

    async getAdminSettings(): Promise<{ customization: DbServerCustomization, settings: DbServerSettings }> {
        let queryResult = await this.pool.query<{ public_settings: DbServerCustomization, private_settings: DbServerSettings }>(
            "select * from enterprise.customization",
        );

        if (queryResult.rowCount < 1)
            return {
                customization: EnterpriseSettingsService.createEmptyCustomization(),
                settings: EnterpriseSettingsService.createEmptySettings()
            };

        return {
            customization: queryResult.rows[0].public_settings,
            settings: queryResult.rows[0].private_settings
        };
    }

    async getSettings() {
        let queryResult = await this.pool.query<{ public_settings: DbServerCustomization }>(
            "select public_settings from enterprise.customization",
        );

        if (queryResult.rowCount < 1)
            return {
                customization: EnterpriseSettingsService.createEmptyCustomization(),
            };

        return {
            customization: queryResult.rows[0].public_settings,
        };
    }
}
