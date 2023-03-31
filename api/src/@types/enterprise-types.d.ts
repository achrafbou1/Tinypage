interface DbSubscription {
    user_id: string,
    tier: SubscriptionTier,
    product_id: string | null,
    created_on?: string | null,
    last_updated?: string | null
    purchase_type: 'recurring'
}

interface DbProduct {
    user_id: string,
    tier: SubscriptionTier,
    product_id: string | null,
    created_on?: string | null,
    purchase_type?: 'one_time' | 'recurring' | 'free'
}

interface DbVisit {
    type: VisitType,
    referral_id: string,
    created_on: string
}

interface DbServerCustomization {
    title: string,
    brandName: string,
    productName: string,
    company: string,
    contactEmail: string,
    icons: {
        mainIcon: string,
        favicon: string,
    },
    colors: {
        mainColor: string,
        secondaryColor: string,
        mainTextColor: string,
        secondaryTextColor: string
    },
    metaTitle: string,
    metaDescription: string,
    metaImageUrl: string,
    customHtml: string,
    customCss: string,
    metadata: any
}

interface DbServerSettings {
    mergePublicMarketplace: boolean,
    messages: {
        passwordResetEmail: string,
        inviteConfirmationEmail: string,
        referralEmail: string
    },
    metadata: any
}
