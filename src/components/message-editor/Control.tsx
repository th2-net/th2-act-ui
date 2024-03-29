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

import { observer } from 'mobx-react-lite';
import React from 'react';
import {
	Badge,
	Box,
	CircularProgress,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	Stack,
	Tooltip,
} from '@mui/material';
import { Code } from '@mui/icons-material';
import { useRootStore } from '../../hooks/useRootStore';
import useEditorStore from '../../hooks/useEditorStore';
import ReplacementsConfigModal from '../replacements-config/ReplacementsConfigModal';
import useMessagesStore from '../../hooks/useMessagesStore';
import useReplayStore from '../../hooks/useReplayStore';

export type SchemaType = 'parsedMessage' | 'act';

type Props = {
	showConfig: boolean;
	toggleConfig: (show: boolean) => void;
};

const Control = ({ showConfig, toggleConfig }: Props) => {
	const store = useRootStore();
	const { options } = useEditorStore();
	const { replacements } = useMessagesStore();
	const { replayItemToEdit } = useReplayStore();

	const controlConfigs = [
		{
			name: 'parsedMessage',
			label: 'Send Message',
			selects: [
				{
					label: 'Session',
					id: 'session',
					options: options.parsedMessage.sessions,
					selected: options.parsedMessage.selectedSession || '',
					disabled: options.parsedMessage.isSessionsLoading,
					onChange: options.parsedMessage.selectSession,
					isLoading: options.parsedMessage.isSessionsLoading,
				},
				{
					label: 'Dictionary',
					id: 'dictionary',
					options:
						options.parsedMessage.isSessionsLoading || options.parsedMessage.isDictionariesLoading
							? []
							: options.parsedMessage.dictionaries,
					selected: options.parsedMessage.selectedDictionary || '',
					disabled: options.parsedMessage.isSessionsLoading || options.parsedMessage.isDictionariesLoading,
					onChange: options.parsedMessage.selectDictionary,
					isLoading: options.parsedMessage.isDictionariesLoading,
					onOpen: () => {
						options.parsedMessage.fetchDictionaries(options.parsedMessage.selectedSession || '');
					},
				},
				{
					label: 'Msg Type',
					id: 'msg-type',
					options: options.parsedMessage.messageTypes,
					selected: options.parsedMessage.selectedMessageType || '',
					disabled:
						options.parsedMessage.isSessionsLoading ||
						options.parsedMessage.isDictionariesLoading ||
						options.parsedMessage.isMessageTypesLoading,
					onChange: options.parsedMessage.selectMessageType,
					isLoading: options.parsedMessage.isMessageTypesLoading,
				},
			],
		},
		{
			name: 'act',
			label: 'gRPC Call',
			selects: [
				{
					label: 'Box',
					id: 'box',
					options: options.act.acts,
					selected: options.act.selectedAct || '',
					disabled: options.act.isActsLoading,
					onChange: options.act.selectAct,
					isLoading: options.act.isActsLoading,
				},
				{
					label: 'Service',
					id: 'service',
					options: options.act.services,
					selected: options.act.selectedService || '',
					disabled: options.act.isActsLoading || options.act.isServicesLoading,
					onChange: options.act.selectService,
					isLoading: options.act.isServicesLoading,
				},
				{
					label: 'Method',
					id: 'method',
					options: options.act.serviceDetails
						? options.act.serviceDetails.methods.map(method => method.methodName)
						: [],
					selected: options.act.selectedMethod?.methodName || '',
					disabled:
						options.act.isActsLoading ||
						options.act.isServicesLoading ||
						options.act.isServiceDetailsLoading,
					onChange: options.act.selectMethod,
					isLoading: options.act.isServiceDetailsLoading,
				},
			],
		},
	];

	const currentReplacements = React.useMemo(
		() => replayItemToEdit?.replacements ?? replacements,
		[replayItemToEdit, replacements],
	);

	return (
		<Box>
			<Stack direction='row' alignItems='center'>
				<RadioGroup
					row
					value={store.schemaType}
					onChange={e => store.setSchemaType(e.target.value as SchemaType)}>
					{controlConfigs.map(config => (
						<FormControlLabel
							value={config.name}
							control={<Radio color='primary' />}
							label={config.label}
							key={config.name}
						/>
					))}
				</RadioGroup>
			</Stack>
			<div key='parameters' className='app__row app__controls'>
				<Stack direction='row' gap={2} alignItems='center'>
					{
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						controlConfigs
							.find(config => config.name === store.schemaType)!
							.selects.map(props => (
								<React.Fragment key={props.id}>
									<InputLabel htmlFor={props.id}>{props.label}</InputLabel>
									<Select
										id={props.id}
										sx={{ minWidth: 100, height: 30 }}
										autoComplete='true'
										onChange={event => props.onChange(event.target.value)}
										disabled={props.disabled}
										value={props.selected}
										defaultValue={props.selected}
										onOpen={() => props.onOpen && props.onOpen()}>
										{props.isLoading && (
											<Stack direction='row' justifyContent='center' alignItems='center'>
												<CircularProgress size={14} />
											</Stack>
										)}
										{props.options.map((opt, index) => (
											<MenuItem key={index} value={opt}>
												{opt}
											</MenuItem>
										))}
									</Select>
									{props.isLoading && <CircularProgress size={14} />}
								</React.Fragment>
							))
					}
					<Tooltip title='Replacements config'>
						<IconButton onClick={() => toggleConfig(true)}>
							{currentReplacements.length ? (
								<Badge color='primary' badgeContent={currentReplacements.length} component='span'>
									<Code />
								</Badge>
							) : (
								<Code />
							)}
						</IconButton>
					</Tooltip>
					<ReplacementsConfigModal open={showConfig} onClose={() => toggleConfig(false)} />
				</Stack>
			</div>
		</Box>
	);
};

export default observer(Control);
