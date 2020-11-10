{
    type: messagePattern,
    name: name
    content: { key: (simple | array | map) }
}

{
    type: simple,
    name: name,
    required: boolean,
    valueType: number | string | boolean,
    defaultValue: ""
    value: ""
}

{
    type: array,
    name: name,
    required: boolean,
    value: [ (simple | array | map) ]
}

{
    type: map,
    name: name,
    required: boolean,
    value: { key: (simple | array | map) }
}