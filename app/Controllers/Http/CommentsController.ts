import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Redis from '@ioc:Adonis/Addons/Redis'
import { AuthServer } from '../../../util/auth'

type SaveItemCommentBody = {
  contract: string
  table: string
  scope: string
  primary_key: string
  key_type: any
}

export default class CommentsController {
  public async saveItemComment({ request, response }: HttpContextContract) {
    console.log(request.body())
    const payload = request.body().data
    // const nonce = await Redis.get(`nonce:${account_name}`)
    // console.log(nonce)
    // if (!nonce) return response.status(500).json({ error: 'Server error' })
    // const authServer = new AuthServer()
    console.log('saveItemComment about to verifyNonce')
    await Database.table('comments').insert(payload)
    // const isValidNonce = await authServer.verifyNonce({
    //   account_name,
    //   serializedTransaction,
    //   signatures,
    //   nonce,
    // })
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
