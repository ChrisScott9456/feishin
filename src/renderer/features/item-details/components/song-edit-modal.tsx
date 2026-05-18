import { closeAllModals } from '@mantine/modals';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { controller } from '/@/renderer/api/controller';
import { useCurrentServer } from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { Group } from '/@/shared/components/group/group';
import { NumberInput } from '/@/shared/components/number-input/number-input';
import { Select } from '/@/shared/components/select/select';
import { Spinner } from '/@/shared/components/spinner/spinner';
import { Stack } from '/@/shared/components/stack/stack';
import { Table } from '/@/shared/components/table/table';
import { Tabs } from '/@/shared/components/tabs/tabs';
import { Text } from '/@/shared/components/text/text';
import { Textarea } from '/@/shared/components/textarea/textarea';
import { TextInput } from '/@/shared/components/text-input/text-input';
import { toast } from '/@/shared/components/toast/toast';
import { Song } from '/@/shared/types/domain-types';

type TagFieldType = 'boolean' | 'number' | 'string' | 'textarea';

type KnownTag = {
    key: string;
    label: string;
    type: TagFieldType;
};

// Keys match taglib-wasm's camelCase PropertyMap format
const KNOWN_TAGS: KnownTag[] = [
    { key: 'title', label: 'Title', type: 'string' },
    { key: 'artist', label: 'Artist', type: 'string' },
    { key: 'albumArtist', label: 'Album Artist', type: 'string' },
    { key: 'album', label: 'Album', type: 'string' },
    { key: 'subtitle', label: 'Subtitle', type: 'string' },
    { key: 'genre', label: 'Genre', type: 'string' },
    { key: 'comment', label: 'Comment', type: 'textarea' },
    { key: 'trackNumber', label: 'Track Number', type: 'string' },
    { key: 'totalTracks', label: 'Total Tracks', type: 'string' },
    { key: 'discNumber', label: 'Disc Number', type: 'string' },
    { key: 'totalDiscs', label: 'Total Discs', type: 'string' },
    { key: 'date', label: 'Date', type: 'string' },
    { key: 'originalDate', label: 'Original Date', type: 'string' },
    { key: 'bpm', label: 'BPM', type: 'number' },
    { key: 'compilation', label: 'Compilation', type: 'boolean' },
    { key: 'language', label: 'Language', type: 'string' },
    { key: 'media', label: 'Media', type: 'string' },
    { key: 'script', label: 'Script', type: 'string' },
    { key: 'grouping', label: 'Grouping', type: 'string' },
    { key: 'titleSort', label: 'Title Sort', type: 'string' },
    { key: 'albumSort', label: 'Album Sort', type: 'string' },
    { key: 'artistSort', label: 'Artist Sort', type: 'string' },
    { key: 'albumArtistSort', label: 'Album Artist Sort', type: 'string' },
    { key: 'composerSort', label: 'Composer Sort', type: 'string' },
    { key: 'composer', label: 'Composer', type: 'string' },
    { key: 'producer', label: 'Producer', type: 'string' },
    { key: 'lyricist', label: 'Lyricist', type: 'string' },
    { key: 'conductor', label: 'Conductor', type: 'string' },
    { key: 'remixedBy', label: 'Remixer', type: 'string' },
    { key: 'isrc', label: 'ISRC', type: 'string' },
    { key: 'asin', label: 'ASIN', type: 'string' },
    { key: 'barcode', label: 'Barcode', type: 'string' },
    { key: 'catalogNumber', label: 'Catalog Number', type: 'string' },
    { key: 'label', label: 'Label', type: 'string' },
    { key: 'copyright', label: 'Copyright', type: 'string' },
    { key: 'mood', label: 'Mood', type: 'string' },
    { key: 'originalAlbum', label: 'Original Album', type: 'string' },
    { key: 'originalArtist', label: 'Original Artist', type: 'string' },
    { key: 'lyrics', label: 'Lyrics', type: 'textarea' },
    { key: 'musicbrainzTrackId', label: 'MusicBrainz Track ID', type: 'string' },
    { key: 'musicbrainzReleaseId', label: 'MusicBrainz Album ID', type: 'string' },
    { key: 'musicbrainzReleaseGroupId', label: 'MusicBrainz Release Group ID', type: 'string' },
    { key: 'musicbrainzReleaseTrackId', label: 'MusicBrainz Release Track ID', type: 'string' },
    { key: 'musicbrainzWorkId', label: 'MusicBrainz Work ID', type: 'string' },
    { key: 'musicbrainzArtistId', label: 'MusicBrainz Artist ID', type: 'string' },
    { key: 'musicbrainzReleaseArtistId', label: 'MusicBrainz Album Artist ID', type: 'string' },
    { key: 'acoustidId', label: 'AcoustID', type: 'string' },
];

const KNOWN_TAG_MAP = new Map(KNOWN_TAGS.map((t) => [t.key, t]));

const utils = isElectron() ? window.api.utils : null;

interface SongEditModalProps {
    song: Song;
}

export const SongEditModal = ({ song }: SongEditModalProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<null | string>(null);
    const [fields, setFields] = useState<Record<string, string>>({});
    const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
    const [rescan, setRescan] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [artworkDataUrl, setArtworkDataUrl] = useState<null | string>(null);
    const [artworkOp, setArtworkOp] = useState<
        { bytes: Uint8Array; mimeType: string; type: 'set' } | { type: 'clear' } | null
    >(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!song.path || !utils) {
            setError(t('page.itemDetail.fileNotWritable'));
            setIsLoading(false);
            return;
        }

        Promise.all([utils.readSongTags(song.path), utils.readSongArtwork(song.path)]).then(
            ([tagsResult, artworkResult]) => {
                if (!tagsResult.ok) {
                    setError(tagsResult.error ?? t('page.itemDetail.fileNotWritable'));
                } else {
                    const flat: Record<string, string> = {};
                    for (const [k, v] of Object.entries(tagsResult.properties ?? {})) {
                        if (KNOWN_TAG_MAP.has(k) && v && v.length > 0 && v[0] !== undefined) {
                            flat[k] = v[0];
                        }
                    }
                    setFields(flat);
                }
                if (artworkResult.ok && artworkResult.data) {
                    setArtworkDataUrl(
                        `data:${artworkResult.mimeType};base64,${artworkResult.data}`,
                    );
                }
                setIsLoading(false);
            },
        );
    }, [song.path, t]);

    const handleFieldChange = useCallback((key: string, value: string) => {
        setFields((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleRemoveField = useCallback((key: string) => {
        setFields((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setRemovedKeys((prev) => new Set(prev).add(key));
    }, []);

    const handleAddField = useCallback((key: string | null) => {
        if (!key) return;
        setFields((prev) => ({ ...prev, [key]: '' }));
        setRemovedKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
        });
        requestAnimationFrame(() => {
            if (tableContainerRef.current) {
                const row = tableContainerRef.current.querySelector<HTMLElement>(
                    `[data-field-key="${key}"]`,
                );
                row?.scrollIntoView({ block: 'nearest' });
                row?.querySelector<HTMLElement>('input, textarea')?.focus();
            }
        });
    }, []);

    const applyArtworkBytes = useCallback((bytes: Uint8Array, mimeType: string) => {
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
        setArtworkDataUrl(URL.createObjectURL(blob));
        setArtworkOp({ bytes, mimeType, type: 'set' });
    }, []);

    const handleChangeArtwork = useCallback(async () => {
        if (!utils) return;
        const path = await window.api.localSettings.openFileSelector({
            filters: [{ extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'], name: 'Images' }],
        });
        if (!path) return;
        const result = await utils.readLocalImage(path);
        if (result.ok && result.data && result.mimeType) {
            const binary = atob(result.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            applyArtworkBytes(bytes, result.mimeType);
        }
    }, [applyArtworkBytes]);

    const handleRemoveArtwork = useCallback(() => {
        setArtworkDataUrl(null);
        setArtworkOp({ type: 'clear' });
    }, []);

    const handleArtworkDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const isImage =
                file.type.startsWith('image/') ||
                /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(file.name);
            if (!isImage) return;
            const mimeType =
                file.type ||
                (/\.png$/i.test(file.name)
                    ? 'image/png'
                    : /\.gif$/i.test(file.name)
                      ? 'image/gif'
                      : /\.webp$/i.test(file.name)
                        ? 'image/webp'
                        : 'image/jpeg');
            const buf = await file.arrayBuffer();
            applyArtworkBytes(new Uint8Array(buf), mimeType);
        },
        [applyArtworkBytes],
    );

    const handleSave = async () => {
        if (!song.path || !utils) return;

        const emptyFields = Object.entries(fields)
            .filter(([key, value]) => {
                const meta = KNOWN_TAG_MAP.get(key);
                return meta?.type !== 'boolean' && value.trim() === '';
            })
            .map(([key]) => KNOWN_TAG_MAP.get(key)?.label ?? key);

        if (emptyFields.length > 0) {
            toast.error({
                message: `${t('page.itemDetail.emptyFields', 'Fields cannot be empty')}: ${emptyFields.join(', ')}`,
                title: t('error.generalError', 'Error'),
            });
            return;
        }

        setIsSaving(true);
        try {
            const deletions = Object.fromEntries([...removedKeys].map((k) => [k, '']));
            const result = await utils.writeSongTags(
                song.path,
                { ...fields, ...deletions },
                artworkOp ?? undefined,
            );
            if (!result.ok) {
                toast.error({
                    message: result.error ?? t('page.itemDetail.fileNotWritable'),
                    title: t('error.generalError', 'Error'),
                });
                return;
            }

            toast.success({ message: t('page.itemDetail.tagsSaved') });

            if (rescan && server) {
                try {
                    await controller.startScan({ apiClientProps: { serverId: server.id } });
                    toast.success({ message: t('page.itemDetail.rescanStarted') });
                } catch {
                    // rescan failure is non-fatal
                }
            }

            closeAllModals();
        } finally {
            setIsSaving(false);
        }
    };

    const availableToAdd = KNOWN_TAGS.filter((tag) => !(tag.key in fields))
        .map((tag) => ({ label: tag.label, value: tag.key }))
        .sort((a, b) => a.label.localeCompare(b.label));

    if (isLoading) {
        return (
            <Stack align="center" p="xl">
                <Spinner />
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack p="md">
                <Text c="red">{error}</Text>
            </Stack>
        );
    }

    return (
        <Stack gap="xs">
            <Tabs defaultValue="tags" keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab style={{ fontSize: '1rem' }} value="tags">
                        {t('page.itemDetail.tagsTab', 'Tags')}
                    </Tabs.Tab>
                    <Tabs.Tab style={{ fontSize: '1rem' }} value="artwork">
                        {t('page.itemDetail.artworkTab', 'Artwork')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="tags">
                    <Stack gap="xs" pt="xs">
                        {availableToAdd.length > 0 && (
                            <Select
                                clearable
                                data={availableToAdd}
                                placeholder={t('page.itemDetail.addField', 'Add field…')}
                                value={null}
                                onChange={handleAddField}
                            />
                        )}
                        <div
                            ref={tableContainerRef}
                            style={{
                                borderTop: '1px solid var(--mantine-color-default-border)',
                                marginTop: 'var(--theme-spacing-sm)',
                                maxHeight: '55vh',
                                overflowY: 'auto',
                                paddingBottom: 'var(--theme-spacing-sm)',
                                paddingTop: 'var(--theme-spacing-sm)',
                            }}
                        >
                            <Table
                                highlightOnHover={false}
                                styles={{
                                    td: {
                                        padding: 'var(--theme-spacing-xs) var(--theme-spacing-sm)',
                                        verticalAlign: 'middle',
                                    },
                                    th: {
                                        color: 'var(--theme-colors-foreground-muted)',
                                        fontWeight: 500,
                                        padding: 'var(--theme-spacing-xs) var(--theme-spacing-sm)',
                                        verticalAlign: 'middle',
                                        whiteSpace: 'nowrap',
                                        width: '1%',
                                    },
                                }}
                                withRowBorders
                            >
                                <Table.Tbody>
                                    {Object.entries(fields)
                                        .sort(([a], [b]) => {
                                            const PRIORITY = [
                                                'title',
                                                'artist',
                                                'album',
                                                'albumArtist',
                                                'trackNumber',
                                                'discNumber',
                                                'date',
                                            ];
                                            const pa = PRIORITY.indexOf(a);
                                            const pb = PRIORITY.indexOf(b);
                                            if (pa !== -1 && pb !== -1) return pa - pb;
                                            if (pa !== -1) return -1;
                                            if (pb !== -1) return 1;
                                            const labelA = KNOWN_TAG_MAP.get(a)?.label ?? a;
                                            const labelB = KNOWN_TAG_MAP.get(b)?.label ?? b;
                                            return labelA.localeCompare(labelB);
                                        })
                                        .map(([key, value]) => {
                                            const meta = KNOWN_TAG_MAP.get(key) ?? {
                                                key,
                                                label: key,
                                                type: 'string' as TagFieldType,
                                            };

                                            return (
                                                <Table.Tr key={key} data-field-key={key}>
                                                    <Table.Th>{meta.label}</Table.Th>
                                                    <Table.Td>
                                                        {meta.type === 'textarea' ? (
                                                            <Textarea
                                                                autosize
                                                                maxRows={6}
                                                                minRows={2}
                                                                size="sm"
                                                                value={value}
                                                                onChange={(e) =>
                                                                    handleFieldChange(
                                                                        key,
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                        ) : meta.type === 'number' ? (
                                                            <NumberInput
                                                                size="sm"
                                                                value={
                                                                    value === ''
                                                                        ? undefined
                                                                        : Number(value)
                                                                }
                                                                onChange={(v) =>
                                                                    handleFieldChange(
                                                                        key,
                                                                        v === undefined
                                                                            ? ''
                                                                            : String(v),
                                                                    )
                                                                }
                                                            />
                                                        ) : meta.type === 'boolean' ? (
                                                            <Checkbox
                                                                checked={value === '1'}
                                                                size="sm"
                                                                onChange={(e) =>
                                                                    handleFieldChange(
                                                                        key,
                                                                        e.currentTarget.checked
                                                                            ? '1'
                                                                            : '0',
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            <TextInput
                                                                size="sm"
                                                                value={value}
                                                                onChange={(e) =>
                                                                    handleFieldChange(
                                                                        key,
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td style={{ width: '32px' }}>
                                                        <Button
                                                            size="sm"
                                                            style={{
                                                                fontSize: '1.05rem',
                                                                lineHeight: 1,
                                                            }}
                                                            variant="subtle"
                                                            onClick={() => handleRemoveField(key)}
                                                        >
                                                            ×
                                                        </Button>
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="artwork">
                    <Stack align="center" gap="md" pt="md">
                        <div
                            style={{
                                aspectRatio: '1 / 1',
                                background: 'var(--mantine-color-dark-6)',
                                border: `1px solid ${isDragOver ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-default-border)'}`,
                                borderRadius: 'var(--mantine-radius-sm)',
                                containerType: 'inline-size',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'border-color 100ms ease',
                                width: '100%',
                            }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragOver(true);
                            }}
                            onDrop={handleArtworkDrop}
                            onClick={handleChangeArtwork}
                        >
                            {artworkDataUrl ? (
                                <img
                                    alt="Cover art"
                                    src={artworkDataUrl}
                                    style={{
                                        height: '100%',
                                        objectFit: 'cover',
                                        width: '100%',
                                    }}
                                />
                            ) : (
                                <Stack
                                    align="center"
                                    justify="center"
                                    style={{ height: '100%', opacity: 0.4 }}
                                >
                                    <Text style={{ fontSize: '5cqw' }}>
                                        {t('page.itemDetail.noArtwork', 'No Artwork')}
                                    </Text>
                                </Stack>
                            )}
                        </div>
                        {artworkDataUrl && (
                            <Button
                                size="sm"
                                style={{ color: 'var(--theme-colors-state-error)' }}
                                variant="subtle"
                                onClick={handleRemoveArtwork}
                            >
                                {t('page.itemDetail.removeArtwork', 'Remove Artwork')}
                            </Button>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            <Checkbox
                checked={rescan}
                label={t('page.itemDetail.triggerRescan')}
                onChange={(e) => setRescan(e.currentTarget.checked)}
            />

            <Group justify="flex-end">
                <Button variant="subtle" onClick={() => closeAllModals()}>
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button loading={isSaving} variant="filled" onClick={handleSave}>
                    {t('common.save', 'Save')}
                </Button>
            </Group>
        </Stack>
    );
};
