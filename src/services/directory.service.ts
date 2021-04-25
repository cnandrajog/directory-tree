import {compareDir, isEmpty, readFile, toError, toResponse} from "../util";
import {Command, IDirectory} from "../types/directory";
import {IResponse} from "../types/response";

export class DirectoryService {

    directory: IDirectory;

    constructor() {
        this.directory = {
            name: 'root',
            children: []
        };
    }

    start(): void {
        const file = readFile();

        if (file) {
            this.executeCommands(file);
        }
    }

    executeCommands(file: String): void {
        file.split(/\r?\n/).forEach((cmd: string) => {
            try {
                console.log(cmd);
                const [c, ...args] = cmd.split(" ");
                if (c && c.length) {
                    this.executeCommand(c as Command, ...args);
                }
            } catch (e) {
                console.log('Error while processing command', e)
            }
        })

    }

    executeCommand(command: Command, ...args: string[]): void {
        switch (command) {
            case Command.CREATE:
                this.createDirectory(args[0], this.directory);
                break;
            case Command.DELETE:
                this.deleteDirectory(args[0], this.directory);
                break;
            case Command.MOVE:
                this.moveDirectory(args[0], args[1], this.directory);
                break;
            case Command.LIST:
                this.listDirectory();
                break;
            default:
                console.log(command, ...args);
        }
    }

    // Using Depth for search to list all directories
    listDirectory() {
        const dirs = [{d: this.directory, level: -1}];
        while (dirs.length) {
            const dir = dirs.shift();
            if (dir && dir.d && dir.d.children) {
                /*for loop is needed to calculate the levels (to print it in tree format)
                otherwise could have just used the spread operator   */
                for (let i = 0; i < dir.d.children.length; i++) {
                    dirs.unshift({d: dir.d.children[i], level: dir.level + 1});
                }
                this.printDirectoryList(dir.d.name, dir.level);

            }
        }
    }

    // recursively iterating through the directories to create a directory
    createDirectory(dirPath: string, directory: IDirectory): void {
        if (!isEmpty(dirPath)) {
            const dirs = dirPath.split("/");
            if (dirs.length == 1) {
                const response = this.addDirectory(dirs[0], directory);
                if (response && response.error) {
                    if (response.error.field) {
                        console.log(console.log(`Cannot create ${dirPath} - ${response.error.field} already exists`))
                    } else if (response.error.message) {
                        console.log(response.error.message);
                    } else {
                        console.log('Error CREATE: Invalid path name');
                    }

                }
            } else if (dirs.length > 1) {
                const intermediateDir = dirs.splice(0, dirs.length - 1);
                const createDir = dirs.splice(dirs.length - 1, dirs.length);
                const response = this.findDirectory(intermediateDir, directory);
                const {data: dir, error} = response;
                if (dir && createDir.length) {
                    const createResponse = this.addDirectory(createDir[0], dir);
                    if (createResponse && createResponse.error) {
                        if (createResponse.error.field) {
                            console.log(console.log(`Cannot create ${dirPath} - ${createResponse.error.field} already exists`))
                        } else if (createResponse.error.message) {
                            console.log(createResponse.error.message);
                        } else {
                            console.log('Error CREATE: Invalid path name');
                        }
                    }
                } else if (error) {
                    if (error.field) {
                        console.log(`Cannot create ${dirPath} - ${error.field} does not exists`)
                    } else if (error.message) {
                        console.log(error.message)
                    } else {
                        console.log('Error CREATE: Invalid directory path')
                    }
                }
            } else {
                console.log('Error CREATE: Invalid directory path');
            }
        } else {
            console.log('Error CREATE: Invalid directory path');
        }

    }

    // moving directory form source to target
    moveDirectory(srcPath: string, targetPath: string, directory: IDirectory) {
        if (!isEmpty(srcPath) || !isEmpty(targetPath)) {
            const srcDirs = srcPath.split("/");
            const targetDirs = targetPath.split("/");

            const lastDirs = srcDirs[srcDirs.length - 1];
            const srcResponse = this.findParentDirectory(srcDirs, directory);
            const {data: parentDir, error: srcError} = srcResponse;


            if (parentDir) {
                const srcDirIndex = parentDir.children.findIndex((child: IDirectory) => {
                    return child.name === lastDirs;
                });

                if (srcDirIndex > -1) {
                    const srcDir = parentDir.children[srcDirIndex];

                    const targetResponse = this.findDirectory(targetDirs, directory);
                    const {data: targetDir, error: targetError} = targetResponse;

                    if (targetDir) {
                        targetDir.children.push(srcDir);
                        targetDir.children.sort(compareDir);
                        // delete from source
                        parentDir.children.splice(srcDirIndex, 1)
                    } else if (targetError) {
                        if (targetError.field) {
                            console.log(`Cannot move ${srcPath} to  ${targetPath} - target path ${targetError.field} does not exists`);
                        } else if (targetError.message)
                            console.log(targetError.message)
                    } else {
                        console.log('Error MOVE: Invalid directory path');
                    }
                } else {
                    console.log(`Cannot move ${srcPath} to  ${targetPath} - source path ${lastDirs} does not exists`);
                }


            } else if (srcError) {
                if (srcError.field) {
                    console.log(`Cannot move ${srcPath} to  ${targetPath} - source path ${srcError.field} does not exists`);
                } else if (srcError.message) {
                    console.log(srcError.message);
                } else {
                    console.log('Error MOVE: Invalid directory path');
                }
            } else {
                console.log('Error MOVE: Invalid directory path');
            }
        } else {
            console.log('Error MOVE: Invalid directory path');
        }

    }

    // recursively iterating through the directories to delete a directory
    deleteDirectory(dirPath: string, directory: IDirectory) {
        if (!isEmpty(dirPath)) {
            const dirs = dirPath.split("/");
            const lastDirName = dirs[dirs.length - 1];

            const response = this.findParentDirectory(dirs, directory);
            const {data: parentDir, error} = response;

            if (parentDir) {
                const srcDirIndex = parentDir.children.findIndex((child: IDirectory) => {
                    return child.name === lastDirName;
                });
                if (srcDirIndex > -1) {
                    // delete from source
                    parentDir.children.splice(srcDirIndex, 1)

                } else {
                    console.log(`Cannot delete ${dirPath} - ${lastDirName} does not exists`)
                }
            } else if (error) {
                if (error.field) {
                    console.log(`Cannot delete ${dirPath} - ${error.field} does not exists`)
                } else if (error.message) {
                    console.log(error.message)
                } else {
                    console.log('Error Delete: Invalid directory path')
                }
            } else {
                console.log('Error Delete: Invalid directory path')
            }
        }
    }

    // recursively iterating through the directories to find a directory
    findDirectory(dirs: Array<string>, directory: IDirectory): IResponse {
        let name = dirs.shift();

        if (name) {
            const currDir = directory.children.find((child: IDirectory) => {
                return child.name === name;
            });
            if (currDir && !dirs.length) {
                return toResponse(currDir)
            } else if (currDir) {
                return this.findDirectory(dirs, currDir);
            }
            return toError(`Cannot find directory , ${name}`, name);

        }
        return toError('Invalid directory name')
    }


    addDirectory(name: string, directory: IDirectory): IResponse {
        if (!directory.children.some(dir => dir.name === name)) {
            directory.children.push({
                name,
                children: []
            });
            directory.children.sort(compareDir);
            return toResponse(directory);
        }
        return toError(`Directory already present, ${name}`, name)
    }

    findParentDirectory(srcDirs: Array<string>, directory: IDirectory): IResponse {
        let parentDirs: Array<string>;
        if (srcDirs.length > 1) {
            parentDirs = srcDirs.splice(0, srcDirs.length - 1);
            if (parentDirs && parentDirs.length) {
                return this.findDirectory(parentDirs, directory);
            }
        }
        return toResponse(directory);
    }

    printDirectoryList(name: string, level: number): void {
        let value = "";
        if (level >= 0) {
            for (let i = 0; i < level; i++) {
                value = value + " "
            }
            value = value + name;
            console.log(value);
        }
    }
}