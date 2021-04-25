import {IDirectory} from "./directory";

export interface IResponse {
    data?: IDirectory;
    error?: {
        field: string;
        message: string

    }
};