import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { replenishDstorAccessToken } from '../util'
// import { query } from '../util/hyperion'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
    // const { default: Database } = await import('@ioc:Adonis/Lucid/Database')
    // setInterval(() => query('testcomments', Database), 1000)
    // replenishDstorAccessToken()
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
