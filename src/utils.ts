import { utf8 } from "@nw55/common";

export function getDeviceId(deviceIdEle: HTMLElement) {
    if (deviceIdEle.textContent === null || isWhitespace(deviceIdEle.textContent))
        return null;
    let clientId = trimWhitespace(deviceIdEle.textContent);
    // console.info(clientId);
    return clientId;
}

export function getKey(keyEle: HTMLElement) {
    if (keyEle.textContent === null || isWhitespace(keyEle.textContent))
        return null;
    let key = trimWhitespace(removeKeyTags(keyEle.textContent!));
    console.info(key);
    return key;
}

export async function loadDeviceId(deviceIdInputEle: HTMLInputElement) {
    if (deviceIdInputEle.files !== null && deviceIdInputEle.files.length !== 0) {
        let file = deviceIdInputEle.files[0];
        let deviceId = await loadDeviceIdFromFile(file);
        console.info(deviceId);
        return deviceId;
    }
    else
        return null;
}

export async function loadKey(keyInputEle: HTMLInputElement) {
    if (keyInputEle.files !== null && keyInputEle.files.length !== 0) {
        let file = keyInputEle.files[0];
        let key = await loadKeyFromFile(file);
        console.info(key);
        return key;
    }
    else
        return null;
}

async function loadDeviceIdFromFile(file: File) {
    return trimWhitespace(utf8.getString(new Uint8Array(await file.arrayBuffer())));
}

async function loadKeyFromFile(file: File) {
    return trimWhitespace(removeKeyTags(await utf8.getString(new Uint8Array(await file.arrayBuffer()))));
}

function isWhitespace(input: string) {
    return trimWhitespace(input).length === 0;
}

function removeKeyTags(key: string) {
    return key.replace(/-+(?:BEGIN|END)( RSA)? PRIVATE KEY-+/g, '');
}

function trimWhitespace(input: string) {
    return input.replace(/[ \n]/g, '');
}
