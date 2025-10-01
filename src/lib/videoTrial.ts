import { TrialState } from "@/types/trials/trialState";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;
const TRIAL_KEY = `${PROJECT_NAME}_app_video_trial`;
const SESSION_KEY = `${PROJECT_NAME}_app_session_video_trial`;
const MAX_TRIAL = 1;

export function getVideoTrialState(): TrialState{
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

export function canUseVideoTrial(): boolean{
    const state = getVideoTrialState();
    return state.usedCount < state.maxTrial;
}

export function useVideoTrial(): boolean{
    if(!canUseVideoTrial()) return false;

    const state = getVideoTrialState();
    state.usedCount++;
    
    localStorage.setItem(TRIAL_KEY, JSON.stringify(state));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    return true;
}

export function getRemainingTrials(): number {
    const state = getVideoTrialState();
    return Math.max(0, state.maxTrial - state.usedCount);
}