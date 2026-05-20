import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export interface PullExtra {
    n?: number;
    qid?: number;
}

export function WithPull(this: AProtocol, extra: PullExtra = {}): AProtocol {
    if (extra.n === undefined) extra = { ...extra, n: -1 };
    this.send(Message.PULL, [extra]);
    return this;
}
