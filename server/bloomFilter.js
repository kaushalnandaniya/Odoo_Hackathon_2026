const crypto = require('crypto');

class BloomFilter {
    constructor(expectedItems = 10000, falsePositiveRate = 0.01) {
        this.size = this._getOptimalSize(expectedItems, falsePositiveRate);
        this.hashCount = this._getOptimalHashCount(this.size, expectedItems);
        // Using a standard JS array of booleans for simplicity (in a real prod app, use a Buffer or Redis BitField)
        this.bitArray = new Array(this.size).fill(false);
    }

    _getOptimalSize(n, p) {
        const m = -(n * Math.log(p)) / (Math.pow(Math.log(2), 2));
        return Math.ceil(m);
    }

    _getOptimalHashCount(m, n) {
        const k = (m / n) * Math.log(2);
        return Math.ceil(k);
    }

    * _hashes(item) {
        const hash1Hex = crypto.createHash('md5').update(item).digest('hex');
        const hash2Hex = crypto.createHash('sha256').update(item).digest('hex');
        
        // Convert hex to large integers (using BigInt to prevent overflow in JS)
        const hash1 = BigInt('0x' + hash1Hex);
        const hash2 = BigInt('0x' + hash2Hex);
        const sizeBig = BigInt(this.size);

        for (let i = 0n; i < BigInt(this.hashCount); i++) {
            const combined = (hash1 + i * hash2) % sizeBig;
            yield Number(combined);
        }
    }

    addUser(email) {
        const lowerEmail = email.toLowerCase();
        for (const hashVal of this._hashes(lowerEmail)) {
            this.bitArray[hashVal] = true;
        }
    }

    checkUserExists(email) {
        const lowerEmail = email.toLowerCase();
        for (const hashVal of this._hashes(lowerEmail)) {
            if (!this.bitArray[hashVal]) {
                return false;
            }
        }
        return true;
    }
}

module.exports = BloomFilter;
