import { AProtocol } from './AProtocol';
import { WithReset } from './mixins/v1/WithReset';
import { WithPullAll } from './mixins/v1/WithPullAll';
import { WithDiscardAll } from './mixins/v1/WithDiscardAll';
import { WithRun } from './mixins/v1/WithRun';
import { WithInit } from './mixins/v1/WithInit';
import { WithAckFailure } from './mixins/v1/WithAckFailure';
import { v1Transitions } from './transitions/v1';
import { Packer } from '../packstream/v1/Packer';
import { Unpacker } from '../packstream/v1/Unpacker';
import { IConnection } from '../connection/IConnection';
import ServerState from '../enum/ServerState';
import { unpackStructureMap } from './structures/v1';

interface iVersionedProtocol {
    init: typeof WithInit;
    ackFailure: typeof WithAckFailure;
    reset: typeof WithReset;
    run: typeof WithRun;
    pullAll: typeof WithPullAll;
    discardAll: typeof WithDiscardAll;
}

export class V1 extends AProtocol implements iVersionedProtocol {
    readonly stateTransitionTable = v1Transitions;
    readonly unpackStructureMap = unpackStructureMap;
    public serverState: ServerState = ServerState.CONNECTED;

    init = WithInit;
    ackFailure = WithAckFailure;
    reset = WithReset;
    run = WithRun;
    pullAll = WithPullAll;
    discardAll = WithDiscardAll;

    constructor(connection: IConnection) {
        super(connection, new Packer(), new Unpacker(unpackStructureMap));
        this.serverState = ServerState.CONNECTED;
    }
}
