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
import { Tab, Tabs, Box } from '@mui/material';
import { grey } from '@mui/material/colors';
import Result from './result/Result';
import '../styles/root.scss';
import { useRootStore } from '../hooks/useRootStore';
import Control from './message-editor/Control';
import SplitView from './split-view/SplitView';
import TabPanel from './util/TabPanel';
import useMessagesStore from '../hooks/useMessagesStore';
import ReplayView from './replay/ReplayView';
import MessageWorker from '../stores/MessageWorker';
import MessageWorkerProvider from '../contexts/messageWorkerContext';
import DictionaryView from './dictionary/DictionaryView';
import MessageEditorView from './message-editor/MessageEditorView';
import MessagesView from './messages/MessagesView';

const App = () => {
	const store = useRootStore();
	const [messageWorker] = React.useState(() => new MessageWorker());
	const messagesStore = useMessagesStore();
	const [currentTab, setCurrentTab] = React.useState(0);
	const [showReplacementsConfig, toggleReplacementsConfig] = React.useState(false);

	React.useEffect(() => messageWorker.dispose, []);

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
			<Box
				height='100%'
				bgcolor={grey[200]}
				px={3}
				py={2}
				display='grid'
				gridTemplateRows='auto 1fr'
				overflow='hidden'>
				<Control showConfig={showReplacementsConfig} toggleConfig={toggleReplacementsConfig} />
				<Box overflow='hidden' borderRadius={1}>
					<SplitView vertical defaultPanelArea={60}>
						<SplitView splitterStepPercents={2}>
							<MessageEditorView toggleReplacementsConfig={toggleReplacementsConfig} />
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
								<TabPanel currentTab={currentTab} tabIndex={1}>
									<ReplayView />
								</TabPanel>
								<TabPanel currentTab={currentTab} tabIndex={2} keepMounted>
									<DictionaryView />
								</TabPanel>
							</Box>
						</SplitView>
						<MessagesView />
					</SplitView>
				</Box>
			</Box>
		</MessageWorkerProvider>
	);
};

export default hot(observer(App));
