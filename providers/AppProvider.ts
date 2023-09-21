import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { replenishDstorAccessToken } from '../util'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
    replenishDstorAccessToken()
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
