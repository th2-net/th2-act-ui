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
import MessageEditor, { MessageEditorMethods } from './message-editor/MessageEditor';
import { useRootStore } from '../hooks/useRootStore';
import Control from './message-editor/Control';
import { EmbeddedEditor } from './dictionary-view/EmbeddedEditor';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import TabPanel from './util/TabPanel';
import useMessagesStore from '../hooks/useMessagesStore';
import useEditorStore from '../hooks/useEditorStore';
import useReplayStore from '../hooks/useReplayStore';
import ReplayView from './replay/ReplayView';
import MessageWorker from '../stores/MessageWorker';
import MessageWorkerProvider from '../contexts/messageWorkerContext';
import HistoryView from './history/HistoryView';

const App = () => {
	const store = useRootStore();
	const [messageWorker] = React.useState(() => new MessageWorker());
	const messagesStore = useMessagesStore();
	const editorStore = useEditorStore();
	const replayStore = useReplayStore();
	const { replayList, resetResults } = replayStore;
	const [currentTab, setCurrentTab] = React.useState(0);
	const [panelArea, setPanelArea] = React.useState(50);
	const [schema, setSchema] = React.useState<string | null>(null);
	const [isCodeValid, setIsCodeValid] = React.useState(false);
	const [isReplaying, setIsReplaying] = React.useState(false);
	const [showReplacementsConfig, toggleReplacementsConfig] = React.useState(false);

	const startReplay = () => {
		if (replayList[0]) {
			resetResults();
			setIsReplaying(true);
			replayMessageRecursive(0);
		}
	};

	const replayMessageRecursive = (index: number) => {
		setTimeout(() => {
			replayStore.replay(replayList[index].id).then(() => {
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

	useEffect(() => {
		store.init();
	}, [store]);

	React.useEffect(() => {
		if (store.schemaType === 'act' && (currentTab === 1 || currentTab === 3)) {
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
								setIsValid={setIsCodeValid}
								messageSchema={editorStore.currentOptionsStore.schema}
								openReplacementsConfig={() => toggleReplacementsConfig(true)}
								ref={messageEditorRef}
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
									<Tab
										label='History'
										className='app__tab'
										disabled={store.schemaType !== 'parsedMessage'}
									/>
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
									<HistoryView />
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={2}>
									<ReplayView />
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={3} keepMounted>
									<EmbeddedEditor
										schema={schema}
										object={store.editorStore.options.parsedMessage.selectedDictionary}
									/>
								</TabPanel>
							</Box>
						</SplitViewPane>
					</SplitView>
					<div className='app__buttons'>
						{currentTab === 2 ? (
							<>
								{isReplaying ? (
									<Button
										variant='contained'
										endIcon={<CircularProgress color='inherit' size={14} />}>
										Replaying
									</Button>
								) : (
									<Button variant='contained' endIcon={<Replay />} onClick={() => startReplay()}>
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
								disabled={!editorStore.currentOptionsStore.allOptionsSelected || !isCodeValid}>
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
