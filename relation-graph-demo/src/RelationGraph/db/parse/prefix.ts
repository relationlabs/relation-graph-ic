export const parsePrefix = (prefix: string|undefined, match: string) => {
    if (typeof match === 'string' && match.substring(0, prefix?.length || 0) === prefix) {
        return match.substring(prefix.length)
    }
    return ''
}

export const trimPrefix = (prefix: string|undefined) => {
    if (typeof prefix === 'string' && prefix.length >= 2) {
        return prefix.substring(1, prefix.length - 1)
    }
    return prefix
}