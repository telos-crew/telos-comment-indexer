import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

type SaveItemCommentBody = {
  contract: string
  table: string
  scope: string
  primary_key: string
  key_type: any
}

export default class CommentsController {
  public async saveItemComment({ auth, session, request, response }: HttpContextContract) {
    const sessionAccountName = session.get('account_name')
    const { poster: account_name } = request.body().data
    await auth.use('web').authenticate()
    if (!account_name || !sessionAccountName || account_name !== sessionAccountName) {
      return response.status(401).json({ error: 'Unauthorized' })
    }
    const payload = request.body().data
    // insert comment
    await Database.table('comments').insert({
      ...payload,
      created_at: new Date(),
      updated_at: new Date(),
    })
    if (payload.parent_id) {
      await Database.from('comments').where({ id: payload.parent_id }).increment('children', 1)
    }
    // get comment
    const comment = await Database.from('comments')
      .where({ ...payload })
      .first()
    return response.json({ comment })
  }

  public async getItemComments({ request, response }: HttpContextContract) {
    try {
      const { contract, scope, table, primary_key, parent_id = null } = request.qs()
      if (!contract || !scope || !table || !primary_key) {
        return response.status(400).json({ error: 'Missing required params' })
      }
      console.log('parent_id: ', parent_id)
      const comments = await Database.from('comments').where({
        contract,
        scope,
        table,
        primary_key,
        parent_id,
      })
      return response.json(comments)
    } catch (err) {
      return response.status(500).json({ error: err })
    }
  }

  public async getReplies({ request, response }: HttpContextContract) {
    try {
      const { comment_id } = request.params()
      if (!comment_id) return response.status(400).json({ error: 'No comment id provided' })
      const replies = await Database.from('comments')
        .where({
          parent_id: comment_id,
        })
        .orderBy('created_at', 'desc')
      return response.json(replies)
    } catch (err) {}
  }

  public async getCommentByHash({ request, response }: HttpContextContract) {
    try {
      console.log('getCommentByHash')
      const { content_hash } = request.params()
      if (!content_hash) return response.status(400).json({ error: 'No content hash provided' })
      const comment = await new Promise((resolve, reject) => {
        setTimeout(reject, 10000)
        const period = 1000
        const attemptGetFile = async () => {
          const [comment] = await Database.from('comments').where({
            content_hash,
          })
          console.log('comment: ', comment)
          if (comment) {
            resolve(comment)
          } else {
            setTimeout(attemptGetFile, period)
          }
        }
        attemptGetFile()
      })
      return response.json(comment)
    } catch (err) {
      return response.status(500).json({ error: err })
    }
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
