import { utf8 } from "@nw55/common";
import { trimWhitespace, isWhitespace } from "./utils";
import { prepareKey } from "./pkcs";

export function getDeviceId(deviceIdEle: HTMLElement) {
    if (deviceIdEle.textContent === null || isWhitespace(deviceIdEle.textContent))
        return null;
    return trimWhitespace(deviceIdEle.textContent);
}

export function getKey(keyEle: HTMLElement) {
    if (keyEle.textContent === null || isWhitespace(keyEle.textContent))
        return null;
    return prepareKey(keyEle.textContent!);
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
        return key;
    }
    else
        return null;
}

async function loadDeviceIdFromFile(file: File) {
    return trimWhitespace(utf8.getString(new Uint8Array(await helperLoadFile(file))));
}

async function loadKeyFromFile(file: File) {
    let key = new Uint8Array(await helperLoadFile(file));
    let keyPKCS8 = prepareKey(utf8.getString(key));
    return keyPKCS8;
}

async function helperLoadFile(file: File) {
    let reader = new FileReader();
    return new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onerror = () => {
            reader.abort();            
            reject(new DOMException("Error loading file as ArrayBuffer."));
        };
        reader.onload = () => resolve(reader.result! as ArrayBuffer);
        reader.readAsArrayBuffer(file);
    });
}
