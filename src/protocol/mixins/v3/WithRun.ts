import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

// v3+: RUN takes query, parameters, extra (bookmarks, mode, db, etc.)
export function WithRun(
    this: AProtocol,
    query: string,
    parameters: Record<string, unknown> = {},
    extra: Record<string, unknown> = {}
): AProtocol {
    this.send(Message.RUN, [query, parameters, extra]);
    return this;
}
