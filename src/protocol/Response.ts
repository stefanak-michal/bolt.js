import Message from '../enum/Message';
import Signature from '../enum/Signature';

export class Response {
    constructor(
        public readonly message: Message,
        public readonly signature: Signature,
        public readonly content: Record<string, unknown>
    ) {}

    get isSuccess(): boolean {
        return this.signature === Signature.SUCCESS;
    }
    get isFailure(): boolean {
        return this.signature === Signature.FAILURE;
    }
    get isIgnored(): boolean {
        return this.signature === Signature.IGNORED;
    }
    get isRecord(): boolean {
        return this.signature === Signature.RECORD;
    }
}
