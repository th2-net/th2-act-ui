/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import { nanoid } from '../../node_modules/nanoid';

export type Indicator =
	| 'indicator-unvisible'
	| 'indicator-edited'
	| 'indicator-successful'
	| 'indicator-unsuccessful';

export type ParsedMessageItem = {
	sessionId: string;
	dictionary: string;
	messageType: string;
	message: object | string;
	delay: number;
};

export interface ActMessageItem {
	actBox: string;
	fullServiceName: string;
	methodName: string;
	message: object | string;
	delay: number;
}

interface EditMessageProps {
	editMessageMode: boolean;
	editedMessageIndex: number;
	indicators: Indicator[];
}

export const Messages = () => {
	const store = useStore();

	const downloadFile = (content: string, filename: string, extension: string) => {
		const file = new Blob([content], { type: extension });

		if (window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveOrOpenBlob(file);
		} else {
			const a = document.createElement('a');
			const url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}
	};

	const loadFromFile = (file: FileList | null) => {
		if (file != null) {
			const reader = new FileReader();
			reader.readAsText(file.item(0) as Blob);
			reader.onload = () => {
				jsonMessagesFromString(reader.result);
			};
		}
	};

	const jsonMessagesFromString = (rawFromFile: string | ArrayBuffer | null) => {
		try {
			const json = JSON.parse(rawFromFile as string);
			store.clearParsedMessages();

			for (let i = 0; i < json.length; i++) {
				json[i].delay = 0;
				store.addParsedMessage(json[i]);
			}
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Could not read the file. Please, try to select another file');
		}
	};

	const replaySendMessage = (array: ParsedMessageItem[] | ActMessageItem[], index: number) => {
		if (store.isReplay) {
			setTimeout(() => {
				store.sendMessage(array[index], index);
				// eslint-disable-next-line no-param-reassign
				index++;
				if (index === array.length) {
					switchReplay();
				} else {
					replaySendMessage(array, index);
				}
			}, array[index].delay);
		}
	};

	let switchValue = false;
	const switchReplay = () => {
		switchValue = !switchValue;
		if (switchValue) {
			store.setEditMessageMode(false);
			store.setReplayMode(true);
			replaySendMessage(store.getCurrentMessagesArray(), 0);
		} else {
			store.setReplayMode(false);
		}
	};

	const exportFn = () => {
		downloadFile(
			JSON.stringify(store.getCurrentMessagesArray()),
			store.selectedSchemaType === 'parsed-message' ? 'parsedMessages' : 'actMessages',
			'application/json',
		);
	};

	return (
		<div>
			<MessageEditArea
				messages={store.getCurrentMessagesArray()}
				indicators={store.indicators.slice()}
				editMessageMode={store.editMessageMode}
				editedMessageIndex={store.editedMessageIndex}
				eventsPanelArea={store.eventsPanelArea}
				object={store.selectedDictionaryName}
			/>

			<div>
				<button
					disabled={store.editMessageMode}
					className='mainButton'
					onClick={store.clearParsedMessages}>
					Clear
				</button>

				<button
					disabled={store.getCurrentMessagesArray().length === 0}
					className='mainButton'
					onClick={exportFn}>
					Export
				</button>

				<button
					disabled={store.editMessageMode}
					className='mainButton'
					onClick={switchReplay}>
					{store.isReplay ? 'Stop' : 'Replay'}
				</button>

				<input
					disabled={store.editMessageMode}
					value=''
					id='file'
					type='file'
					accept='.json'
					onChange={e => {
						if (e != null) {
							loadFromFile(e?.target.files);
						}
					}}
				/>
			</div>
		</div>
	);
};

const MessageEntity = (props: { message: ParsedMessageItem | ActMessageItem }) => {
	const store = useStore();
	if (store.selectedSchemaType === 'parsed-message') {
		return (
			<div className='messageEntity'>
				<p>
					<b>session: </b>
					{(props.message as ParsedMessageItem).sessionId}
				</p>
				<p>
					<b>dictionary: </b>
					{(props.message as ParsedMessageItem).dictionary}
				</p>
				<p>
					<b>messageType: </b>
					{(props.message as ParsedMessageItem).messageType}
				</p>
			</div>
		);
	}
	if (store.selectedSchemaType === 'act') {
		return (
			<div>
				<p>
					<b>actBox: </b>
					{(props.message as ActMessageItem).actBox}
				</p>
				<p>
					<b>fullServiceName: </b>
					{(props.message as ActMessageItem).fullServiceName}
				</p>
				<p>
					<b>methodName: </b>
					{(props.message as ActMessageItem).methodName}
				</p>
			</div>
		);
	}
	return <div></div>;
};

interface MessageItemProps extends EditMessageProps {
	index: number;
	message: ParsedMessageItem | ActMessageItem;
	selectMessage: Function;
	setDelay: Function;
	deleteMessage: Function;
}

const MessageItem = ({
	index,
	message,
	indicators,
	selectMessage,
	setDelay,
	deleteMessage,
	editMessageMode,
	editedMessageIndex,
}: MessageItemProps) => (
	<div className='messageCard'>
		<div
			onClick={() => {
				selectMessage(index);
			}}>
			<MessageEntity message={message} />
			<p>
				<b>delay: </b>
				{editMessageMode && editedMessageIndex === index ? (
					<input
						className='delayInput'
						type='number'
						defaultValue={message.delay || 0}
						onChange={e => {
							setDelay(e.target.value as unknown as number);
						}}></input>
				) : (
					message.delay
				)}
				ms
			</p>
		</div>
		<MessageCardControls
			deleteMessage={deleteMessage}
			editMessageMode={editMessageMode}
			index={index}
			indicator={indicators[index]}
		/>
	</div>
);

interface MessageCardControlsProps {
	deleteMessage: Function;
	editMessageMode: boolean;
	index: number;
	indicator: Indicator;
}

const MessageCardControls = ({
	deleteMessage,
	editMessageMode,
	index,
	indicator,
}: MessageCardControlsProps) => (
	<div className='cardItems'>
		<button
			disabled={editMessageMode}
			className='deleteButton'
			onClick={() => {
				deleteMessage(index);
			}}>
			x
		</button>
		<Indicator className={indicator} />
	</div>
);

const Indicator = (props: { className: Indicator }) => (
	<div>
		<button className={props.className.toString()}></button>
	</div>
);

interface MessageListProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
}

const MessageList = ({
	indicators,
	messages,
	editMessageMode,
	editedMessageIndex,
}: MessageListProps) => {
	const store = useStore();

	const deleteMessage = (index: number) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const newArray: any[] = [];

		const tmpIndicators: Indicator[] = store.deleteIndicator(index);
		store
			.getCurrentMessagesArray()
			.forEach((item: ParsedMessageItem | ActMessageItem, i: number) => {
				if (i !== index) {
					newArray.push(item);
				}
			});
		store.clearParsedMessages();
		newArray.forEach((mess: ParsedMessageItem | ActMessageItem, i) => {
			store.addParsedMessage(mess, tmpIndicators[i]);
		});
	};

	const setDelay = (delay: number) => {
		store.setEditedMessageSendDelay(delay);
	};

	return (
		<div className='scrolledBlock'>
			<ul>
				<li>
					{editMessageMode ? (
						<div
							className={'normalNewMessage'}
							onClick={() => {
								store.setEditMessageMode(false);
							}}>
							New Message
						</div>
					) : null}
				</li>

				{((messages as ParsedMessageItem[]) || (messages as ActMessageItem[])).map(
					(item: ParsedMessageItem | ActMessageItem, index: number) => (
						<li key={nanoid()} className='messageItem'>
							<MessageItem
								index={index}
								message={item}
								indicators={indicators}
								editMessageMode={editMessageMode}
								editedMessageIndex={editedMessageIndex}
								selectMessage={store.selectMessage}
								deleteMessage={deleteMessage}
								setDelay={setDelay}
							/>
						</li>
					),
				)}
			</ul>
		</div>
	);
};

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

interface MessageEditAreaProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
	eventsPanelArea: number;
	object: string | null;
}

const MessageEditArea = ({
	editMessageMode,
	indicators,
	messages,
	editedMessageIndex,
	eventsPanelArea,
	object,
}: MessageEditAreaProps) => {
	const store = useStore();
	return (
		<div className='messageEditArea'>
			{store.selectedSchemaType === 'parsed-message' ? (
				<SplitView panelArea={eventsPanelArea} onPanelAreaChange={store.setPanelArea}>
					<SplitViewPane>
						<MessageList
							messages={messages}
							indicators={indicators}
							editMessageMode={editMessageMode}
							editedMessageIndex={editedMessageIndex}
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
					editedMessageIndex={editedMessageIndex}
				/>
			)}
		</div>
	);
};

observer(MessageEditArea);
observer(MessageEntity);
observer(MessageList);
export default observer(Messages);
