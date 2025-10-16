
import type { Section } from "@/types/blocks/section";

// ==== Types ====
export type InviteCode = {
    id: string | number;
    code: string;           // e.g. "GKC4SH"
    upvotes?: number;
    downvotes?: number;
    createdAt?: string;
};

export type UpvotedInviteCode = {
    votedCode: string[];
}

type InviteCodeSeo = {
    title: string;
    description: string;
    keywords: string[];
};

type InviteCodeKeywordSection = {
    title: string;
    description: string;
    highlights: string[];
};

export interface InviteCodePage {
    invitecode: {
        name: string;
        seo?: InviteCodeSeo;
        heroSection?: Section;
        supportingSections?: Section[];
        keywordSection?: InviteCodeKeywordSection;
        articleParagraphs?: string[];
        upload: {
            title: string;
            description: string;
            submit: string;
            submitting: string;
            errorIncomplete: string;
            errorDuplicate: string;
            errorAlreadySubmitted: string;
            errorMissingFingerprint: string;
            errorUnknown: string;
            successMessage: string;
            digitAria: string;
        };
        list: {
            title: string;
            description: string;
            limitNotice: string;
            searchPlaceholder: string;
            loadMore: string;
            loadMoreAlert: string;
            reportAlert: string;
            refresh: {
                label: string;
                loading: string;
            };
            instructions: {
                title: string;
                items: Array<{
                    text: string;
                    link?: {
                        label: string;
                        url: string;
                    };
                }>;
            };
            card: {
                title: string;
                copy: string;
                copied: string;
                copyHint: string;
                question: string;
                yes: string;
                no: string;
                report: string;
            };
        };
    };
}
