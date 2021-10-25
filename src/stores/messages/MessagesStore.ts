import { makeObservable, observable } from 'mobx';
import { MessageSendingResponse } from '../../models/Message';
import RootStore from '../RootStore';

export default abstract class MessagesStore<T> {
	isSending = false;

	messageSendingResponse: MessageSendingResponse | null = null;

	protected constructor(protected readonly rootStore: RootStore) {
		makeObservable(this, {
			isSending: observable,
			messageSendingResponse: observable,
		});
	}

	abstract sendMessage: (message: object) => void;
}
