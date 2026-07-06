const hexString = "48656c6c6f"; // Hello
console.log(Buffer.from(hexString, 'hex').toString('base64'));
