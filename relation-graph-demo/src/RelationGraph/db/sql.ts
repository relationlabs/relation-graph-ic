import { Fields, Filters, OrderKey } from './db.d'

export const handleFields = (fields: Fields) => {
    let fieldsTag
    let fieldList
    if (!fields ||fields.length <= 0) {
        fieldsTag = '*'
        fieldList = ['?_p ?_o;']
    } else {
        fieldsTag = '*' //fields.map(field => `?${field}`).join(' ')
        fieldList = fields.map(filed => `:${filed} ?${filed};`)
    }
    return { fieldsTag, fieldList }
}

export const handleFilters = (filters: Filters) => {
    let filterSql = ''
    if (filters.length > 0) {
        filterSql = filters.join('.')
    }
    return filterSql
}

export const handleOrderby = (orderBy: [string|undefined|null, OrderKey|undefined|null]) => {
    let orderSql = ''
    if (orderBy) {
        const [orderValue, orderKey] = orderBy
        if (orderKey && orderValue) {
            orderSql = `ORDER BY ${orderKey.toUpperCase()}(?${orderValue})`
        } 
    }
    return orderSql
}

const handleEntity = (entity: string, specific: boolean = false) => {
    if (!entity) return '?_s'
    const _entity = specific ? entity.toUpperCase() : entity.toLowerCase()
    return `${specific ? ':' : '?'}${_entity}`
}

export const handleRelations = (relations: Fields, entityName: string, id: string) => {
    if (!entityName) return handleEntity(entityName, false)
    let specific = !!id
    let _entityName = entityName.toUpperCase()
    let relationSql: string[] = []
    if (specific) {
        _entityName = `${_entityName}${id}`
        relationSql = relations.map((relation, index) => {
            const sql = `${index === 0 ? ':' : '?'}${_entityName} :${relation} ?${relation}${index + 1}.\n`
            _entityName = `${relation}${index + 1}`
            return sql
        })
    }
    
    if (relationSql.length <= 0 && specific) _entityName = `${_entityName}${id}`
    else specific = false
    const entitySql = handleEntity(_entityName, specific)
    return `${relationSql.join('')}${entitySql}`
}
