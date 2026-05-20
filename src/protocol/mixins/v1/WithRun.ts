import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

// v1–v2: RUN takes query + parameters only (2 fields)
export function WithRun(this: AProtocol, query: string, parameters: Record<string, unknown> = {}): AProtocol {
    this.send(Message.RUN, [query, parameters]);
    return this;
}
