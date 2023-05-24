import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import { AuthServer } from '../../../util/auth'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class AuthController {
  public async getNonce({ request, response }: HttpContextContract) {
    const { account_name } = request.qs()
    const authServer = new AuthServer()
    const nonce = await authServer.generateNonce()
    await Redis.set(`nonce:${account_name}`, nonce, 'ex', 120)
    const [user] = await Database.from('users').where({ account_name })
    console.log('user', user)
    if (!user) {
      await Database.table('users').insert({ account_name })
    }
    return response.json({ nonce })
  }

  public async validateNonce({ auth, request, response }: HttpContextContract) {
    const { account_name, serializedTransaction, signatures } = request.body()
    console.log('validateNonce request.body()', request.body())
    const user = await Database.from('users').where({ account_name }).firstOrFail()
    const nonce = await Redis.get(`nonce:${account_name}`)
    try {
      const authServer = new AuthServer()
      const isValid = await authServer.verifyNonce({
        account_name,
        serializedTransaction,
        signatures,
        nonce,
      })
      console.log('isValid', isValid)
      if (!isValid) return response.status(400).json({ error: 'Invalid nonce' })
      console.log('about to login with user', user)
      await auth.use('web').login(user, true)
    } catch (err) {
      return response.status(400).json({ error: err.message })
    }
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
