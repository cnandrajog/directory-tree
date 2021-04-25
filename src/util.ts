import fs from "fs";
import path from "path";
import {IDirectory} from "./types/directory";
import {IResponse} from "./types/response";

export const readFile = (file = "input.txt") => {
    const filePath = path.join(process.cwd(), file);
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        console.log(`Error reading file, : ${filePath}`, e);
    }
    return null;

};

export const compareDir = (d1: IDirectory, d2: IDirectory) => {
    if (d1.name < d2.name) {
        return 1;
    }
    if (d1.name > d2.name) {
        return -1;
    }
    return 0;
};

export const toResponse = (data: IDirectory,) => {
    const response: IResponse = {
        data
    };
    return response
};

export const toError = (message: string, field: string = '') => {
    const error: IResponse = {
        error: {
            message,
            field
        }
    };
    return error
};

export const isEmpty = (value: string) => {
    return !value || !value.trim();
}