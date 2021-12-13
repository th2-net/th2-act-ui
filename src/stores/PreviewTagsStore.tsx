/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import { action, makeObservable, observable, reaction, toJS } from 'mobx';
import cloneDeep from 'lodash.clonedeep';
import localStorageWorker from '../helpers/localStorageWorker';

export interface PreviewTagsConfig {
	id: string;
	type: string;
	subType: string;
	paths: string[];
}

export const isPreviewTagsConfig = (object: unknown): object is PreviewTagsConfig =>
	typeof object === 'object' &&
	object !== null &&
	typeof (object as PreviewTagsConfig).type === 'string' &&
	typeof (object as PreviewTagsConfig).subType === 'string' &&
	Array.isArray((object as PreviewTagsConfig).paths) &&
	(object as PreviewTagsConfig).paths.every(path => typeof path === 'string');

export default class PreviewTagsStore {
	originalConfig: PreviewTagsConfig[] = [];

	modifiedConfig: PreviewTagsConfig[] = [];

	constructor() {
		this.originalConfig = localStorageWorker.getPreviewTagsConfig();
		this.modifiedConfig = localStorageWorker.getPreviewTagsConfig();

		makeObservable(this, {
			originalConfig: observable,
			modifiedConfig: observable,
			addConfig: action,
			changeConfig: action,
			removeConfig: action,
			saveChanges: action,
			cancelChanges: action,
		});

		reaction(
			() => this.originalConfig,
			config => localStorageWorker.setPreviewTagsConfig(config),
		);
	}

	addConfig = (config: PreviewTagsConfig) => {
		this.modifiedConfig = [...this.modifiedConfig, config];
	};

	changeConfig = (configIndex: number, newConfig: Partial<PreviewTagsConfig>) => {
		this.modifiedConfig = this.modifiedConfig.map((config, index) =>
			index === configIndex ? { ...config, ...newConfig } : config,
		);
	};

	removeConfig = (configIndex: number) => {
		this.modifiedConfig = this.modifiedConfig.filter((_, index) => index !== configIndex);
	};

	saveChanges = () => {
		this.originalConfig = cloneDeep(toJS(this.modifiedConfig));
	};

	cancelChanges = () => {
		this.modifiedConfig = cloneDeep(toJS(this.originalConfig));
	};
}
