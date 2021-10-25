import { action, flow, makeObservable, observable, reaction } from 'mobx';
import { JSONSchema7 } from 'json-schema';
import { ParsedMessage } from '../../models/Message';
import api from '../../api';
import localStorageWorker from '../../helpers/localStorageWorker';

export type ParsedMessageOptions = {
	session: string;
	dictionary: string;
	messageType: string;
};

export default class ParsedMessageOptionsStore {
	isSessionsLoading = false;

	sessions: string[] = [];

	selectedSession: string | null = null;

	isDictionariesLoading = false;

	dictionaries: string[] = [];

	selectedDictionary: string | null = null;

	isMessageTypesLoading = false;

	messageTypes: string[] = [];

	selectedMessageType: string | null = null;

	isSchemaLoading = false;

	schema: JSONSchema7 | null = null;

	constructor() {
		makeObservable(this, {
			isSessionsLoading: observable,
			sessions: observable,
			selectedSession: observable,
			isDictionariesLoading: observable,
			dictionaries: observable,
			selectedDictionary: observable,
			isMessageTypesLoading: observable,
			messageTypes: observable,
			selectedMessageType: observable,
			isSchemaLoading: observable,
			schema: observable,
			selectSession: action,
			selectDictionary: action,
			selectMessageType: action,
		});

		reaction(
			() => this.selectedSession,
			session => {
				if (session) {
					localStorageWorker.setSelectedSessionId(session);
				}
			},
		);

		reaction(
			() => this.selectedDictionary,
			dictionary => {
				if (dictionary) {
					this.resetMessageTypes();
					this.resetSchema();
					this.fetchMessageTypes(dictionary);
					localStorageWorker.setSelectedDictionaryName(dictionary);
				}
			},
		);

		reaction(
			() => this.selectedMessageType,
			messageType => {
				if (messageType && this.selectedDictionary) {
					this.resetSchema();
					this.fetchSchema(messageType, this.selectedDictionary);
					localStorageWorker.setSelectedMessageType(messageType);
				}
			},
		);
	}

	private resetMessageTypes = () => {
		this.messageTypes = [];
		this.selectedMessageType = null;
	};

	private resetSchema = () => {
		this.schema = null;
	};

	selectSession = (session: string) => {
		this.selectedSession = session;
	};

	selectDictionary = (dictionaryName: string) => {
		this.selectedDictionary = dictionaryName;
	};

	selectMessageType = (messageType: string) => {
		this.selectedMessageType = messageType;
	};

	fetchSessions = flow(function* (this: ParsedMessageOptionsStore) {
		this.isSessionsLoading = true;

		try {
			this.sessions = yield api.getSessions();
			this.sessions.sort();
		} catch (error) {
			console.error('Error occurred while fetching sessions');
		} finally {
			this.isSessionsLoading = false;
		}
	});

	fetchDictionaries = flow(function* (this: ParsedMessageOptionsStore) {
		this.isDictionariesLoading = true;

		try {
			this.dictionaries = yield api.getDictionaryList();
			this.dictionaries.sort();
		} catch (error) {
			console.error('Error occurred while fetching dictionaries');
		} finally {
			this.isDictionariesLoading = false;
		}
	});

	fetchMessageTypes = flow(function* (this: ParsedMessageOptionsStore, dictionaryName: string) {
		this.isMessageTypesLoading = true;

		try {
			this.messageTypes = yield api.getDictionary(dictionaryName);
			this.messageTypes.sort();
		} catch (error) {
			console.error('Error occurred while fetching dictionary');
		}
		this.isMessageTypesLoading = false;
	});

	fetchSchema = flow(function* (this: ParsedMessageOptionsStore, messageType: string, dictionaryName: string) {
		this.isSchemaLoading = true;

		try {
			const message: ParsedMessage | null = yield api.getMessage(messageType, dictionaryName);
			this.schema = message ? (message[Object.keys(message)[0]] as JSONSchema7) : null;
		} catch (error) {
			console.error('Error occurred while fetching message');
		}
		this.isSchemaLoading = false;
	});

	get allOptionsSelected() {
		return !!(this.selectedSession && this.selectedDictionary && this.selectedMessageType);
	}

	get selectedOptions(): ParsedMessageOptions | null {
		if (!this.allOptionsSelected) return null;

		return {
			session: this.selectedSession as string,
			dictionary: this.selectedDictionary as string,
			messageType: this.selectedMessageType as string,
		};
	}

	init = flow(function* (this: ParsedMessageOptionsStore) {
		const savedSession = localStorageWorker.getSelectedSessionId();
		const savedDictionaryName = localStorageWorker.getSelectedDictionaryName();
		const savedMessageType = localStorageWorker.getSelectedMessageType();

		yield Promise.all([this.fetchSessions(), this.fetchDictionaries()]);

		if (savedSession) {
			this.selectSession(savedSession);
		}

		if (savedDictionaryName) {
			this.selectDictionary(savedDictionaryName);
		}

		if (savedSession && savedDictionaryName) {
			yield this.fetchMessageTypes(savedDictionaryName);
		}

		if (savedMessageType) {
			this.selectMessageType(savedMessageType);
		}
	});
}
