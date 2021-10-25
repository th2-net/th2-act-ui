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
import Editor, { monaco, Monaco } from '@monaco-editor/react';

const ResultMonacoEditor = (props: { value: string }) => {
	const monacoEditor = React.useRef<Monaco>();

	React.useEffect(() => {
		monaco.init().then((_monaco: Monaco) => {
			monacoEditor.current = _monaco;
			monacoEditor.current.languages.json.jsonDefaults.setDiagnosticsOptions({
				validate: false,
			});
		});
	}, []);

	return (
		<Editor
			height='250px'
			language='json'
			value={props.value}
			options={{
				minimap: { enabled: false },
				readOnly: true,
				lineNumbers: 'off',
				wordWrap: 'on',
			}}
		/>
	);
};

export default ResultMonacoEditor;
