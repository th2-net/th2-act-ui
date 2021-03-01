/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import React from 'react';
import {
	monaco,
	EditorDidMount,
	ControlledEditor,
	ControlledEditorOnChange,
	Monaco,
} from '@monaco-editor/react';
// eslint-disable-next-line import/no-unresolved
import { Uri } from 'monaco-editor';
import { toJS } from 'mobx';
import { isParsedMessage, Message } from '../models/Message';
import { createInitialActMessage, createInitialParsedMessage, createParsedSchema } from '../helpers/schema';

interface Props {
	messageSchema: Message | null;
}

export interface MessageEditorMethods {
	getFilledMessage: () => object | null;
}

const MessageEditor = React.forwardRef(({ messageSchema }: Props, ref: React.Ref<MessageEditorMethods>) => {
	const monacoRef = React.useRef<Monaco>();
	const valueGetter = React.useRef<(() => string) | null>(null);
	const uri = React.useRef<Uri>();
	const [code, setCode] = React.useState('{}');

	const handleEditorDidMount: EditorDidMount = _valueGetter => {
		valueGetter.current = _valueGetter;
	};

	React.useEffect(() => {
		monaco.init().then((_monaco: Monaco) => {
			monacoRef.current = _monaco;
			if (messageSchema) {
				initiateSchema(messageSchema);
			} else {
				monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
					validate: true,
					schemas: [{
						uri: 'do.not.load',
						schema: {},
					}],
				});
			}
		});
	}, []);

	React.useEffect(() => {
		if (!monacoRef.current) return;
		if (messageSchema) {
			const isParsedMessageSchema = isParsedMessage(messageSchema);
			const schema = isParsedMessage(messageSchema) ? createParsedSchema(messageSchema) : toJS(messageSchema);
			const messageTitle = Object.keys(messageSchema)[0];
			uri.current = monacoRef.current.Uri.parse(
				`://b/${isParsedMessageSchema ? messageTitle : 'act'}.json`,
			);
			initiateSchema(messageSchema);
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						uri: `http://myserver/${isParsedMessageSchema ? messageTitle : 'act'}.json`,
						fileMatch: ['*'],
						schema: isParsedMessageSchema ? {
							type: 'object',
							properties: schema,
						} : schema,
					},
				],
			});
		} else {
			setCode('{}');
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [{
					uri: 'do.not.load',
					schema: {},
				}],
			});
		}
	}, [messageSchema]);

	const onValueChange: ControlledEditorOnChange = (event, value) => {
		setCode(value || '{}');
	};

	const initiateSchema = (message: Message) => {
		const initialSchema = isParsedMessage(message)
			? createInitialParsedMessage(message) || '{}'
			: createInitialActMessage(message) || '{}';
		setCode(initialSchema);
	};

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
		<ControlledEditor
			height="500px"
			language="json"
			value={code}
			onChange={onValueChange}
			editorDidMount={handleEditorDidMount}
		/>
	);
});

MessageEditor.displayName = 'MessageEditor';

export default MessageEditor;
