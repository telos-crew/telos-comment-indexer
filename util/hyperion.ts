import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
import { HyperionActionsResponse } from 'types/blockchain'
import { updateCommentAction } from './comments'

const ENDPOINT = Env.get('HYPERION_ENDPOINT')
const COMMENT_SMART_CONTRACT = Env.get('COMMENT_SMART_CONTRACT')

const after = {
  [COMMENT_SMART_CONTRACT]: {
    date: '2023-03-30T16:00:00.000',
    iterator: 1,
  },
}

console.log('starting from: ', after)

const handleCommentAction = async (action, Database) => {
  switch (action.act.name) {
    case 'post':
      await updateCommentAction(action, Database)
      return
    default:
      return
  }
}

const CONFIG = {
  testcomments: {
    params: {
      code: COMMENT_SMART_CONTRACT,
      sort: 'asc',
      limit: 200,
    },
    handler: handleCommentAction,
  },
}

let isProcessing = {
  testcomments: false,
}

export const query = async (contract: string, Database: any) => {
  try {
    if (isProcessing[contract] === true) return
    isProcessing[contract] === true
    const url = `${ENDPOINT}/v2/history/get_actions?after=${encodeURIComponent(
      after[contract].date
    )}&account=${contract}`
    const params = CONFIG[contract].params
    const { data }: { data: HyperionActionsResponse } = await axios.get(url, {
      params,
    })
    const { actions } = data
    actions.sort((a, b) => a.block_num - b.block_num)
    actions.forEach((actions) => {
      if (after[contract].date < actions.timestamp) {
        after[contract].date = actions.timestamp
      }
    })
    if (after[contract].iterator % 10 === 0 || after[contract].iterator < 5) {
      console.log(contract, 'after: ', after[contract].date)
    }
    after[contract].iterator++
    for (const action of actions) {
      await CONFIG[contract].handler(action, Database)
    }
  } catch (e) {
    console.log(e)
  } finally {
    isProcessing[contract] = false
  }
}
