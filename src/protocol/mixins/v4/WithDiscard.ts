import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export interface DiscardExtra {
    n?: number;
    qid?: number;
}

export function WithDiscard(this: AProtocol, extra: DiscardExtra = {} as DiscardExtra): AProtocol {
    if (extra.n === undefined) extra = { ...extra, n: -1 };
    this.send(Message.DISCARD, [extra]);
    return this;
}
