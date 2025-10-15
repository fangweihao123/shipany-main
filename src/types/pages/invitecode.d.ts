
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

export interface InviteCodePage {
    invitecode: {
        name: string;
        upload: {
            title: string;
            description: string;
            submit: string;
            submitting: string;
            errorIncomplete: string;
            successMessage: string;
            digitAria: string;
        };
        list: {
            title: string;
            description: string;
            searchPlaceholder: string;
            loadMore: string;
            loadMoreAlert: string;
            reportAlert: string;
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
