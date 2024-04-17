import { cloneDeep } from 'lodash'
import RelationGraph from '../index'
import { PrefixType, UpdateResult } from '../index.d'
import { PREFIX } from '../constant'
import { OrderKey, DBApiOptions, QuerySparqlObject, Fields, FilterOptions } from './db'
import command from "./command";
import { handleFields, handleFilters, handleOrderby, handleRelations } from './sql'
import parseCSVResult from './parse/csv'

const defaultQuerySparqlObject: QuerySparqlObject = {
    id: '',
    distinct: false,
    fields: [],
    relations: [],
    filters: [],
    orderBy: [undefined, undefined],
    offset: undefined,
    limit: undefined,
}

class DB {
    private _prefix: PrefixType = PREFIX
    private _dataType: 'tsv'|'csv' = 'csv'
    private _graph: RelationGraph|null|undefined = null
    private _entityName: string = ''
    private _querySparqlObject: QuerySparqlObject = cloneDeep(defaultQuerySparqlObject)

    public command = command

    constructor({
        entityName,
        graph,
        prefix,
    }: DBApiOptions) {
        this._graph = graph
        this._entityName = (entityName || '').toUpperCase()
        this._prefix = {
            ...this._prefix,
            ...(prefix || {}),
        }
    }

    static init(options: DBApiOptions) {
        return new this(options)
    }

    clearQuery() {
        this._querySparqlObject = cloneDeep(defaultQuerySparqlObject)
    }

    relation(field: string, degree: number) {
        if (field && degree > 0) {
            const relations = Array.from({ length: degree }).fill(field) as Fields
            this._querySparqlObject.relations.push(...relations)
        }
        return this
    }

    fields(fields: Fields = []) {
        this._querySparqlObject.fields.push(...fields)
        return this
    }

    filter(options: FilterOptions) {
        if (options && typeof options === 'object') {
            this._querySparqlObject.filters = this._querySparqlObject.filters.concat(Object.keys(options).map(field => {
                if (field) {
                    const { isRegex, text, i } = options[field] || {}
                    if (text) {
                        return isRegex ? `FILTER regex(?${field}, ${text}${i ? ', "i"' : ''})` : `FILTER (?${field} ${text})`
                    }
                }
                return ''
            }).filter(filter => !!filter))
        }
        return this
    }

    orderBy(field: string, orderKey: OrderKey = 'ASC') {
        this._querySparqlObject.orderBy = [field, orderKey]
        return this
    }

    offset(_offset: number) {
        this._querySparqlObject.offset = _offset
        return this
    }

    limit(_limit: number) {
        this._querySparqlObject.limit = _limit
        return this
    }

    distinct(_distinct = true) {
        this._querySparqlObject.distinct = _distinct
        return this
    }

    doc(id: string) {
        this._querySparqlObject.id = id
        return this
    }

    async get(): Promise<any> {
        if (this._graph) {
            const {
                id,
                distinct,
                fields,
                relations,
                filters,
                orderBy,
                offset,
                limit,
            } = this._querySparqlObject

            const { fieldsTag, fieldList } = handleFields(fields)

            const relationSql = handleRelations(relations, this._entityName, id)

            const filterSql = handleFilters(filters)

            const orderSql = handleOrderby(orderBy)

            const sparql = `
                SELECT${distinct ? ' DISTINCT' : ''} ${fieldsTag}
                WHERE {
                    ${relationSql} ${fieldList.join(' ')}.
                    ${filterSql}
                }
                ${orderSql}
                ${typeof offset === 'number' ? `OFFSET ${offset}` : ''}
                ${typeof offset === 'number' ? `LIMIT ${limit}` : ''}
            `
            const result = await this._graph.sparqlQuery({
                dataType: this._dataType,
                sparql,
            })
            const json = parseCSVResult(result, {
                entityName: this._entityName,
                prefix: this._prefix,
                fields: this._querySparqlObject.fields,
                relations: this._querySparqlObject.relations,
            })
            this.clearQuery()
            return json
        }
    }

    async insert(id: string, data: any): Promise<UpdateResult> {
        if (!this._graph) {
            console.error('must init graph instance')
            return { fail: 'must init graph instance' }
        }
        const { _entityName } = this
        if (!_entityName) {
            console.error('entityName is empty')
            return { fail: 'entityName is empty' }
        }
        if (!(typeof id === 'string' && id)) {
            console.error('invalid id')
            return { fail: 'invalid id' }
        }
        if (data && typeof data === 'object') {
            const dataKeys = Object.keys(data)
            if (dataKeys.length > 0) {
                const fieldsSql = dataKeys.map((key: string) => {
                    const value = data[key]
                    const valueType = typeof value
                    if (valueType=== 'string') {
                        return `:${key} "${value}"`
                    } else if (valueType === 'number') {
                        return `:${key} ${value}`
                    } else if (valueType === 'object') {
                        const { isEntity, text } = value || {}
                        if (isEntity && text) {
                            return `:${key} ${text}`
                        }
                    }
                    return ''
                }).filter(item => !!item)
                if (fieldsSql.length > 0) {
                    const sparql = `
                        INSERT DATA
                        {
                            :${_entityName}${id} :id "${id}";${fieldsSql.join(';')}.
                        }
                    `
                    const result = await this._graph.sparqlUpdate(sparql)
                    if (result === 'SUCCESS') {
                        return {
                            success: true,
                        }
                    }
                    return {
                        fail: result,
                    }
                }
            }
        }
        return {
            fail: 'invalid function call'
        }
    }

    async update(id: string, data: any): Promise<UpdateResult> {
        if (!this._graph) {
            console.error('must init graph instance')
            return { fail: 'must init graph instance' }
        }
        const { _entityName } = this
        if (!_entityName) {
            console.error('entityName is empty')
            return { fail: 'entityName is empty' }
        }
        if (!(typeof id === 'string' && id)) {
            console.error('invalid id')
            return { fail: 'invalid id' }
        }
        if (data && typeof data === 'object') {
            const dataKeys = Object.keys(data)
            if (dataKeys.length > 0) {
                const deleteSql: string[] = []
                const updateSql: string[] = []
                dataKeys.forEach((key: string) => {
                    const value = data[key]
                    const valueType = typeof value
                    deleteSql.push(`:${key} ?o`)
                    if (valueType=== 'string') {
                        updateSql.push(`:${key} "${value}"`)
                    } else if (valueType === 'number') {
                        updateSql.push(`:${key} ${value}`)
                    } else if (valueType === 'object') {
                        const { isEntity, text } = value || {}
                        if (isEntity && text) {
                            updateSql.push(`:${key} ${text}`)
                        }
                    }
                })
                if (updateSql.length > 0 && updateSql.length === deleteSql.length) {
                    const sparql = `
                        DELETE
                        {
                            ${deleteSql.map(sql => `:${_entityName}${id} ${sql}.`).join('')}
                        }
                        INSERT
                        {
                            ${updateSql.map(sql => `:${_entityName}${id} ${sql}.`).join('')}
                        }
                        WHERE
                        {
                            ${deleteSql.map(sql => `:${_entityName}${id} ${sql}.`).join('')}
                        }
                    `
                    const result = await this._graph.sparqlUpdate(sparql)
                    if (result === 'SUCCESS') {
                        return {
                            success: true,
                        }
                    }
                    return {
                        fail: result,
                    }
                }
            }
        }
        return {
            fail: 'invalid function call'
        }
    }

    async delete(id: string, fields: Fields = []): Promise<UpdateResult> {
        if (!this._graph) {
            console.error('must init graph instance')
            return { fail: 'must init graph instance' }
        }
        const { _entityName } = this
        if (!_entityName) {
            console.error('entityName is empty')
            return { fail: 'entityName is empty' }
        }
        if (!(typeof id === 'string' && id)) {
            console.error('invalid id')
            return { fail: 'invalid id' }
        }
        let sparql
        if (fields.length > 0) {
            const fieldsSql = fields.map(field => `:${field} ?${field}`)
            sparql = `
                DELETE WHERE
                {
                    :${_entityName}${id} ${fieldsSql.join(';')}.
                }
            `
        } else {
            sparql = `
                DELETE WHERE
                {
                    :${_entityName}${id} ?p ?o.
                }
            `
        }
        const result = await this._graph.sparqlUpdate(sparql)
        if (result === 'SUCCESS') {
            return {
                success: true,
            }
        }
        return {
            fail: result,
        }
    }
}

export default DB
