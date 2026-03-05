export default function upperFirst(string) {
    if (!string) return '';
    string = String(string);
    return string.charAt(0).toUpperCase() + string.slice(1);
}
