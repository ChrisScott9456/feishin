import { openModal } from '@mantine/modals';
import isElectron from 'is-electron';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SongEditModal } from '/@/renderer/features/item-details/components/song-edit-modal';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';

interface EditMetadataActionProps {
    items: Song[];
}

const utils = isElectron() ? window.api.utils : null;

export const EditMetadataAction = ({ items }: EditMetadataActionProps) => {
    const { t } = useTranslation();

    const onSelect = useCallback(() => {
        openModal({
            children: <SongEditModal song={items[0]} />,
            size: 'xl',
            styles: {
                body: { paddingBottom: 'var(--theme-spacing-xl)' },
            },
            title: t('page.contextMenu.editMetadata'),
        });
    }, [items, t]);

    if (!utils) {
        return null;
    }

    const disabled = items.length !== 1 || !items[0]?.path;

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="edit" onSelect={onSelect}>
            {t('page.contextMenu.editMetadata')}
        </ContextMenu.Item>
    );
};
