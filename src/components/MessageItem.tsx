/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { InputAdornment, TextField } from '@mui/material';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useRootStore } from '../hooks/useRootStore';
import MessageCardControls from './MessageControls';
import MessageEntity from './MessageEntity';
import useMessageHistoryStore from '../hooks/useMessageHistoryStore';
import { ActReplayItem, isActReplayItem, isParsedMessageReplayItem, ParsedMessageReplayItem } from '../models/Message';
import useEditorStore from '../hooks/useEditorStore';

type Props = {
	index: number;
	message: ActReplayItem | ParsedMessageReplayItem;
};

const MessageItem = observer(({ index, message }: Props) => {
	const store = useRootStore();
	const editorStore = useEditorStore();
	const historyStore = useMessageHistoryStore();
	const [delay, setDelayValue] = useState(message.delay.toString());

	const selectMessage = () => {
		historyStore.setEditedMessageId(message.id);
		historyStore.setEditMessageMode(true);
		historyStore.setEditedMessageCode(message.message);

		if (isActReplayItem(message)) {
			store.setSchemaType('act');
			const { selectAct, selectService, selectMethod } = editorStore.options.act;

			selectAct(message.actBox);
			selectService(message.fullServiceName);
			selectMethod(message.methodName);
		} else if (isParsedMessageReplayItem(message)) {
			store.setSchemaType('parsedMessage');
			const { selectSession, selectDictionary, selectMessageType } = editorStore.options.parsedMessage;

			selectSession(message.session);
			selectDictionary(message.dictionary);
			selectMessageType(message.messageType);
		}
	};

	return (
		<div
			className={
				historyStore.editedMessageId === message.id
					? 'message-list__message-card_edited'
					: 'message-list__message-card'
			}>
			<div
				onClick={() => {
					const selection = window.getSelection();
					if (selection && selection?.toString().length === 0) {
						selectMessage();
					}
				}}>
				<MessageEntity message={message} />
				<b style={{ marginRight: '10px' }}>delay:</b>
				<TextField
					variant='standard'
					className='message-list__delay-input'
					type='number'
					InputProps={{
						endAdornment: <InputAdornment position='end'>ms</InputAdornment>,
					}}
					size='small'
					value={delay}
					placeholder='0'
					onChange={e => {
						historyStore.changeDelay(Number(e.target.value) || 0);
						setDelayValue(historyStore.editedMessageSendDelay.toString());
					}}
				/>
			</div>
			<MessageCardControls id={message.id} message={message} index={index} />
		</div>
	);
});

export default MessageItem;
