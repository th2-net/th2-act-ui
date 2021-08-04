import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';

const Messages = () => {
	const {
		parsedMessagesHistory, clearParsedMessages, sendMessage, setFromFile, indicators, editMessageMode,
		editedMessageIndex,
	} = useStore();
	const { addParsedMessage } = useStore();
	const [loadedFile, setFile] = useState<string>('');

	const fileLoader = (file: FileList | null) => {
		if (file !== null) {
			const reader = new FileReader();
			reader.readAsText(file.item(0) as Blob);
			reader.onload = () => {
				jsonMessagesFromString(reader.result);
			};
		}
	};

	const jsonMessagesFromString = (rawFromFile: string | ArrayBuffer | null) => {
		const json = JSON.parse(rawFromFile as string);
		clearParsedMessages();

		for (let i = 0; i < json.length; i++) {
			addParsedMessage(JSON.stringify(json[i]));
		}
	};

	const replay = (array: string[]) => {
		setFromFile(true);
		clearParsedMessages();
		let longestDelay = 0;
		array.forEach((item, index) => {
			if (JSON.parse(item).delay && JSON.parse(item).delay >= longestDelay) {
				longestDelay = index;
			}
		});

		for (let i = 0; i < array.length; i++) {
			if (JSON.parse(array[i]).delay) {
				// eslint-disable-next-line no-loop-func
				setTimeout(() => {
					sendMessage(array[i] as unknown as object);
					if (i === longestDelay) {
						setFromFile(false);
					}
				},
				JSON.parse(array[i]).delay);
			} else {
				sendMessage(array[i] as unknown as object);
			}
		}
	};

	return (
		<div>
			<div>
			</div>
			<div style={{ height: '430px', overflowY: 'scroll' }}>
			 <MessageList items={parsedMessagesHistory} indicators={indicators} editMessageMode={editMessageMode}
					editedMessageIndex={editedMessageIndex}/>
			</div>
			<div>
				<button className="mainButton" onClick={() => { clearParsedMessages(); }}>
                        Clear
				</button>
				<button className="mainButton" >
					<a
						href={`data:application/json;base64,${btoa(`[${parsedMessagesHistory.toString()}]`)}`} download>
                        Export</a>
				</button>
				<button className="mainButton" onClick={() => { replay(parsedMessagesHistory); }}>
                    Replay
				</button>
				<input value={loadedFile} title=' ' id='file' type="file" accept='.json' onChange={ e => {
					if (e !== null) {
						fileLoader(e?.target.files);
						setFile('');
					}
				} }/>
			</div>
		</div>
	);
};

export const Indicators = (props: {indicator: string}) => (
	<div>
		<button className={props.indicator}>{props.indicator}</button>
	</div>
);

export const MessageList = (props: {indicators: string[]; items: string[]; editMessageMode: boolean;
    editedMessageIndex: number;}) => {
	const {
		parsedMessagesHistory, clearParsedMessages, deleteIndicator, addParsedMessage,
		setEditMessageMode, setEditedMessageSendDelay, selectMessage, editMessageMode,
		indicators,
	} = useStore();

	const deleteMessage = (index: number) => {
		const newArray: string[] = [];
		const tmpIndicators: string[] = deleteIndicator(index);
		parsedMessagesHistory.forEach((item, i) => {
			if (i !== index) {
				newArray.push(item);
			}
		});
		clearParsedMessages();
		newArray.forEach((mess, i) => {
			addParsedMessage(mess, tmpIndicators[i]);
		});
	};

	const setDelay = (delay: number) => {
		setEditedMessageSendDelay(delay);
	};

	return (
		<ul>
			<li key={props.items.length + 1}>
				<div className={editMessageMode ? 'normalNewMessage' : 'hiddenNewMessage'}
					onClick={() => { setEditMessageMode(false); }}>
					{props.editMessageMode ? 'New Message' : ''}</div>
			</li>

			{props.items.map((item, index) => (
				<li key={index} style={{ marginBottom: '10px' }}>
					<div className = "messageCard">
						<div onClick={() => { selectMessage(index); }} style={{ cursor: 'pointer' }}>
							<p><b>session: </b>{JSON.parse(item).session}</p>
							<p><b>dictionary: </b>{JSON.parse(item).dictionary}</p>
							<p><b>messageType: </b>{JSON.parse(item).messageType}</p>
							<p><b>delay: </b>{JSON.parse(item).delay || 0} ms</p>
						</div>
						<div className="cardItems">
							<div>
								<button className="deleteButton" onClick={() => {
									if (editMessageMode === false) deleteMessage(index);
								}}>x</button>
							</div>
							<Indicators indicator={indicators[index]} />
							<div className={editMessageMode
                                && props.editedMessageIndex === index ? 'delayVisible' : 'delayUnvisible'}>
								<p>Delay:</p>
								<input style={{ width: '100px' }} type="number"
									onChange={e => { setDelay(e.target.value as unknown as number); }}></input>
							</div>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
};

export default observer(Messages);
