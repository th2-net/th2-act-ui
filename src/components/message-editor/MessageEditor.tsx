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
import Editor, { OnMount, OnValidate, useMonaco } from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import { editor, languages, MarkerSeverity } from 'monaco-editor';
import jsm from 'json-source-map';
import { createInitialActMessage } from '../../helpers/schema';
import useReplayStore from '../../hooks/useReplayStore';
import useEditorStore from '../../hooks/useEditorStore';
import useMessagesStore from '../../hooks/useMessagesStore';

interface Props {
	messageSchema: JSONSchema4 | JSONSchema7 | null;
	setIsValid: (isValid: boolean) => void;
}

export interface MessageEditorMethods {
	getFilledMessage: () => object | null;
}

const MessageEditor = ({ messageSchema, setIsValid }: Props, ref: React.Ref<MessageEditorMethods>) => {
	const replayStore = useReplayStore();
	const { code, setCode } = useEditorStore();
	const { replacements } = useMessagesStore();
	const monaco = useMonaco();
	const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);

	const currentValue = replayStore.editReplayItemMode ? replayStore.editedReplayItemCode : code;

	const onValueChange = (value: string | undefined) => {
		if (replayStore.editReplayItemMode) {
			replayStore.setEditedReplayItemCode(value || '{}');
		} else {
			setCode(value || '{}');
		}
	};

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

	const currentReplacements = React.useMemo(() => {
		if (!replayStore.replayItemToEdit) return replacements;
		return replayStore.replayItemToEdit.replacements;
	}, [replayStore, replayStore.replayList, replayStore.editedReplayItemId, replayStore.editReplayItemMode]);

	const lenses: languages.CodeLens[] = React.useMemo(() => {
		if (!currentReplacements) return [];
		try {
			const { pointers } = jsm.parse(currentValue);

			const paths = currentReplacements
				.map(({ destinationPath }) => (destinationPath === '/' ? '' : destinationPath))
				.filter(path => path in pointers);

			return paths.map(path => ({
				range: {
					startLineNumber: (pointers[path].key?.line ?? pointers[path].value.line) + 1,
					startColumn: (pointers[path].key?.column ?? pointers[path].value.column) + 1,
					endLineNumber: (pointers[path].keyEnd?.line ?? pointers[path].valueEnd.line) + 1,
					endColumn: (pointers[path].keyEnd?.column ?? pointers[path].valueEnd.column) + 1,
				},
				command: {
					id: '-1',
					title: `A value of ${path || '/'} will be replaced`,
				},
			}));
		} catch {
			return [];
		}
	}, [currentValue, currentReplacements]);

	React.useEffect(() => {
		if (monaco && editorRef.current) {
			const disposable = monaco.languages.registerCodeLensProvider('json', {
				provideCodeLenses: () => ({
					lenses,
					dispose: () => undefined,
				}),
				resolveCodeLens: (_, codeLens) => codeLens,
			});

			return disposable.dispose;
		}

		return () => undefined;
	}, [currentValue, monaco, currentReplacements, lenses]);

	const initiateSchema = (message: JSONSchema4 | JSONSchema7) => {
		const initialSchema = createInitialActMessage(message) || '{}';
		setCode(initialSchema);
	};

	const onValidate: OnValidate = React.useCallback(
		markers => {
			setIsValid(markers.filter(marker => marker.severity === MarkerSeverity.Error).length === 0);
		},
		[setIsValid],
	);

	const onMount: OnMount = _editor => {
		editorRef.current = _editor;
	};

	React.useImperativeHandle(
		ref,
		() => ({
			getFilledMessage: () => {
				let filledMessage: object | null;
				try {
					filledMessage = JSON.parse(currentValue);
				} catch {
					filledMessage = null;
				}
				return filledMessage;
			},
		}),
		[currentValue],
	);

	return (
		<Editor
			language='json'
			value={currentValue}
			onChange={onValueChange}
			onValidate={onValidate}
			onMount={onMount}
			options={{
				automaticLayout: true,
			}}
		/>
	);
};

export default observer(MessageEditor, { forwardRef: true });
