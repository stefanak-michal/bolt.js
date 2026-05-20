export interface IConnection {
    connect(host: string, port: number, encrypted?: boolean): Promise<void>;
    write(data: Uint8Array): void;
    read(): Promise<Uint8Array>;
    readRaw(): Promise<Uint8Array>; // bypass dechunking — used for handshake
    disconnect(): void;
}
