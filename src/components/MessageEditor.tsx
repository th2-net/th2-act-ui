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

// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import ResizeObserver from 'resize-observer-polyfill';
import React from 'react';
import { observer } from 'mobx-react-lite';
import Editor, {
	OnMount,
	OnChange,
	Monaco,
} from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import * as monacoEditor from 'monaco-editor';
import { toJS } from 'mobx';
import { createInitialActMessage } from '../helpers/schema';
import { useStore } from '../hooks/useStore';
// eslint-disable-next-line import/named
import { UsedLens } from './App';
import api from '../api';
import { ModalPortal } from './Portal';
import GetSchemaModal from './GetSchemaModal';

interface Props {
	messageSchema: JSONSchema4 | JSONSchema7 | null;
	usedLenses: UsedLens[];
	setUsedLenses: (lenses: UsedLens[]) => void;
}

export interface MessageEditorMethods {
	getFilledMessage: () => object | null;
}

const DEFAULT_EDITOR_HEIGHT = 700;

export type UntypedField = {
	fieldName: string;
	field: Record<string, any>;
	ref?: string;
};

const MessageEditor = ({
	messageSchema,
	usedLenses,
}: Props, ref: React.Ref<MessageEditorMethods>) => {
	const store = useStore();
	const messageListDataStore = store.messageListDataStore;

	const monacoRef = React.useRef<Monaco>();
	const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor>();
	const uri = React.useRef<monacoEditor.Uri>();
	const [code, setCode] = React.useState('{}');
	const [untypedDefinitions, setUntypedDefinitions] = React.useState<UntypedField[]>([]);
	const [untypedProps, setUntypedProps] = React.useState<UntypedField[]>([]);
	const [actionsDispose, setActionsDispose] = React.useState<monacoEditor.IDisposable>();
	const [lensesDispose, setLensesDispose] = React.useState<monacoEditor.IDisposable>();
	const [isOpen, setIsOpen] = React.useState(false);
	const [objectPath, setObjectPath] = React.useState('');
	const [cursorPosition, setCursorPosition] = React.useState<monacoEditor.IPosition>();
	const [numberLastUsedLense, setNumberLastUsedLense] = React.useState<number>();

	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;
		editorRef.current.addAction(getSchemaAction);
	};

	const [editorHeight, setEditorHeight] = React.useState(DEFAULT_EDITOR_HEIGHT);

	const editorHeightObserver = React.useRef(
		new ResizeObserver((entries: ResizeObserverEntry[]) => {
			setEditorHeight(entries[0]?.contentRect.height || DEFAULT_EDITOR_HEIGHT);
		}),
	);

	const rootRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (rootRef.current) {
			editorHeightObserver.current.observe(rootRef.current);
		}
		return () => {
			if (rootRef.current) {
				editorHeightObserver.current.unobserve(rootRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		if (actionsDispose) actionsDispose.dispose();
		if (lensesDispose) lensesDispose.dispose();
		untypedDefinitions.splice(0, untypedDefinitions.length);
		usedLenses.splice(0, usedLenses.length);
		if (!monacoRef.current) return;
		if (messageSchema) {
			const schema = toJS(messageSchema);
			uri.current = monacoRef.current.Uri.parse('://b/$schema.json');
			initiateSchema(messageSchema);
			if (schema.definitions && schema.properties) {
				const { definitions, properties } = schema;
				untypedDefinitions.splice(0, untypedDefinitions.length);
				untypedProps.splice(0, untypedProps.length);
				searchUntypedProperties(properties);
				searchUntypedDefinitions(definitions);
				initialMarkers();
			}
			setNewSchema(schema);
		} else {
			setCode('{}');
			if (messageListDataStore.editMessageMode) {
				messageListDataStore.setEditorCode('{}');
			}
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						uri: 'do.not.load',
						schema: {},
					},
				],
			});
		}
	}, [messageSchema]);

	React.useEffect(() => {
		registerActionProvider();
		registerLens();
	}, [messageSchema]);

	const searchUntypedDefinitions = (definitions: Record<string, any>) => {
		const recursive = (obj: Record<string, any>) => {
			const keys = Object.keys(obj);
			keys.forEach(key => {
				if (
					obj[key].additionalProperties
					&& typeof obj[key].additionalProperties === 'object'
					&& typeof obj[key].additionalProperties.additionalProperties === 'boolean'
				) {
					untypedDefinitions.push({
						fieldName: key,
						field: obj[key],
					});
				}
				if (typeof obj[key] === 'object') {
					recursive(obj[key]);
				}
			});
		};
		Object.keys(definitions).forEach(definition => recursive(definitions[definition]));
	};

	const searchUntypedProperties = (properties: Record<string, any>) => {
		const nameObjects = Object.keys(properties);
		const recursive = (prop: Record<string, any>, propName: string) => {
			if (!prop.properties && (prop.$ref || (prop.additionalProperties && prop.additionalProperties.$ref))) {
				untypedProps.push(
					{
						fieldName: propName,
						field: prop,
						ref: prop.$ref ? prop.$ref : prop.additionalProperties.$ref,
					},
				);
			} else if (prop.properties) {
				const nestedPropertiesName = Object.keys(prop.properties);
				nestedPropertiesName.forEach(name => recursive(prop.properties[name], name));
			}
		};
		nameObjects.forEach(name => recursive(properties[name], name));
	};

	const onValueChange: OnChange = (value, ev) => {
		setCode(value || '{}');
	};

	const initiateSchema = (message: JSONSchema4 | JSONSchema7) => {
		const initialSchema = createInitialActMessage(message) || '{}';
		setCode(initialSchema);
		store.setIsSchemaApplied(true);
		initialMarkers();
	};

	React.useImperativeHandle(
		ref,
		() => ({
			getFilledMessage: () => {
				let filledMessage: object | null;
				try {
					filledMessage = JSON.parse(code);
				} catch (e) {
					filledMessage = null;
				}
				return filledMessage;
			},
		}),
		[code],
	);

	const getSchemaAction = {
		id: 'GET_SCHEMA',
		label: 'Get additional schema',
		title: 'Getting additional schema',
		run: (editor: monacoEditor.editor.ICodeEditor, range: monacoEditor.IRange, numberLineLense: number) =>
			getSchemaDialog(range, editor, numberLineLense),
		contextMenuOrder: 1,
		contextMenuGroupId: '1_modification',
	};

	const getPathByCursor = () => {
		const position = editorRef.current?.getPosition();
		const currentModel = editorRef.current?.getModel();
		const rows = currentModel?.getLinesContent();
		if (position && currentModel && rows && editorRef.current) {
			const word = currentModel.getWordAtPosition(position);
			if (word && untypedDefinitions.find(untyped => untyped.fieldName.includes(word.word))) {
				return getPathByRange(position, editorRef.current);
			}
			const posiblePosition = { ...position };
			while (posiblePosition.lineNumber !== 0) {
				const check = rows[posiblePosition.lineNumber - 1].match(/: {/);
				if (check?.index) {
					return getPathByRange(
						{
							lineNumber: posiblePosition.lineNumber,
							column: check.index,
						},
						editorRef.current,
					);
				}
				posiblePosition.lineNumber -= 1;
			}
			alert('Not found untyped field');
			throw new Error('Not found untyped field');
		}
		alert('Field not found');
		throw new Error('Field not found');
	};

	const getPathByRange = (position: monacoEditor.IPosition, editor: monacoEditor.editor.ICodeEditor) => {
		const model = editor.getModel();
		if (!model) throw Error('Model not found');
		const word = model.getWordAtPosition(position);
		if (!word) {
			throw new Error(`Word not found on position line: ${position.lineNumber} column: ${position.column}`);
		}
		if (!untypedDefinitions.find(untyped => untyped.fieldName.includes(word.word))) {
			alert('Not found untyped field');
			throw Error('Not found untyped field');
		}
		let path = word.word;
		const startingPosition = { lineNumber: position.lineNumber + 1, column: word.startColumn - 4 };
		let tempWord: null | monacoEditor.editor.IWordAtPosition = null;
		while (tempWord === null) {
			tempWord = model.getWordAtPosition(startingPosition);
			if (tempWord === null) {
				startingPosition.lineNumber -= 1;
			}
			if (startingPosition.lineNumber === 0) {
				break;
			}
		}
		path = `${tempWord ? tempWord.word : ' '}-${path}`;
		return { path, position };
	};

	const getSchemaDialog = async (
		range?: monacoEditor.IRange,
		editor?: monacoEditor.editor.ICodeEditor,
		numberLineLense?: number,
	) => {
		const nestingAndPosition = range && editor
			? getPathByRange({ lineNumber: range.startLineNumber, column: range.startColumn }, editor)
			: getPathByCursor();
		const { path, position } = nestingAndPosition;
		setObjectPath(path);
		setCursorPosition(position);
		setIsOpen(true);
		setNumberLastUsedLense(numberLineLense);
	};

	const onSelectHandler = async (value: string) => {
		setIsOpen(false);
		const splittedString = value.split(' ');
		if (splittedString.length === 2) {
			const [dictionaryName, messageType] = splittedString;
			const additionalSchema = await requestSchema(messageType, dictionaryName);
			if (monacoRef.current?.languages.json.jsonDefaults.diagnosticsOptions.schemas && cursorPosition) {
				const schema = monacoRef.current?.languages.json.jsonDefaults.diagnosticsOptions.schemas[0].schema;
				updateSchema(additionalSchema[messageType], schema);
			}
			if (numberLastUsedLense) {
				usedLenses.push({ lineNumber: numberLastUsedLense, schemaName: value });
				setNumberLastUsedLense(undefined);
			}
		}
	};

	const updateSchema = (
		additionalSchema: Record<string, any>,
		currentSchema: Record<string, any>,
	) => {
		const [parentName, fieldName] = objectPath.split('-');
		const definition = untypedDefinitions.find(untyped => untyped.fieldName === fieldName);
		const propertie = untypedProps.find(prop => prop.fieldName === parentName);
		if (definition && propertie) {
			propertie.field.properties = {
				[definition.fieldName]: additionalSchema,
			};
		}
		const initialAdditionsSchema = createInitialActMessage(additionalSchema)?.split('\n');
		const lines = editorRef.current?.getModel()?.getLinesContent();
		if (lines && initialAdditionsSchema && cursorPosition) {
			const cleanedLines = removeOldValue(lines);
			const startIndex = cursorPosition.lineNumber - 1;
			const notLastField = /},/.test(cleanedLines[startIndex]);
			cleanedLines[startIndex] = cleanedLines[startIndex].replace(/},*/, '');
			initialAdditionsSchema.splice(0, 1);
			if (notLastField) initialAdditionsSchema[initialAdditionsSchema.length - 1] += ',';
			cleanedLines.splice(cursorPosition.lineNumber, 0, ...initialAdditionsSchema);
			const newValue = cleanedLines.join('\n');
			editorRef.current?.getModel()?.setValue(newValue);
			editorRef.current?.trigger('anyString', 'editor.action.formatDocument', '');
		}
		setNewSchema(currentSchema);
	};

	const removeOldValue = (lines: string[]) => {
		const model = editorRef.current?.getModel();
		const newLines = [...lines];
		if (cursorPosition && model && !newLines[cursorPosition.lineNumber - 1].includes('{}')) {
			const startRemoveIndex = cursorPosition.lineNumber;
			let endRemoveIndex: undefined | number;
			let word: null | string = null;
			let searchPosition: monacoEditor.IRange = {
				startLineNumber: cursorPosition.lineNumber + 1,
				endColumn: cursorPosition.column + 1,
				startColumn: cursorPosition.column - 1,
				endLineNumber: cursorPosition.lineNumber + 1,
			};
			while (searchPosition.startLineNumber !== newLines.length + 1) {
				word = model.getValueInRange(searchPosition);
				if (word.trim() === '}' || word.trim() === '},') {
					endRemoveIndex = searchPosition.startLineNumber;
					break;
				}
				searchPosition = {
					startLineNumber: searchPosition.startLineNumber + 1,
					endColumn: searchPosition.endColumn,
					startColumn: searchPosition.startColumn,
					endLineNumber: searchPosition.endLineNumber + 1,
				};
			}
			if (endRemoveIndex) {
				newLines.splice(startRemoveIndex, endRemoveIndex - startRemoveIndex);
				newLines[startRemoveIndex - 1] += word?.trim();
			}
		}
		return newLines;
	};

	const requestSchema = async (messageType: string, dictionaryName: string) => {
		const result = await api.getMessage(messageType, dictionaryName);
		if (result) {
			return result;
		}
		alert('Schema not found');
		throw Error('Schema not found');
	};

	const initialMarkers = (markers?: monacoEditor.editor.IMarker[]) => {
		const model = editorRef.current?.getModel();
		if (model && monacoRef.current) {
			const markerPositions: monacoEditor.Range[] = [];
			const markerModels = monacoRef.current.editor.getModelMarkers({});
			untypedDefinitions.forEach(field => {
				const matches = model.findMatches(field.fieldName, true, false, true, '"', false);
				matches.forEach(math => {
					if (!markerModels.find(marker => marker.startLineNumber === math.range.startLineNumber)) {
						markerPositions.push(math.range);
					}
				});
			});
			const newMarkers = markerPositions.map(position => ({
				startLineNumber: position.startLineNumber,
				startColumn: position.startColumn,
				endLineNumber: position.endLineNumber,
				endColumn: position.endColumn,
				severity: monacoEditor.MarkerSeverity.Info,
				owner: 'json',
				message: 'Press F1 and select get schema to add schema',
			}));
			if (monacoRef.current) {
				monacoRef.current.editor.setModelMarkers(model, 'json', newMarkers.concat(markers || []));
			}
		}
	};

	const registerActionProvider = () => {
		const provideCodeActions = (
			model: monacoEditor.editor.ITextModel,
			range: monacoEditor.Range,
			context: monacoEditor.languages.CodeActionContext,
			token: monacoEditor.CancellationToken,
		) => {
			const actions: monacoEditor.languages.CodeAction[] = [];
			context.markers.forEach(marker => {
				if (marker.message === 'Press F1 and select get schema to add schema') {
					actions.push(
						{
							title: 'Get schema',
							diagnostics: [marker],
							kind: 'quickfix',
							command: {
								id: 'vs.editor.ICodeEditor:1:GET_SCHEMA',
								title: 'Get schema',
								arguments: [range],
							},
							isPreferred: true,
						},
					);
				}
			});
			return {
				actions,
				dispose: () => null,
			};
		};

		if (monacoRef.current) {
			setActionsDispose(monacoRef.current.languages.registerCodeActionProvider('json', { provideCodeActions }));
		}
	};

	const registerLens = () => {
		if (!monacoRef.current) return;
		const provideCodeLenses = () => {
			const markers = monacoRef.current?.editor.getModelMarkers({});
			const lenses: monacoEditor.languages.CodeLens[] = [];
			if (markers) {
				markers.forEach(marker => {
					if (marker.message === 'Press F1 and select get schema to add schema') {
						const range = new monacoEditor.Range(
							marker.startLineNumber,
							marker.startColumn,
							marker.endLineNumber,
							marker.endColumn,
						);
						const usedLens = usedLenses.find(used => used.lineNumber === marker.startLineNumber);
						lenses.push(
							{
								command: {
									id: 'vs.editor.ICodeEditor:1:GET_SCHEMA',
									title: usedLens ? usedLens.schemaName : 'Get Schema',
									arguments: [range, marker.startLineNumber],
								},
								id: marker.startLineNumber.toString(),
								range,
							},
						);
					}
				});
			}
			return { lenses, dispose: () => null };
		};
		setLensesDispose(monacoRef.current.languages.registerCodeLensProvider('json', { provideCodeLenses }));
	};

	const setNewSchema = (schema: Record<string, any>) => {
		if (!monacoRef.current) return;
		const json = JSON.stringify(schema);
		const blob = new Blob([json], { type: 'application/json' });
		const blobUri = URL.createObjectURL(blob);
		monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			schemas: [
				{
					uri: blobUri,
					fileMatch: ['*'],
					schema,
				},
			],
			enableSchemaRequest: true,
		});
	};

	initialMarkers();

	return (
		<>
			<ModalPortal isOpen={isOpen}>
				<GetSchemaModal
					onSelect={onSelectHandler}
					dictionaries={store.dictionaries}
					closeModal={setIsOpen}
				/>
			</ModalPortal>
			<div ref={rootRef} style={{ height: '100%', zIndex: 1 }}>
				<Editor
					height={editorHeight}
					language='json'
					onChange={onValueChange}
					onMount={handleEditorDidMount}
					onValidate={initialMarkers}
					value={messageListDataStore.editMessageMode ? messageListDataStore.editorCode : code}
				/>
			</div>
		</>
	);
};

export default observer(MessageEditor, { forwardRef: true });
