import { ipcRenderer, IpcRendererEvent, webFrame } from 'electron';

import type {
    ArtworkOp,
    BatchProgress,
    ReadLocalImageResult,
    ReadSongMetadataBatchResult,
    WriteSongTagsBatchResult,
} from '../shared/types/tag-editor';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/utils';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const cancelReadSongMetadata = (): void => {
    ipcRenderer.invoke('cancel-read-song-metadata');
};

const readSongMetadataBatch = (filePaths: string[]): Promise<ReadSongMetadataBatchResult> => {
    return ipcRenderer.invoke('read-song-metadata-batch', filePaths);
};

const writeSongTagsBatch = (
    filePaths: string[],
    edits: Record<string, string>,
    removed: string[],
    artworkOp?: ArtworkOp,
): Promise<WriteSongTagsBatchResult> => {
    return ipcRenderer.invoke('write-song-tags-batch', filePaths, edits, removed, artworkOp);
};

const onBatchProgress = (cb: (event: IpcRendererEvent, data: BatchProgress) => void) => {
    ipcRenderer.on('batch-progress', cb);
};

const offBatchProgress = (cb: (event: IpcRendererEvent, data: BatchProgress) => void) => {
    ipcRenderer.removeListener('batch-progress', cb);
};

const readLocalImage = (filePath: string): Promise<ReadLocalImageResult> => {
    return ipcRenderer.invoke('read-local-image', filePath);
};

const openApplicationDirectory = async () => {
    return ipcRenderer.invoke('open-application-directory');
};

const playerErrorListener = (cb: (event: IpcRendererEvent, data: { code: number }) => void) => {
    ipcRenderer.on('player-error-listener', cb);
};

const mainMessageListener = (
    cb: (
        event: IpcRendererEvent,
        data: { message: string; type: 'error' | 'info' | 'success' | 'warning' },
    ) => void,
) => {
    ipcRenderer.on('toast-from-main', cb);
};

const logger = (
    cb: (
        event: IpcRendererEvent,
        data: {
            message: string;
            type: 'debug' | 'error' | 'info' | 'verbose' | 'warning';
        },
    ) => void,
) => {
    ipcRenderer.send('logger', cb);
};

const download = (url: string) => {
    ipcRenderer.send('download-url', url);
};

const checkForUpdates = (): Promise<{ updateAvailable: boolean; version?: string }> => {
    return ipcRenderer.invoke('app-check-for-updates');
};

const forceGarbageCollection = (): boolean => {
    try {
        if (typeof global.gc === 'function') {
            global.gc();
            webFrame.clearCache();
            return true;
        }
        if (typeof window.gc === 'function') {
            window.gc();
            webFrame.clearCache();
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

const rendererOpenSettings = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-open-settings', cb);
};

const rendererOpenCommandPalette = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-open-command-palette', cb);
};

const rendererOpenManageServers = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-open-manage-servers', cb);
};

const rendererTogglePrivateMode = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-toggle-private-mode', cb);
};

const rendererToggleSidebar = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-toggle-sidebar', cb);
};

const rendererOpenReleaseNotes = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-open-release-notes', cb);
};

export const utils = {
    cancelReadSongMetadata,
    checkForUpdates,
    disableAutoUpdates,
    download,
    forceGarbageCollection,
    isLinux,
    isMacOS,
    isWindows,
    logger,
    mainMessageListener,
    offBatchProgress,
    onBatchProgress,
    openApplicationDirectory,
    openItem,
    playerErrorListener,
    readLocalImage,
    readSongMetadataBatch,
    rendererOpenCommandPalette,
    rendererOpenManageServers,
    rendererOpenReleaseNotes,
    rendererOpenSettings,
    rendererTogglePrivateMode,
    rendererToggleSidebar,
    writeSongTagsBatch,
};

export type Utils = typeof utils;
