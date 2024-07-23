export declare type Fees = {
    fastestFee: number;
    halfHourFee: number;
    hourFee: number;
    economyFee: number;
    minimumFee: number;
};
export interface UTXO {
    txid: string;
    vout: number;
    value: number;
    scriptPubKey: string;
    rawTransaction: string;
}
export declare enum Network {
    MAINNET = "mainnet",
    TESTNET = "testnet",
    SIGNET = "signet",
    RETEST = "regtest"
}
export declare type WalletInfo = {
    publicKeyHex: string;
    address: string;
};
/**
 * Abstract class representing a wallet provider.
 * Provides methods for connecting to a wallet, retrieving wallet information, signing transactions, and more.
 */
export declare abstract class WalletProvider {
    /**
     * Connects to the wallet and returns the instance of the wallet provider.
     * Currently only supports "native segwit" and "taproot" address types.
     * @returns A promise that resolves to an instance of the wrapper wallet provider in goat friendly format.
     * @throws An error if the wallet is not installed or if connection fails.
     */
    abstract connectWallet(): Promise<this>;
    /**
     * Gets the name of the wallet provider.
     * @returns A promise that resolves to the name of the wallet provider.
     */
    abstract getWalletProviderName(): Promise<string>;
    /**
     * Gets the address of the connected wallet.
     * @returns A promise that resolves to the address of the connected wallet.
     */
    abstract getAddress(): Promise<string>;
    /**
     * Gets the public key of the connected wallet.
     * @returns A promise that resolves to the public key of the connected wallet.
     */
    abstract getPublicKeyHex(): Promise<string>;
    abstract getPublicKey(address: string): Promise<string>;
    /**
     * Signs the given PSBT in hex format.
     * @param psbtHex - The hex string of the unsigned PSBT to sign.
     * @returns A promise that resolves to the hex string of the signed PSBT.
     */
    abstract signPsbt(psbtHex: string): Promise<string>;
    /**
     * Signs multiple PSBTs in hex format.
     * @param psbtsHexes - The hex strings of the unsigned PSBTs to sign.
     * @returns A promise that resolves to an array of hex strings, each representing a signed PSBT.
     */
    abstract signPsbts(psbtsHexes: string[]): Promise<string[]>;
    /**
     * Gets the network of the current account.
     * @returns A promise that resolves to the network of the current account.
     */
    abstract getNetwork(): Promise<Network>;
    /**
     * Signs a message using BIP-322 simple.
     * @param message - The message to sign.
     * @returns A promise that resolves to the signed message.
     */
    abstract signMessageBIP322(message: string): Promise<string>;
    /**
     * Registers an event listener for the specified event.
     * At the moment, only the "accountChanged" event is supported.
     * @param eventName - The name of the event to listen for.
     * @param callBack - The callback function to be executed when the event occurs.
     */
    abstract on(eventName: string, callBack: () => void): void;
    /**
     * Gets the balance for the connected wallet address.
     * By default, this method will return the mempool balance if not implemented by the child class.
     * @returns A promise that resolves to the balance of the wallet.
     */
    abstract getBalance(): Promise<number>;
    /**
     * Retrieves the network fees.
     * @returns A promise that resolves to the network fees.
     */
    abstract getNetworkFees(): Promise<Fees>;
    /**
     * Pushes a transaction to the network.
     * @param txHex - The hexadecimal representation of the transaction.
     * @returns A promise that resolves to a string representing the transaction ID.
     */
    abstract pushTx(txHex: string): Promise<string>;
    /**
     * Retrieves the unspent transaction outputs (UTXOs) for a given address and amount.
     *
     * If the amount is provided, it will return UTXOs that cover the specified amount.
     * If the amount is not provided, it will return all available UTXOs for the address.
     *
     * @param address - The address to retrieve UTXOs for.
     * @param amount - Optional amount of funds required.
     * @returns A promise that resolves to an array of UTXOs.
     */
    abstract getUtxos(address: string, amount?: number): Promise<UTXO[]>;
    /**
     * Retrieves the tip height of the BTC chain.
     * @returns A promise that resolves to the block height.
     */
    abstract getBTCTipHeight(): Promise<number>;
}
