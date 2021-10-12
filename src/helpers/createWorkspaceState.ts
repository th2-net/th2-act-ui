const createWorkspaceState = (eventId: string) => [
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
	},
];

export default createWorkspaceState;
