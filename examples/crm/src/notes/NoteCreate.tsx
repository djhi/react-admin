import * as React from 'react';
import {
    useNotify,
    useGetIdentity,
    useResourceContext,
    Create,
    SimpleForm,
    TextInput,
    DateTimeInput,
    useRecordContext,
    Toolbar,
    SaveButton,
    Identifier,
    useUpdate,
    useListContext,
    SelectInput,
    RaRecord,
    FormDataConsumer,
    FileField,
    FileInput,
    ImageField,
} from 'react-admin';
import { useFormContext } from 'react-hook-form';

import { Status } from '../misc/Status';
import { Stack } from '@mui/material';
import { useCRMContext } from '../CRM/CRMContext';

const foreignKeyMapping = {
    contacts: 'contact_id',
    deals: 'deal_id',
};

const getCurrentDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.toISOString().slice(0, -1);
};

export const NoteCreate = ({
    showStatus,
    reference,
}: {
    showStatus?: boolean;
    reference: 'contacts' | 'deals';
}) => {
    const { noteStatuses } = useCRMContext();
    const resource = useResourceContext();
    const record = useRecordContext();
    const { identity } = useGetIdentity();

    if (!record || !identity) return null;
    return (
        <Create resource={resource} redirect={false}>
            <SimpleForm
                toolbar={
                    <NoteCreateToolbar reference={reference} record={record} />
                }
            >
                <TextInput
                    source="text"
                    label="Add a note"
                    variant="filled"
                    size="small"
                    multiline
                    rows={3}
                />
                <FormDataConsumer<{
                    text: string;
                    attachment: { src: Blob; title: string; rawFile: File };
                }>>
                    {({ formData }) =>
                        formData.text ? (
                            <>
                                <Stack direction="row" spacing={2}>
                                    {showStatus && (
                                        <SelectInput
                                            source="status"
                                            choices={noteStatuses}
                                            optionValue="value"
                                            optionText={optionRenderer}
                                            isRequired
                                            defaultValue={'warm'}
                                        />
                                    )}
                                    <DateTimeInput
                                        source="date"
                                        label="Date"
                                        defaultValue={getCurrentDate()}
                                    />
                                </Stack>
                                <FileInput source="attachment">
                                    {formData.attachment &&
                                    isImage(formData.attachment.rawFile) ? (
                                        <ImageField
                                            source="src"
                                            title="title"
                                        />
                                    ) : (
                                        <FileField source="src" title="title" />
                                    )}
                                </FileInput>
                            </>
                        ) : null
                    }
                </FormDataConsumer>
            </SimpleForm>
        </Create>
    );
};

const NoteCreateToolbar = ({
    reference,
    record,
}: {
    reference: 'contacts' | 'deals';
    record: RaRecord<Identifier>;
}) => {
    const [update] = useUpdate();
    const notify = useNotify();
    const { identity } = useGetIdentity();
    const { reset } = useFormContext();
    const { refetch } = useListContext();

    if (!record || !identity) return null;

    const handleSuccess = (data: any) => {
        reset();
        refetch();
        update(reference, {
            id: (record && record.id) as unknown as Identifier,
            data: { last_seen: data.date, status: data.status },
            previousData: record,
        });
        notify('Note added', { type: 'success' });
    };
    return (
        <Toolbar>
            <SaveButton
                type="button"
                label="Add this note"
                icon={<></>}
                variant="contained"
                transform={data => ({
                    ...data,
                    [foreignKeyMapping[reference]]: record.id,
                    sales_id: identity.id,
                    date: data.date || getCurrentDate(),
                })}
                mutationOptions={{
                    onSuccess: handleSuccess,
                }}
            />
        </Toolbar>
    );
};

const isImage = (file: File) => {
    return file && file.type.startsWith('image/');
};

const optionRenderer = (choice: any) => (
    <div>
        {choice.label} <Status status={choice.value} />
    </div>
);
