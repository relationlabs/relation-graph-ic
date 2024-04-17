import { Identity, HttpAgentOptions, ActorConfig } from "@dfinity/agent"
import { Principal } from '@dfinity/principal'

export type UpdateResult = {
    success?: boolean;
    fail?: string;
}

export type PrefixType = {
    entity?: string;
    property?: string;
    rdf?: string;
    xsd?: string;
    rdfx?: string;
}

export type RelationGraphOptions = {
    canisterId: string | Principal;
    identity?: Identity;
    host?: string;
    local?: boolean;
    prefix?: PrefixType;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
}

export type QueryParams = {
    dataType?: 'tsv'|'csv';
    sparql: string;
}
