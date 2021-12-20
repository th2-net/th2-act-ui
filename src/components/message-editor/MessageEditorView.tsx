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
import { Box, Button, CircularProgress, Stack } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { Send } from '@mui/icons-material';
import MessageEditor from './MessageEditor';
import useEditorStore from '../../hooks/useEditorStore';
import useMessagesStore from '../../hooks/useMessagesStore';

type Props = {
	toggleReplacementsConfig: (show: boolean) => void;
};

const MessageEditorView = ({ toggleReplacementsConfig }: Props) => {
	const { currentOptionsStore, filledMessage, isCodeValid } = useEditorStore();
	const messagesStore = useMessagesStore();

	const handleSend = () => {
		if (filledMessage && !messagesStore.isSending) {
			messagesStore.sendMessage(filledMessage);
		}
	};

	return (
		<Box height='100%' display='grid' gridTemplateRows='1fr auto' bgcolor='white'>
			<Box overflow='hidden'>
				<MessageEditor
					messageSchema={currentOptionsStore.schema}
					openReplacementsConfig={() => toggleReplacementsConfig(true)}
				/>
			</Box>
			<Stack justifyContent='flex-end' direction='row' p={1}>
				<Button
					variant='contained'
					size='small'
					endIcon={messagesStore.isSending ? <CircularProgress size={14} color='inherit' /> : <Send />}
					onClick={handleSend}
					disabled={!isCodeValid}>
					{messagesStore.isSending ? 'Sending' : 'Send'}
				</Button>
			</Stack>
		</Box>
	);
};

export default observer(MessageEditorView);
