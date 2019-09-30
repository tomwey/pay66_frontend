export function formatWan(money) {
    if (!money) return '--';

    if (money === '--') return '--';

    let val = parseFloat(money);
    if (val === 0.0) return '0.00';

    if (money < 10000) return money;

    const res = (val / 10000.0).toFixed(2);

    return `${res}万`;
}

export function calcFileSize(size) {
    // console.log(size);
    if (size <= 0) return '0';
    if (size < 1000) return `${size} B`;
    if (size < 1000000) return `${(size / 1024.0).toFixed(1)} KB`;

    return `${(size / 1024.0 / 1024.0).toFixed(2)} MB`;
}