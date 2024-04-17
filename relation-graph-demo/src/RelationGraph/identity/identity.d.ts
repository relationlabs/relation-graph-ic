import { HttpAgentOptions } from '@dfinity/agent'

export type createAgentOptions = {
    agentOptions?: HttpAgentOptions;
    local?: boolean;
}