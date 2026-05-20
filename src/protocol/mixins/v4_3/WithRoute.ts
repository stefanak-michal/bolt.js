import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

// v4.3: ROUTE routing_context bookmarks database
export function WithRoute(
    this: AProtocol,
    routing: Record<string, unknown>,
    bookmarks: string[],
    db: string | null = null
): AProtocol {
    this.send(Message.ROUTE, [routing, bookmarks, db]);
    return this;
}
