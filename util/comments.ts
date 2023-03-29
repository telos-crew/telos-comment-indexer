import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
import { HyperionAction } from 'types'

const DSTOR_IPFS_BASE_URL = Env.get('DSTOR_IPFS_BASE_URL')

export const updateCommentAction = async (action: HyperionAction, Database: any) => {
  const {
    act: {
      data: { poster, post_id, content_hash, parent_id },
    },
    timestamp,
  } = action
  try {
    const [existingComment] = await Database.from('comment_actions')
      .select('*')
      .where('post_id', post_id)
    if (!existingComment) {
      await Database.table('comment_actions').insert({
        post_id,
        content_hash,
        account_name: poster,
        created_at: timestamp,
      })
      const data = await fetchHashFile(content_hash)
      console.log('updateCommentAction data: ', data)
      let level = 0
      if (data.parent_id) {
        const [parentComment] = await Database.from('comments')
          .select('*')
          .where('post_id', data.parent_id)
        if (parentComment) {
          level = parentComment.level + 1
        }
      }
      await Database.table('comments').insert({
        ...data,
        post_id,
        level,
        poster,
        content_hash,
        transaction_id: action.trx_id,
        block_num: action.block_num,
      })
      if (data.parent_id) {
        await Database.from('comments').where('post_id', data.parent_id).increment('children', 1)
      }
    }
  } catch (err) {
    console.log(err)
  }
}

export const fetchHashFile = async (content_hash: string): Promise<object> => {
  return new Promise((resolve, reject) => {
    setTimeout(reject, 60000)
    const period = 2000
    const attemptFetchFile = async () => {
      try {
        const { data } = await axios.get(`${DSTOR_IPFS_BASE_URL}/${content_hash}`)
        return resolve(data)
      } catch (err) {
        setTimeout(attemptFetchFile, period)
      }
    }
    attemptFetchFile()
  })
}
