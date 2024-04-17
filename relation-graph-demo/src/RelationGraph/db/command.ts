import { FilterOption } from './db.d'

const eq = (value: string|number): FilterOption => {
    return {
        isRegex: false,
        text: `= ${typeof value === 'number' ? value : `"${value}"`}`,
    }
}

const lt = (value: number): FilterOption => {
    return {
        isRegex: false,
        text: `< ${value}`,
    }
}

const lte = (value: number): FilterOption => {
    return {
        isRegex: false,
        text: `<= ${value}`,
    }
}

const gt = (value: number): FilterOption => {
    return {
        isRegex: false,
        text: `> ${value}`,
    }
}

const gte = (value: number): FilterOption => {
    return {
        isRegex: false,
        text: `>= ${value}`,
    }
}

const regex = (regex: string, i: boolean = false): FilterOption => {
    return {
        isRegex: true,
        text: `"${regex}"`,
        i,
    }
}

const entity = (entityName: string, id: string) => {
    if (!entityName || !id) return console.error('must input entityName and id')
    return {
        isEntity: true,
        text: `:${entityName.toUpperCase()}${id}`,
    }
}

const command = {
    eq,
    lt,
    lte,
    gt,
    gte,
    regex,
    entity,
}

export default command