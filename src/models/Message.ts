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

// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import { Indicator } from '../components/MessageList';

export type Message = ParsedMessage | JSONSchema4;

export interface ParsedMessage {
	[messageType: string]: JSONSchema7;
}

export type FieldBase = {
	type: 'simple' | 'array' | 'map';
	name: string;
	required: boolean;
};

export interface MessageRequestModel {
	session: string;
	dictionary: string;
	messageType: string;
	message: object;
}

export interface MethodCallRequestModel {
	fullServiceName: string;
	methodName: string;
	message: object;
}
export interface JSONSchemaResponse {
	[methodName: string]: string;
}

export interface MessageSendingResponse {
	code: number;
	message: string;
}

export interface ParsedMessageSendingResponse {
	eventId: string;
	session: string;
	dictionary: string;
	messageType: string;
}

export interface ActSendingResponse {
	eventId: string;
	methodName: string;
	fullServiceName: string;
	responseMessage: string;
}

export interface ParsedMessageItem {
	sessionId: string;
	dictionary: string;
	messageType: string;
	message: object | string;
	delay: number;
	id: string;
	indicator: Indicator;
}

export interface ActMessageItem {
	actBox: string;
	fullServiceName: string;
	methodName: string;
	message: object | string;
	delay: number;
	id: string;
	indicator: Indicator;
}

export function isParsedMessageItem(object: unknown): object is ParsedMessageItem {
	return (
		typeof object === 'object'
		&& object !== null
		&& typeof (object as ParsedMessageItem).sessionId === 'string'
	);
}

export function isActMessageItem(object: unknown): object is ActMessageItem {
	return (
		typeof object === 'object'
		&& object !== null
		&& typeof (object as ActMessageItem).actBox === 'string'
	);
}
