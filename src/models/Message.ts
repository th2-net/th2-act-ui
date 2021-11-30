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

export type Message = ParsedMessage | JSONSchema4;

export interface ParsedMessage {
	[messageType: string]: JSONSchema7;
}

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

export type ReplayStatus = 'ready' | 'edited' | 'fail' | 'sent';

export interface ReplacementConfig {
	destinationPath: string;
	sourcePath: string;
}

export interface AppliedReplacement extends ReplacementConfig {
	originalValue: unknown;
	newValue: unknown;
}

export interface ReplayItem {
	name?: string;
	message: string;
	delay: number;
	id: string;
	result: {
		status: ReplayStatus;
		response?: MessageSendingResponse;
		appliedReplacements?: AppliedReplacement[];
	};
	replacements: ReplacementConfig[];
}

export interface ParsedMessageReplayItem extends ReplayItem {
	type: 'parsedMessage';
	session: string;
	dictionary: string;
	messageType: string;
}

export interface ActReplayItem extends ReplayItem {
	type: 'act';
	actBox: string;
	fullServiceName: string;
	methodName: string;
}

export function isParsedMessageReplayItem(object: unknown): object is ParsedMessageReplayItem {
	return (
		typeof object === 'object' && object !== null && (object as ParsedMessageReplayItem).type === 'parsedMessage'
	);
}

export function isActReplayItem(object: unknown): object is ActReplayItem {
	return typeof object === 'object' && object !== null && (object as ActReplayItem).type === 'act';
}

export type EventMessage = {
	type: 'message';
	messageType: string;
	messageId: string;
	timestamp: {
		nano: number;
		epochSecond: number;
	};
	direction: string;
	sessionId: string;
	body: MessageBody | null;
	bodyBase64: string | null;
	jsonBody: string | null;
};

type MessageBody = {
	metadata: {
		id: {
			connectionId: {
				sessionAlias: string;
			};
			sequence: string;
		};
		timestamp: string;
		messageType: string;
	};
	fields: MessageBodyFields;
};

type MessageBodyFields = { [key: string]: MessageBodyField };

type MessageBodyField = ListValueField | MessageValueField | SimpleValueField;

type ListValueField = {
	listValue: {
		values?: Array<MessageValueField>;
	};
};

type MessageValueField = {
	messageValue: {
		fields?: { [key: string]: MessageBodyField };
	};
};

type SimpleValueField = {
	simpleValue: string;
};
