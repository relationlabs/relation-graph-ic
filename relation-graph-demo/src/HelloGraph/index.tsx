import { useState } from 'react'
import dayjs from 'dayjs';
import './index.css'
import loadingSvg from './loading.svg'

import ActionBtn from './components/ActionBtn'

import {
    initGraph,
    sparqlQuery,
    sparqlInsert,
    sparqlDelete,
    sparqlUpdate,
} from './utils/db'

const graphInstance = initGraph()

const HelloGraph = () => {
    const [data, setData] = useState<any>({
        init: false,
        list: [],
    })
    const [loading, setLoading] = useState(false)

    const queryAction = async () => {
        if (graphInstance) {
            setLoading(true)
            const list = await sparqlQuery(graphInstance)
            setData({
                init: true,
                list,
            })
            setLoading(false)
        }
    }

    const insertAction = async () => {
        if (graphInstance && data.init) {
            const lastItem = Array.isArray(data.list) && data.list.length > 0 ? data.list[0] : null
            const id = lastItem ? Number(lastItem.id) + 1 : 1
            const date = dayjs();
            const insertParams = {
                id: String(id),
                name: `User-${id}`,
                age: 17 + id,
                gender: (id % 2) ? 'Male' : 'Female',
                updateTime: date.format('YYYY-MM-DD HH:mm:ss'),
            }
            const insertRes = await sparqlInsert(graphInstance, insertParams)
            if (insertRes.success) queryAction()
            else if (insertRes.fail) console.log(insertRes.fail)
        }
    }

    const updateAction = async (id: number) => {
        if (graphInstance && data.init) {
            const updateRes = await sparqlUpdate(graphInstance, String(id))
            if (updateRes.success) queryAction()
            else if (updateRes.fail) console.log(updateRes.fail)
        }
    }

    const deleteAction = async (id: number) => {
        if (graphInstance && data.init) {
            const deleteRes = await sparqlDelete(graphInstance, String(id))
            if (deleteRes.success) queryAction()
            else if (deleteRes.fail) console.log(deleteRes.fail)
        }
    }

    return (
        <div className="hello-container">
            <div className='title'>
                Hello Relation Graph
            </div>
            <div className='actions'>
                <ActionBtn onClick={queryAction}>QUERY</ActionBtn>
                <ActionBtn disabled={!data.init} onClick={insertAction}>INSERT</ActionBtn>
            </div>
            {
                !data.init && (<div style={{ padding: 12, color: '#fff', fontSize: 18 }}>Insert data after the query</div>)
            }
            {
                loading ? (
                    <div className='list-loading'>
                        <img src={loadingSvg} alt='loading...' />
                    </div>
                ) : (
                    <div className='list'>
                        <div className='list-head'>
                            <span>Name</span>
                            <span>Gender</span>
                            <span>Age</span>
                            <span>Update Time</span>
                            <span>Action</span>
                        </div>
                        {data.list.map((item: any) => {
                            const {
                                id,
                                name,
                                gender,
                                age,
                                updateTime,
                            } = item
                            return (
                                <div key={id} className='list-item'>
                                    <span>{name}</span>
                                    <span>{gender}</span>
                                    <span>{age}</span>
                                    <span>{updateTime}</span>
                                    <span>
                                        <ActionBtn
                                            size='small'
                                            gutter={6}
                                            onClick={() => updateAction(Number(id))}
                                        >
                                            update
                                        </ActionBtn>
                                        <ActionBtn
                                            size='small'
                                            danger
                                            gutter={0}
                                            onClick={() => deleteAction(Number(id))}
                                        >
                                            delete
                                        </ActionBtn>
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )
            }
        </div>
    )
}

export default HelloGraph
