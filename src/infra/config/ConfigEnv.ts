import {config} from "dotenv"

config()

export class ConfigEnv {
    constructor() {}
    getVariable(variable:string){
        const variableEnv = process.env[variable]
        if(!variableEnv)
            throw new Error("Variable not found")
        return variableEnv
    }
}