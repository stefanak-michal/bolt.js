import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

interface BeginExtra {
    bookmarks?: string[];
    tx_timeout?: number;
    tx_metadata?: Record<string, unknown>;
    mode?: string;
    db?: string;
    imp_user?: string;
    notifications_minimum_severity?: string;
    notifications_disabled_categories?: string[]; // v5.2–5.5
    notifications_disabled_classifications?: string[]; // v5.6+
}

export function WithBegin(this: AProtocol, extra: BeginExtra = {} as BeginExtra): AProtocol {
    this.send(Message.BEGIN, [extra]);
    return this;
}
