export enum Command {
    LIST = 'LIST',
    CREATE = 'CREATE',
    DELETE = "DELETE",
    MOVE = "MOVE"
}

export interface IDirectory  {
    name: string;
    children: IDirectory[];
};