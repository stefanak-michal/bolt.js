import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

// v4.4: ROUTE routing_context bookmarks extras (changed from v4.3)
export function WithRoute(
    this: AProtocol,
    routing: Record<string, unknown>,
    bookmarks: string[],
    extras: { db: string | null; imp_user: string | null } = { db: null, imp_user: null }
): AProtocol {
    this.send(Message.ROUTE, [routing, bookmarks, extras]);
    return this;
}
