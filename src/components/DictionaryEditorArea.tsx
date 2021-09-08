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

import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import { ParsedMessageItem, ActMessageItem } from '../models/Message';
import MessageList, { EditMessageProps } from './MessageList';

const EmbeddedEditor = (props: { schema: string; object: string }) => {
	const url = `http://localhost:3000?schema=${props.schema}&${
		props.object == null ? '' : `object=${props.object}`
	}&editorMode=dictionaryEditor&embedded=true`;
	return (
		<div className='scrolledBlock'>
			<iframe className='embeddedEditor' src={url}></iframe>
		</div>
	);
};

interface DictionaryEditAreaProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
	messageListPanelArea: number;
	object: string | null;
}

const DictionaryEditArea = ({
	editMessageMode,
	indicators,
	messages,
	editedMessageId,
	messageListPanelArea,
	object,
}: DictionaryEditAreaProps) => {
	const store = useStore();
	const [panelArea, setPanelArea] = useState(messageListPanelArea);
	return (
		<div className='messageEditArea'>
			{store.selectedSchemaType === 'parsed-message' ? (
				<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
					<SplitViewPane>
						<MessageList
							messages={messages}
							indicators={indicators}
							editMessageMode={editMessageMode}
							editedMessageId={editedMessageId}
						/>
					</SplitViewPane>

					<SplitViewPane>
						<EmbeddedEditor schema='schema-qa' object={object || ''} />
					</SplitViewPane>
				</SplitView>
			) : (
				<MessageList
					messages={messages}
					indicators={indicators}
					editMessageMode={editMessageMode}
					editedMessageId={editedMessageId}
				/>
			)}
		</div>
	);
};

export default DictionaryEditArea;
