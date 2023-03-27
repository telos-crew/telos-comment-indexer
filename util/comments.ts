import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
import { HyperionAction } from 'types'

const DSTOR_IPFS_BASE_URL = Env.get('DSTOR_IPFS_BASE_URL')

export const updateCommentAction = async (action: HyperionAction, Database: any) => {
  const {
    act: {
      data: { poster, post_id, content_hash },
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
    }
    const { data } = await axios.get(`${DSTOR_IPFS_BASE_URL}/${content_hash}`)
  } catch (err) {
    console.error(err)
  }
}
