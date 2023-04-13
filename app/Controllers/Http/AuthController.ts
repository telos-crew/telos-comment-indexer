import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { AuthServer } from '../../../util/auth'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class AuthController {
  public async getNonce({ request, response }: HttpContextContract) {
    const { account_name } = request.qs()
    const authServer = new AuthServer()
    const nonce = await authServer.generateNonce()
    await Redis.set(`nonce:${account_name}`, nonce, 'ex', 60)
    return response.json({ nonce })
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
