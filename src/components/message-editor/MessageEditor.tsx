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
	const [pointers, setPointers] = React.useState<Record<string, jsm.Pointer>>({});

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
			if (messageSchema) {
				if (!replayStore.editReplayItemMode) {
					const initialMessage = createInitialActMessage(messageSchema) || '{}';
					setCode(initialMessage);
				}

				const json = JSON.stringify(messageSchema);
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
		}
	}, [messageSchema]);

	const replacementsConfig = replayStore.replayItemToEdit
		? replayStore.replayItemToEdit.replacements
		: messagesStore.replacements;

	React.useEffect(() => {
		let actualPointers;

		try {
			actualPointers = jsm.parse(code).pointers;
		} catch {
			return;
		}

		if (actualPointers) {
			setPointers(actualPointers);
		}
	}, [code]);

	const replacementsExistingInCode = React.useMemo(
		() =>
			replacementsConfig
				.map(({ destinationPath, sourcePath }) => ({
					destinationPath: destinationPath === '' ? '/' : destinationPath,
					sourcePath,
				}))
				.filter(({ destinationPath }) => destinationPath in pointers),
		[replacementsConfig, pointers],
	);

	const decorations = React.useMemo(
		() =>
			replacementsExistingInCode.map<editor.IModelDeltaDecoration>(({ destinationPath }) => {
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
		[replacementsExistingInCode, pointers],
	);

	const updateDecorations = React.useCallback(() => {
		if (editorRef.current) {
			oldDecorations.current = editorRef.current.deltaDecorations(oldDecorations.current, decorations);
		}
	}, [decorations]);

	React.useEffect(() => {
		updateDecorations();
	}, [updateDecorations]);

	const lenses: languages.CodeLens[] = React.useMemo(() => {
		if (!replacementsConfig) return [];
		try {
			return replacementsExistingInCode.map<languages.CodeLens>(({ destinationPath, sourcePath }) => ({
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
	}, [replacementsConfig, pointers]);

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
			const nonExistingInReplacementsConfigMarkers = markers.filter(
				({ startLineNumber, startColumn, endLineNumber, endColumn }) =>
					!replacementsExistingInCode.some(({ destinationPath }) => {
						const { value, valueEnd } = pointers[destinationPath];
						return (
							value.line + 1 === startLineNumber &&
							value.column + 1 === startColumn &&
							valueEnd.line + 1 === endLineNumber &&
							valueEnd.column + 1 === endColumn
						);
					}),
			);

			if (monacoRef.current && editorRef.current) {
				const model = editorRef.current.getModel();
				if (model && markers.length !== nonExistingInReplacementsConfigMarkers.length) {
					monacoRef.current.editor.setModelMarkers(model, 'json', nonExistingInReplacementsConfigMarkers);
				}
			}

			const errorMarkers = nonExistingInReplacementsConfigMarkers.filter(
				({ severity }) => severity === MarkerSeverity.Error,
			);

			setIsCodeValid(errorMarkers.length === 0);
		},
		[setIsCodeValid, pointers, replacementsExistingInCode],
	);

	React.useEffect(() => {
		if (!monacoRef.current || !editorRef.current) return;
		const model = editorRef.current.getModel();

		/* We need to trigger the code validation again, because we need to ignore typing errors
			 of the fields defined in replacements config when the last one was modified.
			 So, setting the same value is probably only way to do it */

		model?.setValue(model.getValue());
		updateDecorations();
	}, [replacementsConfig]);

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
