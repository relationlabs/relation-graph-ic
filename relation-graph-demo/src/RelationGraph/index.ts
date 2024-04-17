import { createActor, createAgent } from './identity'
import { RelationGraphOptions, QueryParams, PrefixType } from './index.d'
import DB from './db'
import { PREFIX } from './constant'

class RelationGraph {
    private _actor: any = null
    private _prefix: PrefixType = PREFIX

    constructor(actor: any, prefix?: PrefixType) {
        this._actor = actor
        this._prefix = {
            ...this._prefix,
            ...(prefix || {}),
        }
    }

    static create({
        canisterId,
        identity,
        host,
        local,
        prefix,
        agentOptions,
        actorOptions,
    }: RelationGraphOptions) {
        if (canisterId) {
            const agent = createAgent({
                agentOptions: {
                    identity,
                    host,
                    ...(agentOptions || {}),
                },
                local,
            })
            const actor = createActor({
                canisterId,
                agent,
                ...(actorOptions || {}),
            })
            return new this(actor, prefix)
        }
        return null
    }

    async sparqlQuery({ dataType = 'csv', sparql }: QueryParams) {
        if (!this._actor) return console.error('must call RelationGraph.create before query')
        return await this._actor.sparql_query(dataType, sparql)
    }

    async sparqlUpdate(sparql: string) {
        if (!this._actor) return console.error('must call RelationGraph.create before update')
        return await this._actor.sparql_update(sparql)
    }

    entity(name: string) {
        if (!this._actor) return console.error('must call RelationGraph.create before call entity function')
        return new DB({
            graph: this,
            entityName: name,
            prefix: this._prefix,
        })
    }
}

export default RelationGraph;
