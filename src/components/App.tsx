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
import { Tab, Tabs } from '@material-ui/core';
import Result from './Result';
import Button from './Button';
import '../styles/root.scss';
import MessageEditor, { MessageEditorMethods } from './MessageEditor';
import { useStore } from '../hooks/useStore';
import Control from './Control';
import SplashScreen from './SplashScreen';
import Store from '../stores/Store';
import { MessageSendingResponse } from '../models/Message';
import MessageHistory from './MessageHistory';
import '../styles/message-list.scss';
import { EmbeddedEditor } from './EmbeddedEditor';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import TabPanel from './TabPanel';

const App = () => {
	const store: Store = useStore();
	const messageListDataStore = store.currentHistoryStore;
	const [currentTab, setCurrentTab] = React.useState(0);
	const [panelArea, setPanelArea] = React.useState(50);
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

	const selectTab = (e: React.ChangeEvent<{}>, tab: number) => {
		setCurrentTab(tab);
	};

	return (
		<div className='app'>
			<div className='app__body'>
				<Control />
				<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
					<SplitViewPane>
						<MessageEditor messageSchema={store.selectedSchema} ref={messageEditorRef} />
					</SplitViewPane>

					<SplitViewPane>
						<div className='app__tabs-container'>
							<Tabs value={currentTab} onChange={selectTab}>
								<Tab label='Result' className='app__tab' />
								<Tab label='History' className='app__tab' />
								<Tab label='Dictionary' className='app__tab' />
							</Tabs>
							<TabPanel tabIndex={0} currentTab={currentTab}>
								<div>
									<h3 className='app__title'>Result</h3>
									<Result response={response} />
								</div>
							</TabPanel>
							<TabPanel tabIndex={1} currentTab={currentTab}>
								<MessageHistory />
							</TabPanel>
							<TabPanel tabIndex={2} currentTab={currentTab}>
								<EmbeddedEditor
									schema='schema-qa'
									object={store.selectedDictionaryName || ''}
									editorMode='dictionaryEditor'
									embedded='true'
								/>
							</TabPanel>
						</div>
					</SplitViewPane>
				</SplitView>
				{store.isSchemaLoading && <div className='overlay' />}
				<div className='app__buttons'>
					<Button
						onClick={
							messageListDataStore.editMessageMode
								? messageListDataStore.saveEditedMessage
								: sendMessage
						}
						disabled={!store.isSendingAllowed}>
						<span>{messageListDataStore.editMessageMode ? 'Save' : 'Send Message'}</span>
						{store.isSending ? (
							<SplashScreen />
						) : (
							<i className={messageListDataStore.editMessageMode ? '' : 'arrow-right-icon'} />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default hot(observer(App));
