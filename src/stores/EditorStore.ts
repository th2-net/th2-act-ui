import { action, computed, makeObservable, observable } from 'mobx';
import ParsedMessageOptionsStore from './options/ParsedMessageOptionsStore';
import ActOptionsStore from './options/ActOptionsStore';
import RootStore from './RootStore';

type Options = {
	parsedMessage: ParsedMessageOptionsStore;
	act: ActOptionsStore;
};

class EditorStore {
	code = '{}';

	options: Options = {
		parsedMessage: new ParsedMessageOptionsStore(),
		act: new ActOptionsStore(),
	};

	constructor(private readonly rootStore: RootStore) {
		makeObservable(this, {
			code: observable,
			currentOptionsStore: computed,
			setCode: action,
		});
	}

	get currentOptionsStore() {
		return this.options[this.rootStore.schemaType];
	}

	setCode = (newCode: string) => {
		this.code = newCode;
	};
}

export default EditorStore;
