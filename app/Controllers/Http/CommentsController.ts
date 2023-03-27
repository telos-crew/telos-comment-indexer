import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

export default class CommentsController {
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
