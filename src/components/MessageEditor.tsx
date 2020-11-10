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
} from '@monaco-editor/react';
import { Field, Message } from '../models/Message';
import { createSchema } from '../helpers/schema';

interface Props {
	messageSchema: Message | null;
}

const MessageEditor = ({ messageSchema }: Props) => {
	const monacoRef = React.useRef<any>(null);
	const valueGetter = React.useRef<(() => string) | null>(null);
	const uri = React.useRef<string>('');
	const [code, setCode] = React.useState('{}');

	const handleEditorDidMount: EditorDidMount = _valueGetter => {
		valueGetter.current = _valueGetter;
	};

	React.useEffect(() => {
		monaco.init().then(_monaco => {
			(monacoRef as any).current = _monaco;
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
		(uri as any).current = monacoRef.current.Uri.parse('://b/foo.json');
		if (messageSchema) {
			initiateSchema(messageSchema);
			monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: true,
				schemas: [
					{
						uri: 'http://myserver/foo-schema.json',
						fileMatch: ['*'],
						schema: {
							type: 'object',
							properties: createSchema(messageSchema[Object.keys(messageSchema)[0]].content),
						},
					},
				],
			});
		} else {
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
		setCode(value || '');
	};

	const initiateSchema = (schema: Message) => {
		try {
			const extractField = (field: Field, title: string): any => {
				if (!field.required) return {};
				if (field.type === 'simple') {
					const allowedValues = Object.values(field.allowedValues);
					const value = field.defaultValue
						? field.defaultValue
						: allowedValues.length
							? allowedValues[0]
							: '';
					return {
						[title]: value,
					};
				}
				if (field.type === 'map') {
					return {
						[title]: {
							...Object.keys(field.value)
								.reduce((prev, curr) => extractField(field.value[curr], curr), {}),
						},
					};
				}
				return {};
			};
			const content = schema[Object.keys(schema)[0]].content;
			const result = Object.keys(content)
				.reduce((prev, curr) => ({
					...prev,
					...extractField(content[curr], curr),
				}), {});
			const regex = new RegExp('""', 'g');
			const replaced = JSON.stringify(result, null, 4).replace(regex, '');
			setCode(replaced);
		} catch (error) {
			console.log('Error occured while initating message');
		}
	};

	return (
		<ControlledEditor
			height="500px"
			language="json"
			value={code}
			onChange={onValueChange}
			editorDidMount={handleEditorDidMount}
		/>
	);
};

export default MessageEditor;
