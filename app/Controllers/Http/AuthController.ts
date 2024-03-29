import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
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

  public async validateNonce({ auth, request, response, session }: HttpContextContract) {
    const { account_name, serializedTransaction, signatures } = request.body()
    const user = await User.query().where({ account_name }).firstOrFail()
    console.log('validateNonce request.body()', request.body())
    // const nonce = await Redis.get(`nonce:${account_name}`)
    try {
      // start custom validation
      // const authServer = new AuthServer()
      // const isValid = await authServer.verifyNonce({
      //   account_name,
      //   serializedTransaction,
      //   signatures,
      //   nonce,
      // })
      // if (!isValid) return response.status(400).json({ error: 'Invalid nonce' })
      // end custom validation
      const loginValue = await auth.use('web').login(user, true)
      console.log('loginValue: ', loginValue)
      session.put('account_name', account_name)
      console.log('session.get(account_name)', session.get('account_name'))
      return response.json({ rememberMeToken: loginValue['$attributes'].rememberMeToken })
    } catch (err) {
      return response.status(400).json({ error: err.message })
    }
  }

  public async test({ auth, request, response, session }: HttpContextContract) {
    await auth.use('web').authenticate()
    console.log(auth.use('web').user!)
    console.log('auth', auth)
    console.log('session', session)
    const cookie = request.cookie('adonis-session')
    console.log('cookie', cookie)
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
