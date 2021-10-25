import { flow, makeObservable } from 'mobx';
import { nanoid } from 'nanoid';
import api from '../../api';
import MessagesStore from './MessagesStore';
import ParsedMessageReplayStore from '../history/ParsedMessageReplayStore';
import { ParsedMessageOptions } from '../options/ParsedMessageOptionsStore';
import RootStore from '../RootStore';

export default class ParsedMessagesStore extends MessagesStore<ParsedMessageOptions> {
	historyStore = new ParsedMessageReplayStore(this.rootStore);

	constructor(rootStore: RootStore) {
		super(rootStore);

		makeObservable(this, {
			sendMessage: flow,
		});
	}

	sendMessage = flow(function* (this: ParsedMessagesStore, message: object) {
		const options = this.rootStore.editorStore.options.parsedMessage.selectedOptions;
		if (!options) return;

		this.isSending = true;

		try {
			this.messageSendingResponse = yield api.sendMessage({
				...options,
				message,
			});

			this.historyStore.addMessage({
				id: nanoid(),
				createdAt: +new Date(),
				...options,
				message: JSON.stringify(message, null, 4),
				delay: 0,
				status: 'ready',
			});
		} catch (error) {
			console.error('Error occurred while calling method');
		} finally {
			this.isSending = false;
		}
	});
}
