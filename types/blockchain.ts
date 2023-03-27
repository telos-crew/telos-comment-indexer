export type PostAction = {
  poster: string
  post_id: string
  content_hash: string
}

export type HyperionAction = {
  '@timestamp': string
  'timestamp': string
  'block_num': number
  'trx_id': string
  'act': {
    account: string
    name: string
    authorization: [
      {
        actor: string
        permission: string
      }
    ]
    data: PostAction
  }
  'notified': string[]
  'cpu_usage_us': number
  'net_usage_words': number
  'global_sequence': number
  'receiver': string
  'producer': string
  'action_ordinal': number
  'creator_action_ordinal': number
  'signatures': string[]
}

export type HyperionActionsResponse = {
  query_time_ms: number
  cached: boolean
  lib: number
  total: {
    value: number
    relation: string
  }
  actions: HyperionAction[]
}
