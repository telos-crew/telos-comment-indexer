import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { AuthServer } from '../../../util/auth'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class AuthController {
  public async getNonce({ request, response }: HttpContextContract) {
    const { account_name } = request.qs()
    const authServer = new AuthServer()
    const nonceAndExpiration = await authServer.generateNonce()
    await Redis.set(`nonce:${account_name}`, nonceAndExpiration, 'ex', 60 * 60 * 24 * 30)
    return response.json({ nonce: nonceAndExpiration })
  }

  public async validateNonce({ request, response }: HttpContextContract) {
    const { account_name, serializedTransaction, signatures } = request.body()
    const nonce = await Redis.get(`nonce:${account_name}`)
    try {
      const authServer = new AuthServer()
      const isValid = await authServer.verifyNonce({
        account_name,
        serializedTransaction,
        signatures,
        nonce,
      })
      if (!isValid) return response.status(400).json({ error: 'Invalid nonce' })
      return response.status(204)
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
