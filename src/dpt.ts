import { base64, utf8 } from '@nw55/common';

export class DPT {
    private _dptUrl: string;
    private _clientId: string;
    private _privateKeyStr: string;
    private _errorCallback: ((message: string) => void) | undefined = undefined;

    constructor(dptUrl: string, clientId: string, privateKeyStr: string) {
        this._clientId = clientId;
        this._dptUrl = dptUrl;
        this._privateKeyStr = privateKeyStr;
    }

    initErrorCallback(errorCallback: ((message: string) => void)) {
        this._errorCallback = errorCallback;
    }

    error(message: string) {
        if (this._errorCallback !== undefined)
            this._errorCallback(message);
        console.error(message);
    }

    async authenticate() {
        let response = await this._sendRequest('/auth/nonce/' + this._clientId);
        // console.info(response);
        if (!response.ok) {
            this.error('Could not authenticate. GET nonce failed');
            return false;
        }
        let nonce = (await response.json()).nonce;
        // console.info(nonce);
        let signedNonce = await this.signNonce(nonce, this._privateKeyStr);

        let data = { "client_id": this._clientId, "nonce_signed": signedNonce };
        let auth = await this._sendRequest('/auth', 'PUT', data);
        if (!auth.ok) {
            this.error('Could not authenticate. PUT auth failed.');
            return false;
        }
        return auth;
    }

    async signNonce(nonce: string, keyStr: string) {
        let keyBin = base64.getBytes(keyStr);
        let options = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
        let key = await crypto.subtle.importKey('pkcs8', keyBin, options, false, ['sign']);
        let nonceBytes = utf8.getBytes(nonce);
        const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, nonceBytes.buffer);
        let signatureBase64 = base64.getString(new Uint8Array(signature));
        // console.info('Signed nonce: ', signatureBase64);
        return signatureBase64;
    }

    async getObjectInfo(path: string) {
        let response = await this._sendRequest('/resolve/entry/path/' + encodeURIComponent(path));
        let objectInfo = await response.json();
        console.info(objectInfo);
        return { ok: response.ok, objectInfo };
    }

    async getObjectId(path: string): Promise<string | null> {
        let response = await this.getObjectInfo(path);
        if (response.ok)
            return response.objectInfo.entry_id as string;
        else
            return null;
    }

    async newFolder(path: string, name: string) {
        let id = await this.getObjectId(path);
        if (id === null)
            return false;
        else
            return await this._newFolderById(id, name);
    }

    async deleteFolder(path: string) {
        let id = await this.getObjectId(path);
        if (id === null)
            return false;
        else
            return await this._deleteFolderById(id);
    }

    async deleteDocument(path: string) {
        let id = await this.getObjectId(path);
        if (id === null)
            return false;
        else
            return await this._deleteDocumentById(id);
    }

    async displayDocument(path: string, page = 1) {
        let id = await this.getObjectId(path);
        if (id === null)
            return false;
        else
            return await this._displayDocumentById(id, page);
    }

    async copyFile(oldPath: string, newPath: string) {
        let result = await this._getPathIds(oldPath, newPath);
        if (result)
            return await this._copyFileById(result.oldId, result.newFolderId, result.newName);
    }

    async moveFile(oldPath: string, newPath: string) {
        let result = await this._getPathIds(oldPath, newPath);
        if (result)
            return await this._moveFileById(result.oldId, result.newFolderId, result.newName);
    }

    async listTemplates() {
        let response = await this._sendRequest('/viewer/configs/note_templates');
        let templates = await response.json();
        return templates.template_list;
    }

    async createDocument(path: string) {
        let lastIndex = path.lastIndexOf('/');
        let parentPath = path.substr(0, lastIndex);
        let fileName = path.substr(lastIndex + 1);
        let parentFolderId = await this.getObjectId(parentPath) as string;
        if (parentFolderId === null)
            return false;
        let info = {
            "file_name": fileName,
            "parent_folder_id": parentFolderId,
            "document_source": "",
        }
        console.info(info);
        let response = await this._sendRequest("/documents2", 'POST', info);
        return await response.json();
    }

    async listDocuments() {
        let response = await this._sendRequest('/documents2');
        let docs = await response.json();
        return docs.entry_list;
    }

    async listAll() {
        let response = await this._sendRequest('/documents2?entry_type=all');
        let all = await response.json();
        return all.entry_list;
    }

    async listObjectsInFolder(path: string) {
        let id = await this.getObjectId(path);
        if (id === null) {
            this.error('Folder path does not exist.');
            return false;
        }
        else
            return await this._listFoldersById(id);
    }

    async upload(uploadInput: HTMLInputElement, path: string) {
        if (uploadInput.files!.length !== 1) {
            this.error('More than 1 file selected.');
            return false;
        }
        let docInfo = await this.createDocument(path);
        if (!docInfo) {
            this.error('Upload path does not exist!');
            return false;
        }
        let id = docInfo.document_id as string;
        let file = uploadInput.files![0];
        let formData = new FormData();
        formData.append('file', file);
        let response = await this._sendRequest('/documents/' + id + '/file', 'PUT', formData);
        return response.ok;
    }

    async download(path: string) {
        // thanks to @nw55 for this genius way to download a file (he probably got it form stackoverflow) ;)
        let blob = await this.downloadBlob(path);
        if (blob === false) {
            this.error('Error in downloadById.');
            return false;
        }
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = path.substr(path.lastIndexOf('/') + 1);
        a.click();
        URL.revokeObjectURL(url);
        return true;
    }

    async downloadBlob(path: string) {
        let id = await this.getObjectId(path);
        if (id === null) {
            this.error('File to download does not exist.');
            return false;
        }
        let response = await this._sendRequest('/documents/' + id + '/file');
        if (!response.ok) {
            this.error('Error downloading. NOT OK');
            return false;
        }
        let blob = await response.blob();
        return blob;
    }

    async _displayDocumentById(id: string, page = 1) {
        let info = { document_id: id, page: page }
        let response = await this._sendRequest('/viewer/controls/open2', 'PUT', info);
        return response.ok;
    }

    async _getPathIds(oldPath: string, newPath: string) {
        let result = await this._copyMoveFindIds(oldPath, newPath);
        if (result === null) {
            this.error('Original folder path "' + oldPath + '" does not exist.');
            return false;
        }
        if (result.newFolderId === null) {
            this.error('New folder path "' + newPath + '" does not exist.');
            return false;
        }
        return result as { oldId: string, newFolderId: string, newName: string };
    }

    private async _listFoldersById(id: string) {
        let response = await this._sendRequest('/folders/' + id + '/entries');
        let all = await response.json();
        return all.entry_list;
    }

    private async _newFolderById(id: string, name: string) {
        let data = { "folder_name": name, "parent_folder_id": id };
        let response = await this._sendRequest('/folders2', 'POST', data);
        return response.ok;
    }

    async _deleteDocumentById(id: string) {
        let response = await this._sendRequest('/documents/' + id, 'DELETE');
        return response.ok;
    }

    private async _deleteFolderById(id: string) {
        let response = await this._sendRequest('/folders/' + id, 'DELETE');
        return response.ok;
    }

    private _makeCopyMoveData(folderId: string, newName: string | undefined = undefined) {
        let data = { parent_folder_id: folderId, file_name: newName };
        return data;
    }

    private async _copyFileById(fileId: string, newParentFolderId: string, newName: string | undefined = undefined) {
        let data = this._makeCopyMoveData(newParentFolderId, newName);
        let response = await this._sendRequest('/documents/' + fileId + '/copy', 'POST', data);
        return response;
    }

    private async _moveFileById(fileId: string, newParentFolderId: string, newName: string | undefined = undefined) {
        let data = this._makeCopyMoveData(newParentFolderId, newName);
        let response = await this._sendRequest('/documents/' + fileId, 'PUT', data);
        return response;
    }

    private async _copyMoveFindIds(oldPath: string, newPath: string) {
        let oldId = await this.getObjectId(oldPath);
        if (oldId === null)
            return null;
        else {
            let newName = undefined;
            let newFolderId = await this.getObjectId(newPath);
            if (newFolderId === null)// aka the file was given and not its parent folder
            {
                let lastIndex = newPath.lastIndexOf('/');
                let parentPath = newPath.substr(0, lastIndex);
                newName = newPath.substr(lastIndex + 1);
                let newFolderPath = parentPath;
                newFolderId = await this.getObjectId(newFolderPath);
            }
            return { oldId, newFolderId, newName };
        }
    }

    private async _sendRequest(endpoint: string, method: string | undefined = undefined, data: FormData | PartialJsonValue | undefined = undefined) {
        let options: RequestInit = {
            credentials: 'include' as 'include',
            method: method,
        };
        if (data instanceof FormData)
            options.body = data;
        else if (data !== undefined) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        }
        let request = new Request(this._dptUrl + endpoint, options);
        return fetch(request).then((response) => {
            if (response.ok)
                return response;
            else {
                this.error('Error: Request returned status code: ' + response.status);
                return Promise.reject();
            }
        }).catch((reason) => {
            this.error('Error: Could not send request: "' + reason.name + '". Check your network connection! Message: ' + (reason.message ?? 'none') + '\n'
                + 'If you believe you have network access the reason likely is a certificate error: "net::ERR_CERT_AUTHORITY_INVALID".\n'
                + 'This means that you have to add an exception for the DPT API\'s certificate in your browser:\n'
                + 'Open the DPT API (device URL with "https://" and port 8443, e.g. https://digitalpaper.local:8443) in your browser (do NOT forget the https://) and accept the certificate and this error should go away.' + '\n'
                + 'If you get something like "error_code: 40100, message: Authentication is required.", then it worked.');
            return Promise.reject();
        });
    }
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [property: string]: JsonValue };
export type JsonArray = JsonValue[];
export type PartialJsonValue = string | number | boolean | null | PartialJsonObject | PartialJsonArray | undefined;
export type PartialJsonObject = { [property: string]: PartialJsonValue };
export type PartialJsonArray = PartialJsonValue[];
