import { TrialState } from "@/types/trials/trialState";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;
const TRIAL_KEY = `${PROJECT_NAME}_app_texttrial`;
const SESSION_KEY = `${PROJECT_NAME}_app_session_texttrial`;
const MAX_TRIAL = 2000;

export function getTextTrialState(): TrialState{
    // 优先从localStorage读取
    const stored = localStorage.getItem(TRIAL_KEY);
    if(stored){
        return JSON.parse(stored);
    }
    const session_stored = sessionStorage.getItem(TRIAL_KEY);
    if(session_stored){
        return JSON.parse(session_stored);
    }

    return {
        usedCount: 0,
        maxTrial: MAX_TRIAL,
        timestamp: Date.now()
    };
}

export function canUseTextTrial(): boolean{
    const state = getTextTrialState();
    return state.usedCount < state.maxTrial;
}

export function useTextTrial(wordsCount: number): boolean{
    if(!getTextTrialState()) return false;

    const state = getTextTrialState();
    state.usedCount += wordsCount;
    
    localStorage.setItem(TRIAL_KEY, JSON.stringify(state));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    return true;
}

export function getRemainingTextTrials(): number {
    const state = getTextTrialState();
    return Math.max(0, state.maxTrial - state.usedCount);
}