"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBitcoinCoreWallet = exports.bitcoinWallet = exports.BitcoinCoreWallet = void 0;
const Client = require("bitcoin-core");
const wallet_provider_1 = require("../wallet_provider");
const ecc = __importStar(require("tiny-secp256k1"));
const ecpair_1 = __importDefault(require("ecpair"));
const bitcoin = require('bitcoinjs-lib');
bitcoin.initEccLib(ecc);
const ECPair = (0, ecpair_1.default)(ecc);
function convertBtcKvBToSatoshiPerByte(btcPerKvB) {
    const satoshiPerKB = btcPerKvB * 100000000; // 从 BTC/kvB 转换为 satoshi/kB
    const satoshiPerByte = satoshiPerKB / 1000; // 从 satoshi/kB 转换为 satoshi/byte
    return satoshiPerByte;
}
class BitcoinCoreWallet extends wallet_provider_1.WalletProvider {
    constructor(walletName, host, port, username, password, network) {
        super();
        this.client = new Client({
            wallet: walletName,
            network,
            username,
            password,
            host,
            port,
        });
        //this.client.walletPassphrase("btcstaker", 3600);
    }
    async dumpPrivKey(address) {
        let addr = address || await this.getAddress();
        let privateKey = await this.client.dumpPrivKey(addr);
        console.log("private key: ", privateKey, privateKey.toString("hex"));
        return ECPair.fromWIF(privateKey, bitcoin.networks.regtest);
    }
    async getTransaction(txid) {
        return await this.client.getTransaction(txid);
    }
    async connectWallet() {
        'use server';
        // Attempt to get the wallet info to check if the client can connect to the node
        try {
            const walletInfo = await this.client.getWalletInfo();
            console.log(walletInfo); // log to verify connection
            return walletInfo;
            // return this;
        }
        catch (error) {
            throw new Error('Failed to connect to Bitcoin Core: ' + error.message);
        }
    }
    async getNetwork() {
        return wallet_provider_1.Network.RETEST;
    }
    on(eventName, callBack) {
        this.client.on(eventName, callBack);
    }
    async getWalletProviderName() {
        return "bitcoin_core";
    }
    async getAddress() {
        // Check if an address with a specific label exists
        const label = "primary";
        const addresses = await this.client.listReceivedByAddress();
        if (addresses.length > 0 && addresses[0].address) {
            return addresses[0].address;
        }
        else {
            // If no address with this label, create a new taproot address and label it
            const newAddress = await this.client.getNewAddress(label, 'bech32');
            console.log("Taproot Address:", newAddress);
            return newAddress;
        }
    }
    async getNewAddress() {
        // Check if an address with a specific label exists
        const label = "primary";
        const addresses = await this.client.listReceivedByAddress(0, true, true, label);
        if (addresses.length > 0 && addresses[0].address) {
            return addresses[0].address;
        }
        else {
            // If no address with this label, create a new taproot address and label it
            const newAddress = await this.client.getNewAddress(label, "bech32m");
            console.log("Taproot Address:", newAddress);
            return newAddress;
        }
    }
    async getPublicKeyHex() {
        // Example of retrieving the public key of the first address in the wallet
        const address = await this.getAddress();
        const validateAddressInfo = await this.client.validateAddress(address);
        return validateAddressInfo.pubkey;
    }
    async getPublicKey(address) {
        // Example of retrieving the public key of the first address in the wallet
        const res = await this.client.getAddressInfo(address);
        return res.pubkey;
    }
    async signPsbtFromBase64(psbtBase64, ecPairs, shouldExtractTransaction) {
        /*
        if (ecPairs.length == 0) {
            let walletPrv = await this.dumpPrivKey();
            ecPairs.push(walletPrv)
        }
        */
        const psbt = bitcoin.Psbt.fromBase64(psbtBase64);
        for (let i = 0; i < psbt.inputCount; i++) {
            ecPairs.forEach(ecPair => {
                psbt.signInput(i, ecPair);
            });
        }
        /*
        ecPairs.forEach(ecPair => {
          for (let i = 0; i < psbt.inputCount; i++) {
            if (!psbt.validateSignaturesOfInput(i, ecPair.publicKey)) {
              throw new Error(`Invalid signature for input ${i}`);
            }
          }
        });
        */
        if (shouldExtractTransaction) {
            psbt.finalizeAllInputs();
            const transaction = psbt.extractTransaction();
            return transaction.toHex();
        }
        else {
            return psbt.toBase64();
        }
    }
    async mine(num, addr) {
        await this.client.generateToAddress(num, addr);
    }
    async signPsbt(psbtHex) {
        console.log('Signing PSBT with hex:', psbtHex);
        const signedPsbt = await this.client.walletProcessPsbt(Buffer.from(psbtHex, 'hex').toString('base64'));
        console.log('Signed PSBT:', signedPsbt);
        if (!signedPsbt.complete) {
            console.error('PSBT signing incomplete');
        }
        return Buffer.from(signedPsbt.psbt, 'base64').toString('hex');
    }
    async signPsbts(psbtsHexes) {
        const signedPsbts = [];
        for (const psbtHex of psbtsHexes) {
            const signedPsbt = await this.signPsbt(psbtHex);
            signedPsbts.push(signedPsbt);
        }
        return signedPsbts;
    }
    async signMessageBIP322(message) {
        // Using the address derived for the wallet
        const address = await this.getAddress();
        const signature = await this.client.signMessage(address, message);
        return signature;
    }
    async getNetworkFees() {
        const result = await this.client.estimateSmartFee(6); // 6 is the number of blocks for confirmation target
        const satoshis = convertBtcKvBToSatoshiPerByte(result.feerate);
        return {
            fastestFee: 1000, // Convert appropriately if needed 0.01
            halfHourFee: satoshis,
            hourFee: satoshis,
            economyFee: satoshis,
            minimumFee: satoshis
        };
    }
    // Implement other methods using bitcoin-core client
    // For example:
    async getBalance() {
        return this.client.getBalance();
    }
    async pushTx(txHex) {
        return this.client.sendRawTransaction(txHex);
    }
    async getUtxos(address, amount) {
        const utxos = await this.client.listUnspent(0, 9999999, [address]);
        //console.log("utxos: ", utxos);
        const filteredUtxos = utxos.map((utxo) => ({
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.amount * 1e8, // Convert BTC to satoshis
            scriptPubKey: utxo.scriptPubKey
        }));
        if (amount) {
            let totalAmount = 0;
            const result = [];
            for (const utxo of filteredUtxos) {
                totalAmount += utxo.value;
                result.push(utxo);
                if (totalAmount >= amount)
                    break;
            }
            return totalAmount >= amount ? result : [];
        }
        return filteredUtxos;
    }
    async getBTCTipHeight() {
        const blockchainInfo = await this.client.getBlockchainInfo();
        return blockchainInfo.blocks;
    }
}
exports.BitcoinCoreWallet = BitcoinCoreWallet;
const initBitcoinCoreWallet = (walletName, host, port, username, password, network) => {
    exports.bitcoinWallet = new BitcoinCoreWallet(walletName, host, port, username, password, network);
    return exports.bitcoinWallet;
};
exports.initBitcoinCoreWallet = initBitcoinCoreWallet;
