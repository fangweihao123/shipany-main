import FingerprintJS from '@fingerprintjs/fingerprintjs';
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME;
const LOCALSTORAGE_KEY = `${PROJECT_NAME}_app_fingerprint`;


export async function getFingerPrint(): Promise<string> {
    // 优先从localStorage读取
    let fingerprint : string = localStorage.getItem(LOCALSTORAGE_KEY) || "";
    if(!fingerprint){
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        fingerprint = result.visitorId;
        localStorage.setItem(LOCALSTORAGE_KEY, fingerprint);
    }
    return fingerprint;
}