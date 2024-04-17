import { AuthClient } from "@dfinity/auth-client"
import { Actor, HttpAgent, Identity, HttpAgentOptions, ActorConfig } from "@dfinity/agent"
import { createAgentOptions } from './identity'

import { idlFactory } from './graph.did'
export { idlFactory } from './graph.did'

export async function getIdentity (): Promise<Identity> {
    const authClient: AuthClient = await AuthClient.create()
    const identity: Identity = await authClient.getIdentity()
    return identity
}

export async function isAuthenticated (): Promise<boolean> {
    const authClient: AuthClient = await AuthClient.create()
    const _isAuthenticated = await authClient.isAuthenticated()
    return _isAuthenticated
}

export function createAgent({
    agentOptions = {},
    local = false,
}: createAgentOptions): HttpAgent {
    const _agentOptions: HttpAgentOptions = agentOptions || {}
    const agent: HttpAgent = new HttpAgent({
        ..._agentOptions
    })
    if (local) {
        agent.fetchRootKey().catch(err=>{
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running")
            console.error(err)
        })
    }
    return agent
}

export function createActor(actorOptions: ActorConfig): any {
    let _agent = actorOptions.agent || createAgent({ local: true })
    if (actorOptions.canisterId) {
        return Actor.createActor(idlFactory, {
            agent: _agent,
            ...actorOptions,
        })
    }
    return null
}

