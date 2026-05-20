import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithTelemetry(this: AProtocol, api: number): AProtocol {
    this.send(Message.TELEMETRY, [api]);
    return this;
}
