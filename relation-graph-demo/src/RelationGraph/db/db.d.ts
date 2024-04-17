import RelationGraph from "../index";
import { PrefixType } from '../index.d'

export type DBApiOptions = {
    graph: RelationGraph;
    entityName: string;
    prefix?: PrefixType;
}

export type Fields = string[]

export type OrderKey = 'ASC'|'asc'|'DESC'|'desc'

export type OrderBy = [string|undefined|null, OrderKey|undefined|null]

export type FilterOption = {
    isRegex: boolean;
    text: string;
    i?: boolean;
}

export type FilterOptions = {
    [key?:string]: FilterOption;
}

export type Filters = string[];

export type QuerySparqlObject = {
    id: string;
    distinct: boolean;
    fields: Fields;
    relations: Fields;
    orderBy: OrderBy;
    filters: Filters;
    offset: number|undefined|null;
    limit: number|undefined|null;
}