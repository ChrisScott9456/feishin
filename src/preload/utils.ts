import { ipcRenderer, IpcRendererEvent, webFrame } from 'electron';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/utils';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const checkFileWritable = (filePath: string): Promise<{ error?: string; ok: boolean }> => {
    return ipcRenderer.invoke('check-file-writable', filePath);
};

const readSongTags = (
    filePath: string,
): Promise<{ error?: string; ok: boolean; properties?: Record<string, string[]> }> => {
    return ipcRenderer.invoke('read-song-tags', filePath);
};

const writeSongTags = (
    filePath: string,
    tags: Record<string, string>,
    artworkOp?: { bytes: Uint8Array; mimeType: string; type: 'set' } | { type: 'clear' },
): Promise<{ error?: string; ok: boolean }> => {
    return ipcRenderer.invoke('write-song-tags', filePath, tags, artworkOp);
};

const readSongArtwork = (
    filePath: string,
): Promise<{ data?: null | string; error?: string; mimeType?: string; ok: boolean }> => {
    return ipcRenderer.invoke('read-song-artwork', filePath);
};

const readLocalImage = (
    filePath: string,
): Promise<{ data?: string; error?: string; mimeType?: string; ok: boolean }> => {
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
    checkFileWritable,
    checkForUpdates,
    disableAutoUpdates,
    download,
    forceGarbageCollection,
    isLinux,
    isMacOS,
    isWindows,
    logger,
    mainMessageListener,
    openApplicationDirectory,
    openItem,
    playerErrorListener,
    readLocalImage,
    readSongArtwork,
    readSongTags,
    rendererOpenCommandPalette,
    rendererOpenManageServers,
    rendererOpenReleaseNotes,
    rendererOpenSettings,
    rendererTogglePrivateMode,
    rendererToggleSidebar,
    writeSongTags,
};

export type Utils = typeof utils;
