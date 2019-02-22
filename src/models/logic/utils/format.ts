export function strip0xPrefix(hash: string) {
    if (hash.startsWith("0x")) {
        return hash.substr(2);
    }
    return hash;
}
