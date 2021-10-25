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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { ActReplayItem, ParsedMessageReplayItem } from '../models/Message';
import '../styles/message-list.scss';
import '../styles/indicator.scss';
import useMessageHistoryStore from '../hooks/useMessageHistoryStore';

const MessageCardControls = observer(
	(props: { id: string; message: ParsedMessageReplayItem | ActReplayItem; index: number }) => {
		const historyStore = useMessageHistoryStore();

		return (
			<div className='message-list__message-card-controls'>
				<button
					disabled={historyStore.editMessageMode}
					className='message-list__delete-message-btn'
					onClick={() => {
						historyStore.removeMessage(props.id);
					}}>
					x
				</button>
				<div>
					<button className={props.message.status} />
				</div>
			</div>
		);
	},
);

export default MessageCardControls;
