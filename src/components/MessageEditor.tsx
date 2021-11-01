/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import React from 'react';
import { observer } from 'mobx-react-lite';
import Editor, { OnChange, OnValidate, useMonaco } from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import { MarkerSeverity } from 'monaco-editor';
import { createInitialActMessage } from '../helpers/schema';
import useMessageHistoryStore from '../hooks/useMessageHistoryStore';

interface Props {
	messageSchema: JSONSchema4 | JSONSchema7 | null;
	setIsValid: (isValid: boolean) => void;
}

export interface MessageEditorMethods {
	getFilledMessage: () => object | null;
}

const MessageEditor = ({ messageSchema, setIsValid }: Props, ref: React.Ref<MessageEditorMethods>) => {
	const historyStore = useMessageHistoryStore();
	const [code, setCode] = React.useState('{}');
	const monaco = useMonaco();

	React.useEffect(() => {
		if (monaco) {
			if (messageSchema) {
				initiateSchema(messageSchema);

				const json = JSON.stringify(messageSchema);
				const blob = new Blob([json], { type: 'application/json' });
				const uri = URL.createObjectURL(blob);

				monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemaValidation: 'error',
					enableSchemaRequest: true,
					schemas: [
						{
							uri,
							fileMatch: ['*'],
						},
					],
				});
			} else {
				monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [
						{
							uri: 'do.not.load',
							schema: {},
						},
					],
				});
			}
		}
	}, [monaco, messageSchema]);

	const onValueChange: OnChange = value => {
		if (historyStore.editMessageMode) {
			historyStore.setEditedMessageCode(value || '{}');
		} else {
			setCode(value || '{}');
		}
	};

	const initiateSchema = (message: JSONSchema4 | JSONSchema7) => {
		const initialSchema = createInitialActMessage(message) || '{}';
		setCode(initialSchema);
		// setIsSchemaApplied(true);
	};

	const onValidate: OnValidate = React.useCallback(
		markers => {
			setIsValid(markers.filter(marker => marker.severity === MarkerSeverity.Error).length === 0);
		},
		[setIsValid],
	);

	React.useImperativeHandle(
		ref,
		() => ({
			getFilledMessage: () => {
				let filledMessage: object | null;
				try {
					filledMessage = JSON.parse(code);
				} catch {
					filledMessage = null;
				}
				return filledMessage;
			},
		}),
		[code],
	);

	return (
		<Editor
			language='json'
			value={historyStore.editMessageMode ? historyStore.editedMessageCode : code}
			onChange={onValueChange}
			onValidate={onValidate}
			options={{
				automaticLayout: true,
			}}
		/>
	);
};

export default observer(MessageEditor, { forwardRef: true });
