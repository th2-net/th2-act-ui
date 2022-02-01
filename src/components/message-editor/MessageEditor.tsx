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
import Editor, { Monaco, OnMount, OnValidate } from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import { editor, IRange, languages, MarkerSeverity } from 'monaco-editor';
import jsm from 'json-source-map';
import { createInitialActMessage } from '../../helpers/schema';
import useReplayStore from '../../hooks/useReplayStore';
import useEditorStore from '../../hooks/useEditorStore';
import useMessagesStore from '../../hooks/useMessagesStore';
import '../../styles/monacoDecorations.scss';

enum Commands {
	OPEN_REPLACEMENTS_CONFIG = 'openReplacementsConfig',
}

interface Props {
	messageSchema: JSONSchema4 | JSONSchema7 | null;
	openReplacementsConfig: () => void;
}

const MessageEditor = ({ messageSchema, openReplacementsConfig }: Props) => {
	const replayStore = useReplayStore();
	const { code, setCode, setIsCodeValid } = useEditorStore();
	const messagesStore = useMessagesStore();
	const monacoRef = React.useRef<Monaco | null>(null);
	const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
	const oldDecorations = React.useRef<string[]>([]);

	const onMount: OnMount = React.useCallback((editorInstance, monacoInstance) => {
		editorRef.current = editorInstance;
		monacoRef.current = monacoInstance;

		monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			schemas: [
				{
					uri: 'do.not.load',
					schema: {},
				},
			],
		});

		monacoInstance.editor.registerCommand(Commands.OPEN_REPLACEMENTS_CONFIG, () => openReplacementsConfig());
	}, []);

	React.useEffect(() => {
		if (monacoRef.current) {
			if (!replayStore.editReplayItemMode) {
				if (messageSchema) {
					const initialMessage = createInitialActMessage(messageSchema) || '{}';
					setCode(initialMessage);
				} else {
					setCode('{}');
				}
			}

			const json = JSON.stringify(messageSchema || '{}');
			const blob = new Blob([json], { type: 'application/json' });
			const uri = URL.createObjectURL(blob);

			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
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
		}
	}, [messageSchema]);

	const currentReplacements = replayStore.replayItemToEdit
		? replayStore.replayItemToEdit.replacements
		: messagesStore.replacements;

	const pointers = React.useMemo(() => {
		try {
			return jsm.parse(code).pointers;
		} catch {
			return {};
		}
	}, [code]);

	const filteredReplacements = React.useMemo(
		() =>
			currentReplacements
				.map(({ destinationPath, sourcePath }) => ({
					destinationPath: destinationPath === '' ? '/' : destinationPath,
					sourcePath,
				}))
				.filter(({ destinationPath }) => destinationPath in pointers),
		[currentReplacements, pointers],
	);

	const decorations = React.useMemo(
		() =>
			filteredReplacements.map<editor.IModelDeltaDecoration>(({ destinationPath }) => {
				const range: IRange = {
					startLineNumber: pointers[destinationPath].value.line + 1,
					startColumn: pointers[destinationPath].value.column + 1,
					endLineNumber: pointers[destinationPath].valueEnd.line + 1,
					endColumn: pointers[destinationPath].valueEnd.column + 1,
				};

				return {
					range,
					options: {
						inlineClassName: 'valueToReplace',
					},
				};
			}),
		[filteredReplacements],
	);

	React.useEffect(() => {
		if (editorRef.current) {
			oldDecorations.current = editorRef.current.deltaDecorations(oldDecorations.current, decorations);
		}
	}, [decorations]);

	const lenses: languages.CodeLens[] = React.useMemo(() => {
		if (!currentReplacements) return [];
		try {
			return filteredReplacements.map<languages.CodeLens>(({ destinationPath, sourcePath }) => ({
				range: {
					startLineNumber: (pointers[destinationPath].key?.line ?? pointers[destinationPath].value.line) + 1,
					startColumn: (pointers[destinationPath].key?.column ?? pointers[destinationPath].value.column) + 1,
					endLineNumber:
						(pointers[destinationPath].keyEnd?.line ?? pointers[destinationPath].valueEnd.line) + 1,
					endColumn:
						(pointers[destinationPath].keyEnd?.column ?? pointers[destinationPath].valueEnd.column) + 1,
				},
				command: {
					id: Commands.OPEN_REPLACEMENTS_CONFIG,
					title: `A value of ${destinationPath || '/'} will be replaced with ${sourcePath}`,
				},
			}));
		} catch {
			return [];
		}
	}, [currentReplacements, pointers]);

	React.useEffect(() => {
		if (monacoRef.current) {
			const provider = monacoRef.current.languages.registerCodeLensProvider('json', {
				provideCodeLenses: model => ({
					lenses: model.uri.path === '/editor' ? lenses : [],
					dispose: () => undefined,
				}),
				resolveCodeLens: (_, codeLens) => codeLens,
			});

			return () => provider.dispose();
		}

		return () => undefined;
	}, [lenses]);

	const onValidate: OnValidate = React.useCallback(
		markers => {
			setIsCodeValid(markers.filter(marker => marker.severity === MarkerSeverity.Error).length === 0);
		},
		[setIsCodeValid],
	);

	return (
		<Editor
			language='json'
			value={code}
			onChange={value => setCode(value ?? '{}')}
			onValidate={onValidate}
			onMount={onMount}
			options={{
				automaticLayout: true,
			}}
			path='/editor'
		/>
	);
};

export default observer(MessageEditor);
