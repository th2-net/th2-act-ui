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

import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Result from './Result';
import Button from './Button';
import '../styles/root.scss';
import MessageEditor, { MessageEditorMethods } from './MessageEditor';
import { useStore } from '../hooks/useStore';
import Control from './Control';
import SplashScreen from './SplashScreen';
import Store from '../stores/Store';

const App = () => {
	const store: Store = useStore();

	const [response, setResponse] = useState<{ code: number | null; message: string | null }>({
		code: null,
		message: null,
	});

	const messageEditorRef: React.RefObject<MessageEditorMethods> = React.useRef(null);

	const generateErrorMessage = (): string => {
		let result = '';

		if (store.selectedSession === null) {
			result += 'ERROR: session is not selected';
		}

		if (store.selectedDictionaryName === null) {
			result += '\nERROR: dictionary is not selected';
		}

		if (store.selectedMessageType === null) {
			result += '\nERROR: msg type is not selected';
		}

		return result;
	};

	const sendMessage = () => {
		if (messageEditorRef.current) {
			const filledMessage = messageEditorRef.current.getFilledMessage();
			if (filledMessage) {
				store.sendMessage(filledMessage)
					.then(res => {
						if (res !== null) {
							res.text()
								.then(text =>
									setResponse({
										code: res.status,
										message: text,
									}));
						} else {
							setResponse({
								code: 500,
								message: generateErrorMessage(),
							});
						}
					});
			}
		}
	};

	return (
		<div className="app">
			<div className="app__header">
				<h3 className="app__title">Configuration</h3>
			</div>
			<div className="app__body">
				<Control/>
				<div className="app__editor">
					<MessageEditor messageSchema={store.selectedSchema} ref={messageEditorRef}/>
					{store.isShemaLoading
					&& <div className="overlay"/>}
				</div>
				<div className="app__buttons">
					<Button>
						<i className="clear-icon"/>
						<span>Clear</span>
					</Button>
					<Button
						onClick={store.isSending ? undefined : sendMessage}
						className={store.isSending ? 'disabled' : ''}
					>
						<span>Send Message</span>
						{store.isSending ? <SplashScreen/> : <i className="arrow-right-icon"/>}
					</Button>
				</div>
				<div className="app__result">
					<h3 className="app__title">Result</h3>
					<Result code={response.code} message={response.message}/>
				</div>
			</div>
		</div>
	);
};

export default hot(observer(App));
