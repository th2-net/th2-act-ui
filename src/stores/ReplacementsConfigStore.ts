/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { action, makeObservable, observable } from 'mobx';
import { ReplacementConfig } from '../models/Message';

export default class ReplacementsConfigStore {
	replacementsConfig: ReplacementConfig[] = [];

	constructor() {
		makeObservable(this, {
			replacementsConfig: observable,
			importConfig: action,
			changeConfig: action,
			addConfig: action,
			deleteConfig: action,
		});
	}

	importConfig = (config: ReplacementConfig[]) => {
		this.replacementsConfig = config;
	};

	changeConfig = (configIndex: number, config: Partial<ReplacementConfig>) => {
		this.replacementsConfig = this.replacementsConfig.map((srcConfig, index) =>
			index === configIndex ? { ...srcConfig, ...config } : srcConfig,
		);
	};

	addConfig = (config: ReplacementConfig) => {
		this.replacementsConfig = [...this.replacementsConfig, config];
	};

	deleteConfig = (configIndex: number) => {
		this.replacementsConfig = this.replacementsConfig.filter((_, index) => index !== configIndex);
	};
}
