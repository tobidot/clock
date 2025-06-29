import { EventBase } from "@game.object/ts-game-toolbox";

export class TobidotIconExecuteEvent extends EventBase {
    public static readonly NAME = "TobidotIconExecuteEvent";

    public constructor() {
        super(TobidotIconExecuteEvent.NAME);
    }
}