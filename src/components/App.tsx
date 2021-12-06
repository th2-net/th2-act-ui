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
import { hot } from 'react-hot-loader/root';
import { observer } from 'mobx-react-lite';
import { Tab, Tabs, Button, CircularProgress, Box } from '@mui/material';
import { Send, Check, Replay } from '@mui/icons-material';
import Result from './result/Result';
import '../styles/root.scss';
import MessageEditor from './message-editor/MessageEditor';
import { useRootStore } from '../hooks/useRootStore';
import Control from './message-editor/Control';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import TabPanel from './util/TabPanel';
import useMessagesStore from '../hooks/useMessagesStore';
import useEditorStore from '../hooks/useEditorStore';
import useReplayStore from '../hooks/useReplayStore';
import ReplayView from './replay/ReplayView';
import MessageWorker from '../stores/MessageWorker';
import MessageWorkerProvider from '../contexts/messageWorkerContext';
import MessagesView from './messages/MessagesView';
import DictionaryView from './dictionary/DictionaryView';

const App = () => {
	const store = useRootStore();
	const [messageWorker] = React.useState(() => new MessageWorker());
	const messagesStore = useMessagesStore();
	const editorStore = useEditorStore();
	const replayStore = useReplayStore();
	const [currentTab, setCurrentTab] = React.useState(0);
	const [panelArea, setPanelArea] = React.useState(50);
	const [showReplacementsConfig, toggleReplacementsConfig] = React.useState(false);

	React.useEffect(() => messageWorker.dispose, []);

	const sendMessage = () => {
		const { filledMessage } = editorStore;

		if (filledMessage) {
			messagesStore.sendMessage(filledMessage);
		}
	};

	React.useEffect(() => {
		store.init();
	}, [store]);

	React.useEffect(() => {
		if (store.schemaType === 'act' && currentTab === 3) {
			setCurrentTab(0);
		}
	}, [store.schemaType, currentTab]);

	return (
		<MessageWorkerProvider value={messageWorker}>
			<div className='app'>
				<div className='app__body'>
					<Control showConfig={showReplacementsConfig} toggleConfig={toggleReplacementsConfig} />
					<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
						<SplitViewPane>
							<MessageEditor
								messageSchema={editorStore.currentOptionsStore.schema}
								openReplacementsConfig={() => toggleReplacementsConfig(true)}
							/>
						</SplitViewPane>

						<SplitViewPane>
							<Box height='100%' display='grid' gridTemplateRows='auto 1fr'>
								<Tabs
									value={currentTab}
									onChange={(_, tab) => setCurrentTab(tab)}
									sx={{
										bgcolor: 'white',
										width: 'min-content',
										borderTopLeftRadius: 6,
										borderTopRightRadius: 6,
									}}>
									<Tab label='Result' className='app__tab' />
									<Tab label='Messages' className='app__tab' />
									<Tab label='Replay' className='app__tab' />
									<Tab
										label='Dictionary'
										className='app__tab'
										disabled={store.schemaType !== 'parsedMessage'}
									/>
								</Tabs>
								<TabPanel currentTab={currentTab} tabIndex={0}>
									<Result
										response={messagesStore.messageSendingResponse ?? undefined}
										appliedReplacements={messagesStore.appliedReplacements}
									/>
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={1} keepMounted>
									<MessagesView />
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={2}>
									<ReplayView />
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={3} keepMounted>
									<DictionaryView />
								</TabPanel>
							</Box>
						</SplitViewPane>
					</SplitView>
					<div className='app__buttons'>
						{currentTab === 2 ? (
							<>
								{replayStore.isReplaying ? (
									<Button
										variant='contained'
										endIcon={<CircularProgress color='inherit' size={14} />}>
										Replaying
									</Button>
								) : (
									<Button
										variant='contained'
										endIcon={<Replay />}
										onClick={replayStore.startReplay}
										disabled={replayStore.replayList.length === 0}>
										Start replay
									</Button>
								)}
							</>
						) : (
							<Button
								variant='contained'
								endIcon={
									messagesStore.isSending ? (
										<CircularProgress color='inherit' size={14} />
									) : replayStore.editReplayItemMode ? (
										<Check />
									) : (
										<Send />
									)
								}
								onClick={sendMessage}
								disabled={
									!editorStore.currentOptionsStore.allOptionsSelected || !editorStore.isCodeValid
								}>
								Send Message
							</Button>
						)}
					</div>
				</div>
			</div>
		</MessageWorkerProvider>
	);
};

export default hot(observer(App));
