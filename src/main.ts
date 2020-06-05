import { DPT } from "./dpt";
import { UI } from "./ui";
import { getDeviceId, getKey, loadDeviceId, loadKey } from "./loading";

let dpt: DPT;
let ui: UI;
let dpt_url: string;
let device_id: string | null = null;
let key: string | null = null;

declare global {
    let DPT_URL: string;
}


async function main() {
    dpt_url = DPT_URL;
    console.info('Using DPT url "' + dpt_url + '".');

    let hash = location.hash;
    let reset = hash === '#reset';
    if (reset) {
        localStorage.removeItem('deviceId');
        localStorage.removeItem('key');
    }

    let deviceIdEle = document.getElementById('clientID')!;
    let keyEle = document.getElementById('key')!;
    device_id = getDeviceId(deviceIdEle);
    key = getKey(keyEle);
    if (device_id === null)
        device_id = localStorage.getItem('deviceId');
    if (key === null)
        key = localStorage.getItem('key');

    if (device_id === null) {
        let deviceIdInputEle = document.getElementById('deviceIdInput')! as HTMLInputElement;
        deviceIdInputEle.parentElement!.classList.remove('nodisplay');
        deviceIdInputEle.addEventListener('input', () => loadDeviceIdStartup(deviceIdInputEle));
    }
    if (key === null) {
        let keyInputEle = document.getElementById('keyInput')! as HTMLInputElement;
        keyInputEle.parentElement!.classList.remove('nodisplay');
        keyInputEle.addEventListener('input', () => loadKeyStartup(keyInputEle));
    }
    if (device_id !== null && key !== null)
        startup();
}

async function startup() {
    let loaderEle = document.getElementById('loaderWrapper')!;
    loaderEle.classList.add('nodisplay');

    let mainEle = document.getElementById('mainWrapper')!;
    mainEle.classList.remove('nodisplay');

    console.info('Starting up...');

    dpt = new DPT(dpt_url, device_id!, key!);
    ui = new UI(dpt);
    dpt.initErrorCallback(message => ui.error(message));

    console.info('Authenticating...');
    let success = await dpt.authenticate();
    if (success) {
        console.info('Authenticated.');
        ui.load();
    }
}

async function loadDeviceIdStartup(deviceIdInputEle: HTMLInputElement) {
    if (device_id === null) {
        device_id = await loadDeviceId(deviceIdInputEle);
        if (device_id !== null)
            localStorage.setItem('deviceId', device_id);
    }
    if (device_id !== null && key !== null)
        startup();
}

async function loadKeyStartup(keyEle: HTMLInputElement) {
    if (key === null) {
        key = await loadKey(keyEle);
        if (key !== null)
            localStorage.setItem('key', key);
    }
    if (device_id !== null && key !== null)
        startup();
}

window.addEventListener('load', () => main());
