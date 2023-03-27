import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'

const ENDPOINT = Env.get('HYPERION_ENDPOINT')
const COMMENT_SMART_CONTRACT = Env.get('COMMENT_SMART_CONTRACT')

const after = {
  [COMMENT_SMART_CONTRACT]: {
    date: '2021-05-01T00:00:00.000',
    iterator: 1,
  },
}

console.log('starting from: ', after)

const handleCommentAction = async (action, Database) => {
  console.log(action)
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
    console.log('url: ', url)
    console.log('params', params)
    const { data } = await axios.get(url, {
      params,
    })
    const { actions } = data
    actions.sort((a, b) => a.block_num - b.block_num)
    // console.log(contract, 'actions', actions.length)
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
      // await updateBlockNum(actions, Database)
    }
  } catch (e) {
    console.log(e)
  } finally {
    isProcessing[contract] = false
  }
}
