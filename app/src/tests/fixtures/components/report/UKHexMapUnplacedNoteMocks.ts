/** What the note under a UK hex map says when the layout has no position for some areas. */
export const UK_HEX_MAP_UNPLACED_NOTES = {
  ONE_OF_THREE_CONSTITUENCIES:
    '1 of 3 constituencies is not on the hex map, which places each constituency by its ONS code and has no position for it.',
  TWO_OF_361_LOCAL_AUTHORITIES:
    '2 of 361 local authorities are not on the hex map, which places each local authority by its ONS code and has no position for them.',
  NO_CONSTITUENCY:
    'The hex map places each constituency by its ONS code and has no position for any constituency in this result.',
  NO_LOCAL_AUTHORITY:
    'The hex map places each local authority by its ONS code and has no position for any local authority in this result.',
} as const;
