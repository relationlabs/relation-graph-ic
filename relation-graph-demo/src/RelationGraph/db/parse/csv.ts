import {PrefixType} from "../../index.d"
import {Fields} from "../db";

const parseCSVResult = (
    result: string,
    {
        entityName,
        prefix,
        fields,
        relations,
    }: {
        entityName: string;
        prefix: PrefixType;
        fields: Fields;
        relations: Fields;
    },
) => {
    try {
        if (result) {
            const lines = result.trim().split('\r\n');
            const keys = lines[0].split(',');

            let arr = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                let obj: any = {};
                for (let j = 0; j < keys.length; j++) {
                    obj[keys[j]] = values[j];
                }
                arr.push(obj);
            }
            return arr
        }
    } catch (e) {
        throw e
    }
}

export default parseCSVResult
