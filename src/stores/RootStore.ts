import { action, flow, makeObservable, observable, reaction } from 'mobx';
import EditorStore from './EditorStore';
import ActMessagesStore from './messages/ActMessagesStore';
import ParsedMessagesStore from './messages/ParsedMessagesStore';
import { SchemaType } from '../components/Control';
import localStorageWorker from '../helpers/localStorageWorker';

type MessagesStores = {
	act: ActMessagesStore;
	parsedMessage: ParsedMessagesStore;
};

export default class RootStore {
	editorStore = new EditorStore(this);

	messagesStores: MessagesStores = {
		act: new ActMessagesStore(this),
		parsedMessage: new ParsedMessagesStore(this),
	};

	schemaType: SchemaType = localStorageWorker.getSelectedSchemaType();

	constructor() {
		makeObservable(this, {
			schemaType: observable,
			setSchemaType: action,
		});

		reaction(
			() => this.schemaType,
			schemaType => localStorageWorker.setSelectedSchemaType(schemaType),
		);
	}

	setSchemaType = (schemaType: SchemaType) => {
		this.schemaType = schemaType;
	};

	get currentMessagesStore() {
		return this.messagesStores[this.schemaType];
	}

	init = flow(function* (this: RootStore) {
		yield Promise.all([this.editorStore.options.act.init(), this.editorStore.options.parsedMessage.init()]);
	});
}
