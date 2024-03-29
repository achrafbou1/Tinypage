type ModalIntent = "create" | "edit";

interface ProfileMember {
    userId: string,
    profileId: string,
    role: string,
    profileHandle: string,
    email: string
}

interface LinkVisit {
    link: any,
    views: any
}

type EditorProfile = Partial<Profile> & {
    themeId: string,
    customHtml: string,
    customCss: string,
    imageUrl: string,
    headline: string,
    handle: string,
    subtitle: string,
    visibility: string,
    showWatermark: boolean
};

type EditorTheme = Partial<Theme> & {
    id: string,
    label: string,
    global: boolean,
    customHtml: string | undefined,
    customCss: string | undefined
};

type EditorLink = Partial<Link> & {
    id: string,
    sortOrder: number,
    label: string,
    subtitle: string,
    customCss: string,
    url: string
};

type EditorAddon = Partial<Addon> & {
    id: string,
    userId: string,
    resourceId: string,
    type: AddonType,
    description: string,
    author: string,
    tags: string[],
    featuredSorting: number,
    price: number,
    paymentFrequency: string,
    global: boolean,
    version: string,
    createdOn: string,
    lastUpdated: string
}

type EditorAddonInstall = Partial<Addon> & {
    id: string,
    profileId: string,
    addonId: string,
    createdOn: string
}
