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

import { JSONSchema4 } from 'json-schema';
import { action, flow, makeObservable, observable, reaction } from 'mobx';
import Service, { Method } from '../../models/Service';
import api from '../../api';
import localStorageWorker from '../../helpers/localStorageWorker';

export type ActMessageOptions = {
	actBox: string;
	fullServiceName: string;
	methodName: string;
};

export default class ActOptionsStore {
	isActsLoading = false;

	acts: string[] = [];

	selectedAct: string | null = null;

	isServicesLoading = false;

	services: string[] = [];

	selectedService: string | null = null;

	isServiceDetailsLoading = false;

	serviceDetails: Service | null = null;

	selectedMethod: Method | null = null;

	isSchemaLoading = false;

	schema: JSONSchema4 | null = null;

	constructor() {
		makeObservable(this, {
			isActsLoading: observable,
			acts: observable,
			selectedAct: observable,
			isServicesLoading: observable,
			services: observable,
			selectedService: observable,
			isServiceDetailsLoading: observable,
			serviceDetails: observable,
			selectedMethod: observable,
			isSchemaLoading: observable,
			schema: observable,
			selectAct: action,
			selectService: action,
			selectMethod: action,
		});

		this.selectedAct = localStorageWorker.getSelectedActBox();
		this.selectedService = localStorageWorker.getSelectedService();
		this.selectedMethod = localStorageWorker.getSelectedMethod();

		reaction(
			() => this.selectedAct,
			act => {
				if (act) {
					this.resetServices();
					this.resetServiceDetails();
					this.resetSchema();
					this.fetchServices(act);
					localStorageWorker.setSelectedActBox(act);
				}
			},
		);

		reaction(
			() => this.selectedService,
			service => {
				if (service) {
					this.resetServiceDetails();
					this.resetSchema();
					this.fetchServiceDetails(service);
					localStorageWorker.setSelectedService(service);
				}
			},
		);

		reaction(
			() => this.selectedMethod,
			method => {
				if (method && this.selectedService) {
					this.resetSchema();
					this.fetchSchema(this.selectedService, method);
					localStorageWorker.setSelectedMethod(method);
				}
			},
		);
	}

	private resetServices = () => {
		this.services = [];
		this.selectedService = null;
	};

	private resetServiceDetails = () => {
		this.serviceDetails = null;
		this.selectedMethod = null;
	};

	private resetSchema = () => {
		this.schema = null;
	};

	selectAct = (act: string) => {
		this.selectedAct = act;
	};

	selectService = (serviceName: string) => {
		this.selectedService = serviceName;
	};

	selectMethod = (methodName: string) => {
		const method = this.serviceDetails?.methods.find(methodsItem => methodsItem.methodName === methodName);

		this.selectedMethod = method ?? null;
	};

	fetchActs = flow(function* (this: ActOptionsStore) {
		this.isActsLoading = true;
		this.acts = [];

		try {
			this.acts = yield api.getActsList();
			this.acts.sort();
		} catch (error) {
			console.error('Error occurred while fetching acts');
		} finally {
			this.isActsLoading = false;
		}
	});

	fetchServices = flow(function* (this: ActOptionsStore, act: string) {
		this.isServicesLoading = true;

		try {
			this.services = yield api.getServices(act);
			this.services.sort();
		} catch (error) {
			console.error('Error occurred while fetching services');
		} finally {
			this.isServicesLoading = false;
		}
	});

	fetchServiceDetails = flow(function* (this: ActOptionsStore, serviceName: string) {
		this.isServiceDetailsLoading = true;

		try {
			const serviceDetails = yield api.getServiceDetails(serviceName);
			if (!serviceDetails) return;

			this.serviceDetails = serviceDetails;
			this.serviceDetails?.methods.sort((a, b) => a.methodName.localeCompare(b.methodName));
		} catch (error) {
			console.error('Error occurred while fetching service details');
		} finally {
			this.isServiceDetailsLoading = false;
		}
	});

	fetchSchema = flow(function* (this: ActOptionsStore, serviceName: string, method: Method) {
		this.isSchemaLoading = true;

		try {
			const schema = yield api.getActSchema(serviceName, method.methodName);
			if (!schema) return;

			this.schema = schema[method.inputType] as unknown as JSONSchema4;
		} catch (error) {
			console.error('Error occurred while fetching act schema');
		} finally {
			this.isSchemaLoading = false;
		}
	});

	get allOptionsSelected() {
		return !!(this.selectedAct && this.selectedService && this.selectedMethod);
	}

	get selectedOptions(): ActMessageOptions | null {
		if (!this.allOptionsSelected) return null;

		return {
			actBox: this.selectedAct as string,
			fullServiceName: this.selectedService as string,
			methodName: this.selectedMethod?.methodName as string,
		};
	}

	init = flow(function* (this: ActOptionsStore) {
		const savedAct = localStorageWorker.getSelectedActBox();
		const savedService = localStorageWorker.getSelectedService();
		const savedMethod = localStorageWorker.getSelectedMethod();

		yield this.fetchActs();

		if (savedAct) {
			this.selectAct(savedAct);
		} else return;

		yield this.fetchServices(savedAct);

		if (savedService) {
			this.selectService(savedService);
		} else return;

		yield this.fetchServiceDetails(savedService);

		if (savedMethod) {
			this.selectMethod(savedMethod.methodName);
		}
	});
}
