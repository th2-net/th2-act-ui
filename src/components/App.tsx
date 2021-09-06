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
import { observer } from 'mobx-react-lite';
import Result from './Result';
import Button from './Button';
import '../styles/root.scss';
import MessageEditor, { MessageEditorMethods } from './MessageEditor';
import { useStore } from '../hooks/useStore';
import Control from './Control';
import SplashScreen from './SplashScreen';
import Store from '../stores/Store';
import { MessageSendingResponse } from '../models/Message';

const App = () => {
	const store: Store = useStore();

	const [response, setResponse] = React.useState<MessageSendingResponse | null>(null);

	const messageEditorRef = React.useRef<MessageEditorMethods>(null);

	const sendMessage = async () => {
		if (messageEditorRef.current) {
			const filledMessage = messageEditorRef.current.getFilledMessage();
			if (filledMessage) {
				setResponse(await store.sendMessage(filledMessage));
			}
		}
	};

	const messageSchema = store.selectedSchema;

	return (
		<div className='app'>
			<div className='app__body'>
				<Control />
				<div className='app__editor'>
					<MessageEditor
						messageSchema={messageSchema}
						ref={messageEditorRef}
					/>
					{store.isSchemaLoading && <div className='overlay' />}
				</div>
				<div className='app__buttons'>
					<Button onClick={sendMessage} disabled={!store.isSendingAllowed}>
						<span>Send Message</span>
						{store.isSending ? <SplashScreen /> : <i className='arrow-right-icon' />}
					</Button>
				</div>
				<div className='app__result'>
					<h3 className='app__title'>Result</h3>
					<Result response={response} />
				</div>
			</div>
		</div>
	);
};

export default hot(observer(App));
