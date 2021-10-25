import { flow, makeObservable } from 'mobx';
import { nanoid } from 'nanoid';
import ActReplayStore from '../history/ActReplayStore';
import api from '../../api';
import MessagesStore from './MessagesStore';
import { ActMessageOptions } from '../options/ActOptionsStore';
import RootStore from '../RootStore';

export default class ActMessagesStore extends MessagesStore<ActMessageOptions> {
	historyStore = new ActReplayStore(this.rootStore);

	constructor(rootStore: RootStore) {
		super(rootStore);

		makeObservable(this, {
			sendMessage: flow,
		});
	}

	sendMessage = flow(function* (this: ActMessagesStore, message: object) {
		const options = this.rootStore.editorStore.options.act.selectedOptions;
		if (!options) return;

		this.isSending = true;

		try {
			this.messageSendingResponse = yield api.callMethod({
				...options,
				message,
			});

			this.historyStore.addMessage({
				id: nanoid(),
				...options,
				createdAt: +new Date(),
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
