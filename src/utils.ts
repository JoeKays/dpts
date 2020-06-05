export function getIntegerBytes(value: number) {
    const bytes = [];
    if (value > 0xffffff)
        bytes.push((value >> 24) & 0xff);
    if (value > 0xffff)
        bytes.push((value >> 16) & 0xff);
    if (value > 0xff)
        bytes.push((value >> 8) & 0xff);
    bytes.push(value & 0xff);
    console.info(value, bytes.map(x => x.toString(16)));
    return new Uint8Array(bytes);
}

export function removeKeyTags(key: string) {
    return key.replace(/-+(?:BEGIN|END)( RSA)? PRIVATE KEY-+/g, '');
}

export function trimWhitespace(input: string) {
    return input.replace(/\s/g, '');
}

export function isWhitespace(input: string) {
    return trimWhitespace(input).length === 0;
}

export function arrayEquals(a1: Uint8Array, a2: Uint8Array) {
    if (a1.length !== a2.length)
        return false;
    for (let i = 0; i < a1.length; i++)
        if (a1[i] !== a2[i])
            return false;
    return true;
}