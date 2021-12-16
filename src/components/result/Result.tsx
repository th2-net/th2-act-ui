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

import React from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	CircularProgress,
	Link,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Editor from '@monaco-editor/react';
import { ExpandMore, Info } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import {
	ActSendingResponse,
	AppliedReplacement,
	MessageSendingResponse,
	ParsedMessageSendingResponse,
} from '../../models/Message';
import Value from '../util/Value';

const isDev = process.env.NODE_ENV === 'development';

type Props = {
	response?: MessageSendingResponse;
	appliedReplacements?: AppliedReplacement[];
	isSending?: boolean;
};

const Result = ({ response, appliedReplacements, isSending }: Props) => {
	if (!response) {
		return (
			<Box pt={1} pl={2}>
				<Typography sx={{ color: grey[700] }}>No data to display</Typography>
			</Box>
		);
	}

	const { code, message } = response;

	const parseContent = (): { link: string | null; content: string } => {
		try {
			const parsedContent = JSON.parse(message);
			const renderData = {
				link: getLink(parsedContent),
				content: JSON.stringify(parsedContent, null, 2),
			};
			return renderData;
		} catch (error) {
			return {
				link: null,
				content: message,
			};
		}
	};

	const getLink = (obj: unknown): string | null => {
		const rootLink = isDev
			? window.location.href.slice(0, window.location.href.lastIndexOf('/'))
			: window.location.href.substring(0, window.location.href.indexOf('/act-ui'));

		let eventId: string | null = null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let workspaceState: any = [];
		try {
			// TODO: this is temporary hot fix, needs to be fixed
			if (typeof obj === 'object' && obj !== null && 'eventId' in obj) {
				eventId = (obj as ActSendingResponse | ParsedMessageSendingResponse).eventId;
				const session = (obj as ParsedMessageSendingResponse).session;
				workspaceState =
					eventId && typeof eventId === 'string'
						? [
								{
									events: {
										filter: {
											attachedMessageId: {
												type: 'string',
												negative: false,
												values: '',
											},
											type: {
												type: 'string[]',
												values: [],
												negative: false,
											},
											name: {
												type: 'string[]',
												values: [],
												negative: false,
											},
											body: {
												type: 'string[]',
												values: [],
												negative: false,
											},
											status: {
												type: 'switcher',
												values: 'any',
											},
										},
										panelArea: 50,
										selectedEventId: eventId,
										flattenedListView: false,
									},
									layout: [50, 50],
									messages: {
										streams: session ? [session] : [],
									},
								},
						  ]
						: [];
			}

			const url = eventId ? `${rootLink}/?workspaces=${window.btoa(JSON.stringify(workspaceState))}` : null;
			return url;
		} catch (error) {
			return null;
		}
	};

	const { link, content } = parseContent();

	return isSending ? (
		<div className='result__loading'>
			<CircularProgress />
		</div>
	) : (
		<Stack overflow='auto' height='100%' className='scrollbar'>
			{code === 200 ? <Alert severity='success'>SENT</Alert> : <Alert severity='error'>FAIL</Alert>}
			{link && (
				<Link
					href={link}
					target='_blank'
					sx={{
						flexShrink: 0,
						display: 'block',
						width: '100%',
						p: 2,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}>
					Report Link
				</Link>
			)}
			{appliedReplacements && appliedReplacements.length > 0 && (
				<Accordion>
					<AccordionSummary expandIcon={<ExpandMore />}>
						<Stack spacing={1} direction='row'>
							<Info color='info' />
							<Typography>Some fields have been modified by expressions</Typography>
						</Stack>
					</AccordionSummary>
					<AccordionDetails>
						<TableContainer>
							<Table size='small'>
								<TableHead>
									<TableRow>
										<TableCell>Destination path</TableCell>
										<TableCell>Original value</TableCell>
										<TableCell>Source path</TableCell>
										<TableCell>New value</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{appliedReplacements.map(
										({ destinationPath, originalValue, sourcePath, newValue }, index) => (
											<TableRow key={`${destinationPath}-${sourcePath}-${index}`}>
												<TableCell>
													<Typography>{destinationPath}</Typography>
												</TableCell>
												<TableCell>
													<Value value={originalValue} />
												</TableCell>
												<TableCell>
													<Typography>{sourcePath}</Typography>
												</TableCell>
												<TableCell>
													<Value value={newValue} />
												</TableCell>
											</TableRow>
										),
									)}
								</TableBody>
							</Table>
						</TableContainer>
					</AccordionDetails>
				</Accordion>
			)}
			<Box flexGrow={1} mt={2}>
				<Editor
					language='json'
					value={content}
					options={{
						minimap: { enabled: false },
						readOnly: true,
						lineNumbers: 'off',
						wordWrap: 'on',
						automaticLayout: true,
					}}
					path='/result'
				/>
			</Box>
		</Stack>
	);
};

export default observer(Result);
