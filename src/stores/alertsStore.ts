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
