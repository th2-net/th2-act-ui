/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { nanoid } from 'nanoid';
import { action, makeObservable, observable } from 'mobx';
import { AlertColor } from '@mui/material';

export type AlertBody = {
	id: string;
	severity: AlertColor;
	message: string;
};

class AlertsStore {
	alerts: AlertBody[] = [];

	constructor() {
		makeObservable(this, { alerts: observable, alertError: action, removeAlert: action });
	}

	alertError = (message: string) => {
		this.alerts = [...this.alerts, { id: nanoid(), message, severity: 'error' }];
	};

	removeAlert = (id: string) => {
		this.alerts = this.alerts.filter(alertItem => alertItem.id !== id);
	};
}

export default new AlertsStore();
