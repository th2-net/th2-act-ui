import React from 'react';
import Editor, {
	monaco,
	EditorDidMount,
	Monaco,
} from '@monaco-editor/react';

const ResultMonacoEditor = (props: { value: string }) => {
	const monacoEditor = React.useRef<Monaco>();
	const handleEditorDidMount: EditorDidMount = (fn, editor) => {
		editor.updateOptions({
			minimap: { enabled: false },
			readOnly: true,
			lineNumbers: 'off',
			wordWrap: 'on',
		});
	};

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
			height={250}
			width={'100%'}
			language='json'
			value={props.value}
			editorDidMount={handleEditorDidMount}></Editor>
	);
};

export default ResultMonacoEditor;
