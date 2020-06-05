import { base64 } from '@nw55/common';
import { getIntegerBytes, removeKeyTags, trimWhitespace } from './utils';

const fixedBytes = new Uint8Array([
    0x02, 0x01, 0x00, 0x30, 0x0D, 0x06, 0x09, 0x2A,
    0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01,
    0x05, 0x00, 0x04
]);

export class PKCS1Converter {
    // algorithm by @nw55 (Niklas Werner)
    static toPKCS8(key: Uint8Array) {
        const data = key;
        const embeddedLength = data.length;
        const totalLength = embeddedLength + 22;
        const embeddedLengthBytes = getIntegerBytes(embeddedLength);
        const totalLengthBytes = getIntegerBytes(totalLength);
        const outputData = new Uint8Array(totalLength + totalLengthBytes.length + 2);
        let i = 0;
        outputData[i++] = 0x30;
        outputData[i++] = 0x80 | totalLengthBytes.length;
        outputData.set(totalLengthBytes, i);
        i += totalLengthBytes.length;
        outputData.set(fixedBytes, i);
        i += fixedBytes.length;
        outputData[i++] = 0x80 | embeddedLengthBytes.length;
        outputData.set(embeddedLengthBytes, i);
        i += embeddedLengthBytes.length;
        outputData.set(data, i);
        return outputData;
    }

    static toPKCS8Str(key: Uint8Array) {
        return base64.getString(this.toPKCS8(key));
    }

    static strToPKCS8(keyString: string) {
        return this.toPKCS8(base64.getBytes(keyString));
    }

    static strToPKCS8Str(keyString: string) {
        let data = this.strToPKCS8(keyString);
        return base64.getString(data);
    }
}

export function prepareKey(key: string) {
    let keyPKCS8;
    if (key[0] !== '-') // could be the raw base64 data -> we assume pkcs1 (this is arbitrary)
        keyPKCS8 = PKCS1Converter.strToPKCS8Str(key);
    else if ((key.slice(11, 14) === 'RSA')) // it's a pkcs1 key
        keyPKCS8 = PKCS1Converter.strToPKCS8Str(trimWhitespace(removeKeyTags(key)));
    else if (key.slice(11, 18) === 'PRIVATE') // it's probably already pkcs8
        keyPKCS8 = trimWhitespace(removeKeyTags(key));
    else {
        console.error('Error: Not a valid key format!');
        return null;
    }
    return keyPKCS8;
}
