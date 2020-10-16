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
import Prism from 'prismjs';
// eslint-disable-next-line import/no-unassigned-import
import 'prismjs/themes/prism.css';
import '../styles/message-editor.scss';

const MessageEditor = () => {
	const [content, setContent] = React.useState(
		JSON.stringify(
			{},
			null,
			4,
		),
	);

	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const codeRef = React.useRef<HTMLPreElement>(null);

	const handleKeyDown = (evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
		let value = content;
		const selStartPos = evt.currentTarget.selectionStart;

		if (evt.key === 'Tab') {
			value =				`${value.substring(0, selStartPos)
			}    ${
				value.substring(selStartPos, value.length)}`;
			// eslint-disable-next-line no-param-reassign
			evt.currentTarget.selectionStart = selStartPos + 3;
			// eslint-disable-next-line no-param-reassign
			evt.currentTarget.selectionEnd = selStartPos + 4;
			evt.preventDefault();

			setContent(value);
		}
	};

	React.useEffect(() => {
		Prism.highlightAll();
	}, []);

	React.useEffect(() => {
		Prism.highlightAll();
	}, [content]);

	return (
		<div className="code-edit-container">
			<textarea
				className="code-input"
				value={content}
				onChange={evt => setContent(evt.target.value)}
				onKeyDown={handleKeyDown}
				ref={textareaRef}
				onScroll={e => {
					if (codeRef.current) {
						codeRef.current.scrollTop = e.currentTarget.scrollTop;
					}
				}}
			/>
			<pre className="code-output" ref={codeRef}>
				<code className="language-javascript">{content}</code>
			</pre>
		</div>
	);
};

export default MessageEditor;
