import dayjs from 'dayjs';
import RelationGraph from '../../RelationGraph'
import {
    LOCAL_GRAPH_CANISTER_ID,
    LOCAL_HOST,
} from './constant'

export const initGraph = () => {
    const graph = RelationGraph.create({
        canisterId: LOCAL_GRAPH_CANISTER_ID,
        host: LOCAL_HOST,
        local: true,
    })
    return graph
}

export const sparqlQuery = async (graph: any) => {
    if (!graph) return []
    const db = graph.entity('USER')
    const list = await db.fields(['id', 'name', 'gender', 'age', 'updateTime'])
        .orderBy('age', 'DESC')
        .get()
    return list
}

export const sparqlInsert = async (graph: any, data: any) => {
    if (!graph) return 'FAIL'
    const {
        id,
        name,
        gender,
        age,
        updateTime,
    } = data || {}
    const db = graph.entity('USER')
    const insertRes = await db.insert(id, {
        name,
        gender,
        age,
        updateTime,
    })
    return insertRes
}

export const sparqlUpdate = async (graph: any, id: string) => {
    if (!graph) return 'FAIL'
    const db = graph.entity('USER')
    const date = dayjs();
    const updateTime = date.format('YYYY-MM-DD HH:mm:ss')
    const updateRes = await db.update(id, {
        updateTime,
    })
    return updateRes
}

export const sparqlDelete = async (graph: any, id: string) => {
    if (!graph) return 'FAIL'
    const db = graph.entity('USER')
    const deleteRes = await db.delete(id)
    return deleteRes
}
