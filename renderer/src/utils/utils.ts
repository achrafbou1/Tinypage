import {URL} from "url";

export class Utils {
    /**
     * Checks if a string is a valid url
     */
    static stringIsAValidUrl(s: string) {
        try {
            new URL(s);
            return true;
        } catch (err) {
            return false;
        }
    }
}
