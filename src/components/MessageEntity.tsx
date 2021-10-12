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

import React from 'react';
import {
	ActMessageItem,
	isActMessageItem,
	isParsedMessageItem,
	ParsedMessageItem,
} from '../models/Message';
import '../styles/message-list.scss';

const MessageEntity = (props: { message: ParsedMessageItem | ActMessageItem }) => {
	if (isParsedMessageItem(props.message)) {
		return (
			<div className='message-list__message-content'>
				<p>
					<b>session: </b>
					{props.message.sessionId}
					<b> dictionary: </b>
					{props.message.dictionary}
					<b> messageType: </b>
					{props.message.messageType}
				</p>
			</div>
		);
	}
	if (isActMessageItem(props.message)) {
		return (
			<div>
				<p>
					<b>actBox: </b>
					{props.message.actBox}
				</p>
				<p>
					<b>fullServiceName: </b>
					{props.message.fullServiceName}
				</p>
				<p>
					<b>methodName: </b>
					{props.message.methodName}
				</p>
			</div>
		);
	}
	return null;
};

export default MessageEntity;
