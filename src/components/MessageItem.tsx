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

import { InputAdornment, TextField } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { MessageItemProps } from './DraggableMessageItem';
import MessageCardControls from './MessageControls';
import MessageEntity from './MessageEntity';

const MessageItem = observer(({ index, message }: MessageItemProps) => {
	const { currentHistoryStore } = useStore();
	const [delay, setDelayValue] = useState(message.delay.toString());

	return (
		<div
			className={
				currentHistoryStore.editedMessageId === message.id
					? 'message-list__message-card_edited'
					: 'message-list__message-card'
			}>
			<div
				onClick={() => {
					const selection = window.getSelection();
					if (selection && selection?.toString().length === 0) {
						currentHistoryStore.selectMessage(message.id || '');
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
						currentHistoryStore.setEditedMessageSendDelay(Number(e.target.value) || 0);
						setDelayValue(currentHistoryStore.editedMessageSendDelay.toString());
					}}
				/>
			</div>
			<MessageCardControls id={message.id} message={message} index={index} />
		</div>
	);
});

export default MessageItem;
