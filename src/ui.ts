import { DPT } from "./dpt";

type Entry = { entry_path: string, entry_type: string, document_type: string };

export class UI {
    private _dpt: DPT;
    private _outputEle: HTMLElement;

    private _fileInput: HTMLInputElement;
    private _uploadPath: HTMLInputElement;
    private _uploadFileButton: HTMLButtonElement;
    private _downloadPath: HTMLInputElement;
    private _downloadFileButton: HTMLButtonElement;

    private _upButton: HTMLButtonElement;
    private _newFolderButton: HTMLButtonElement;
    private _uploadFromListButton: HTMLButtonElement;
    private _addressBar: HTMLElement;
    private _list: HTMLUListElement;
    private _entries: Entry[] = [];
    private _level = 1;
    private _path = '';

    constructor(dpt: DPT) {
        this._dpt = dpt;
        this._outputEle = document.getElementById('console')!;
        this._fileInput = document.getElementById('fileUpload')! as HTMLInputElement;
        this._uploadPath = document.getElementById('fileUploadPath')! as HTMLInputElement;
        this._uploadFileButton = document.getElementById('uploadFileButton')! as HTMLButtonElement;
        this._downloadPath = document.getElementById('fileDownloadPath')! as HTMLInputElement;
        this._downloadFileButton = document.getElementById('downloadFileButton')! as HTMLButtonElement;
        this._uploadFileButton.addEventListener('click', () => this.uploadFile());
        this._downloadFileButton.addEventListener('click', () => this.downloadFile());

        this._list = document.getElementById('list')! as HTMLUListElement;
        this._upButton = document.getElementById('upButton')! as HTMLButtonElement;
        this._newFolderButton = document.getElementById('newFolderButton')! as HTMLButtonElement;
        this._uploadFromListButton = document.getElementById('uploadFromListButton')! as HTMLButtonElement;
        this._addressBar = document.getElementById('addressbar')!;
        this.path = 'Document/';
        this._upButton.addEventListener('click', () => {
            if (this._level <= 1)
                return;
            this._level--;
            this.path = this.path.substr(0, this.path.lastIndexOf('/') + 1);
            this.displayItems(entry => filterPathAndLevel(this.path, this._level, entry));
        });
        this._newFolderButton.addEventListener('click', () => {
            setTimeout(() => this.newFolder());
        });
        this._uploadFromListButton.addEventListener('click', () => this.uploadFromList());
        this._fileInput.addEventListener('input', () => {
            console.info('Loaded file.');
            this._uploadFileButton.disabled = false;
        });
    }

    get path() {
        return this._path;
    }
    set path(path: string) {
        this._addressBar.textContent = path.endsWith('/') ? path : path + '/';
        this._path = path;
    }

    error(message: string) {
        this._outputEle.textContent += message + '\n';
    }

    async load(reload = false) {
        this._list.textContent = reload ? 'Refreshing...' : 'Loading...';
        let all = await this._dpt.listAll();
        this._entries = [];
        for (let entry of all) {
            this._entries.push(entry);
        }
        this._entries = this._entries.sort((a, b) => sortLevel(a, b));
        this.displayItems(entry => filterPathAndLevel(this.path, this._level, entry));
    }

    async uploadFromList() {
        let fileInputFromList = document.createElement('input');
        fileInputFromList.type = 'file';
        fileInputFromList.addEventListener('input', () => {
            this.upload(fileInputFromList, this.path + '/' + fileInputFromList.files![0].name);
        });
        fileInputFromList.click();
    }

    async uploadFile() {
        await this.upload(this._fileInput, 'Document/' + this._uploadPath.value);
        this._uploadFileButton.disabled = true;
        this.displayReload();
    }

    async upload(fileInput: HTMLInputElement, path: string) {
        if (fileInput.files === null || fileInput.files.length === 0) {
            this.error('No files selected!');
            return false;
        }
        console.info('Starting upload to "' + path + '"');
        await this._dpt.upload(fileInput, path);
        this.displayReload();
    }

    async downloadFile() {
        this._dpt.downloadBlob('Document/' + this._downloadPath.value);
    }

    async newFolder() {
        let name = window.prompt('Specify new folder name.', 'New Folder');
        if (name === null)
            return;
        console.info('New folder in path: "' + this.path + '" with name: "' + name + '"');
        await this._dpt.newFolder(this.path, name);
        this.displayReload();
    }

    displayReload() {
        this.load(true);
    }

    async displayItems(filter: (items: Entry) => boolean) {
        this._list.innerHTML = '';
        let filtered = this._entries.filter(items => filter(items));
        let sorted = filtered.sort((a, b) => sortFoldersFirstAlphabetially(a, b));
        for (let entry of sorted) {
            let listItem = document.createElement('li');
            listItem.classList.add('listItem');
            if (entry.entry_type === 'folder') {
                listItem.classList.add('folder');
                listItem.addEventListener('click', () => {
                    this._level++;
                    this.path = entry.entry_path;
                    this.displayItems(e => filterPathAndLevel(entry.entry_path, this._level, e));
                });
            } else {
                listItem.classList.add('doc');
                listItem.addEventListener('click', () => this._dpt.download(entry.entry_path));
            }
            let span = document.createElement('span');
            span.textContent = entry.entry_path.substr(entry.entry_path.lastIndexOf('/') + 1);
            listItem.appendChild(span);
            this._list.appendChild(listItem);
        }
        if (this._list.childNodes.length === 0) {
            let emptyItem = document.createElement('li');
            emptyItem.classList.add('listItem', 'emptyItem');
            emptyItem.textContent = '[empty]';
            this._list.appendChild(emptyItem);
        }
    }
}

function filterPathAndLevel(path: string, level: number, entry: Entry) {
    return filterPath(path, entry) && filterLevel(level, entry);
}
function filterPath(path: string, entry: Entry) {
    return entry.entry_path.startsWith(path) && entry.entry_path !== path;
}
function filterLevel(level: number, entry: Entry) {
    return getLevel(entry) === level;
}
function getLevel(entry: Entry) {
    return (entry.entry_path.match(/\//g) || []).length;
}
function sortLevel(a: Entry, b: Entry) {
    return getLevel(a) - getLevel(b);
}
function sortFoldersFirst(a: Entry, b: Entry) {
    let result = (a.entry_type === 'folder' ? -Infinity : Infinity) + (b.entry_type === 'folder' ? Infinity : -Infinity);
    return isNaN(result) ? 0 : result;
}
function sortAlphabetically(a: Entry, b: Entry) {
    return a.entry_path.localeCompare(b.entry_path);
}
function sortFoldersFirstAlphabetially(a: Entry, b: Entry) {
    return sortFoldersFirst(a, b) + sortAlphabetically(a, b);
}
