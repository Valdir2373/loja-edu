import { ConfigEnv } from "./ConfigEnv";

export class ConfigDb {

    constructor(private config:ConfigEnv){

    }
    getDb():string{
        return this.config.getVariable("DIRECT_URL")
    }

}