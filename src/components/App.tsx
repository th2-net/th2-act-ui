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
import { Tab, Tabs, Button, CircularProgress, Box } from '@mui/material';
import { Send, Check, Replay } from '@mui/icons-material';
import { useEffect } from 'react';
import Result from './result/Result';
import '../styles/root.scss';
import MessageEditor, { MessageEditorMethods } from './MessageEditor';
import { useRootStore } from '../hooks/useRootStore';
import Control from './Control';
import '../styles/message-list.scss';
import { EmbeddedEditor } from './EmbeddedEditor';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import TabPanel from './TabPanel';
import useMessagesStore from '../hooks/useMessagesStore';
import useEditorStore from '../hooks/useEditorStore';
import useMessageHistoryStore from '../hooks/useMessageHistoryStore';
import ReplayView from './replay/ReplayView';
import MessageWorker from '../workers/MessageWorker';
import MessageWorkerProvider from '../contexts/messageWorkerContext';
import HistoryView from './history/HistoryView';

const App = () => {
	const store = useRootStore();
	const [messageWorker] = React.useState(() => new MessageWorker());
	const messagesStore = useMessagesStore();
	const editorStore = useEditorStore();
	const historyStore = useMessageHistoryStore();
	const { replayList, resetStatuses } = historyStore;
	const [currentTab, setCurrentTab] = React.useState(0);
	const [panelArea, setPanelArea] = React.useState(50);
	const [schema, setSchema] = React.useState<string | null>(null);
	const [isCodeValid, setIsCodeValid] = React.useState(false);
	const [isReplaying, setIsReplaying] = React.useState(false);

	const startReplay = () => {
		if (replayList[0]) {
			resetStatuses();
			setIsReplaying(true);
			replayMessageRecursive(0);
		}
	};

	const replayMessageRecursive = (index: number) => {
		setTimeout(() => {
			historyStore.replayMessage(replayList[index].id).then(() => {
				if (index < replayList.length - 1) {
					replayMessageRecursive(index + 1);
				} else {
					setIsReplaying(false);
				}
			});
		}, replayList[index].delay);
	};

	React.useEffect(() => {
		// TODO: improve detecting schema

		const urlSchema = window.location.pathname.split('/')[1];
		if (urlSchema) {
			setSchema(urlSchema.replace(/^th2-/, ''));
		}
	}, [setSchema]);

	const messageEditorRef = React.useRef<MessageEditorMethods>(null);

	React.useEffect(() => messageWorker.dispose, []);

	const sendMessage = () => {
		if (messageEditorRef.current) {
			const filledMessage = messageEditorRef.current.getFilledMessage();
			if (filledMessage) {
				messagesStore.sendMessage(filledMessage);
			}
		}
	};

	const selectTab = (e: React.ChangeEvent<{}>, tab: number) => {
		setCurrentTab(tab);
	};

	useEffect(() => {
		store.init();
	}, [store]);

	useEffect(() => {
		if (store.schemaType !== 'parsedMessage' && currentTab === 3) {
			setCurrentTab(0);
		}
	}, [store.schemaType, currentTab]);

	return (
		<MessageWorkerProvider value={messageWorker}>
			<div className='app'>
				<div className='app__body'>
					<Control />
					<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
						<SplitViewPane>
							<MessageEditor
								setIsValid={setIsCodeValid}
								messageSchema={editorStore.currentOptionsStore.schema}
								ref={messageEditorRef}
							/>
						</SplitViewPane>

						<SplitViewPane>
							<Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
								<Tabs
									value={currentTab}
									onChange={selectTab}
									sx={{
										bgcolor: 'white',
										width: 'min-content',
										borderTopLeftRadius: 6,
										borderTopRightRadius: 6,
									}}>
									<Tab label='Result' className='app__tab' />
									<Tab label='History' className='app__tab' />
									<Tab label='Replay' className='app_tab' />
									{store.schemaType === 'parsedMessage' && (
										<Tab label='Dictionary' className='app__tab' />
									)}
								</Tabs>
								<TabPanel tabIndex={0} currentTab={currentTab}>
									<Result response={messagesStore.messageSendingResponse} />
								</TabPanel>
								<TabPanel tabIndex={1} currentTab={currentTab}>
									<HistoryView />
								</TabPanel>
								<TabPanel tabIndex={2} currentTab={currentTab}>
									<ReplayView />
								</TabPanel>
								<TabPanel tabIndex={3} currentTab={currentTab}>
									<EmbeddedEditor
										schema={schema}
										object={store.editorStore.options.parsedMessage.selectedDictionary || ''}
									/>
								</TabPanel>
							</Box>
						</SplitViewPane>
					</SplitView>
					<div className='app__buttons'>
						{currentTab === 2 ? (
							<Button
								variant='contained'
								endIcon={isReplaying ? <CircularProgress color='inherit' size={14} /> : <Replay />}
								onClick={() => !isReplaying && startReplay()}>
								{isReplaying ? 'Replaying' : 'Start replay'}
							</Button>
						) : (
							<Button
								variant='contained'
								endIcon={
									messagesStore.isSending ? (
										<CircularProgress color='inherit' size={14} />
									) : historyStore.editMessageMode ? (
										<Check />
									) : (
										<Send />
									)
								}
								onClick={historyStore.editMessageMode ? historyStore.saveEditedMessage : sendMessage}
								disabled={!editorStore.currentOptionsStore.allOptionsSelected || !isCodeValid}>
								{historyStore.editMessageMode ? 'Save' : 'Send Message'}
							</Button>
						)}
					</div>
				</div>
			</div>
		</MessageWorkerProvider>
	);
};

export default hot(observer(App));
