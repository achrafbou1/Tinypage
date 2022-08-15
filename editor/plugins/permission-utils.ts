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
        permLevel: 999
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
