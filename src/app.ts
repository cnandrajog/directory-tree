import {DirectoryService} from './services/directory.service'

const service = new DirectoryService();
try{
    service.start();
} catch (e) {
    console.log('Error starting up the application', e)
}
