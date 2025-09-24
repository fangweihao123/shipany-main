import { TrialState } from "@/types/trials/trialState";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;
const TRIAL_KEY = `${PROJECT_NAME}_app_trial`;
const SESSION_KEY = `${PROJECT_NAME}_app_session_trial`;
const MAX_TRIAL = 2;

export function getTrialState(): TrialState{
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

export function canUseTrial(): boolean{
    const state = getTrialState();
    return state.usedCount < state.maxTrial;
}

export function useTrial(): boolean{
    if(!canUseTrial()) return false;

    const state = getTrialState();
    state.usedCount++;
    
    localStorage.setItem(TRIAL_KEY, JSON.stringify(state));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    return true;
}

export function getRemainingTrials(): number {
    const state = getTrialState();
    return Math.max(0, state.maxTrial - state.usedCount);
}