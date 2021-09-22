import React from 'react';
import Editor, { monaco, Monaco } from '@monaco-editor/react';

const ResultMonacoEditor = (props: { value: string }) => {
	const monacoEditor = React.useRef<Monaco>();

	monaco.init().then((_monaco: Monaco) => {
		monacoEditor.current = _monaco;
		monacoEditor.current.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: false,
		});
	});

	return (
		<Editor
			height={250}
			width={'100%'}
			language='json'
			value={props.value}
			options={{
				minimap: { enabled: false },
				readOnly: true,
				lineNumbers: 'off',
				wordWrap: 'on',
			}}></Editor>
	);
};

export default ResultMonacoEditor;
