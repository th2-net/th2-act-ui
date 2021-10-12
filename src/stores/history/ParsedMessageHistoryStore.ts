import { action, makeObservable, reaction } from 'mobx';
import MessageHistoryStore from './MessageHistoryStore';
import { ParsedMessageItem } from '../../models/Message';
import Store from '../Store';
import { getFromLocalStorage, setInLocalStorage } from '../../helpers/localStorageManager';
import api from '../../api';

export default class ParsedMessageHistoryStore extends MessageHistoryStore<ParsedMessageItem> {
	constructor(store: Store) {
		super(store);

		makeObservable(this, {
			selectMessage: action,
			replayMessage: action,
		});

		this.history = JSON.parse(getFromLocalStorage('parsedMessagesHistory') || '[]');
		this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');
		this.editedMessageId = getFromLocalStorage('editedParsedMessageId') || '';

		reaction(
			() => this.history,
			parsedMessageHistory => {
				setInLocalStorage('parsedMessagesHistory', JSON.stringify(parsedMessageHistory));
			},
		);

		reaction(
			() => this.editedMessageId,
			editedMessageId => setInLocalStorage('editedParsedMessageId', editedMessageId),
		);

		reaction(
			() => this.editMessageMode,
			editMessageMode => setInLocalStorage('editParsedMessageMode', editMessageMode.toString()),
		);
	}

	buildEditedMessage = (id: string): ParsedMessageItem | undefined => {
		if (
			this.store.selectedSession &&
			this.store.selectedDictionaryName &&
			this.store.selectedMessageType
		) {
			return {
				id,
				sessionId: this.store.selectedSession,
				dictionary: this.store.selectedDictionaryName,
				messageType: this.store.selectedMessageType,
				message: this.editorCode,
				delay: this.editedMessageSendDelay,
				indicator: 'indicator_edited',
			};
		}
		return undefined;
	};

	selectMessage = (id: string) => {
		const selectedMessage = this.history.find(message => message.id === id) as ParsedMessageItem;

		this.setEditorProperties(
			selectedMessage.sessionId,
			selectedMessage.dictionary,
			selectedMessage.messageType,
			selectedMessage.message as string,
		);

		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
	};

	setEditorProperties = (
		sessionOrActBox: string | null,
		dictionaryOrService: string | null,
		messageTypeOrMethod: string | null,
		editorCode: string,
	) => {
		this.store.selectedSession = sessionOrActBox;
		this.store.selectedDictionaryName = dictionaryOrService;
		this.store.selectedMessageType = messageTypeOrMethod;

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	replayMessage = async (id: string): Promise<void> => {
		const message = this.history.find(msg => msg.id === id);

		if (message) {
			try {
				const result = await api.sendMessage({
					session: message.sessionId,
					dictionary: message.dictionary,
					messageType: message.messageType,
					message: JSON.parse(message.message as string),
				});

				message.indicator = result.code === 200 ? 'indicator_successful' : 'indicator_unsuccessful';
			} catch (error) {
				// eslint-disable-next-line no-alert
				alert('Error while sending');
				message.indicator = 'indicator_unsuccessful';
			}
		}
	};
}
