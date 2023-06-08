import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Database from '@ioc:Adonis/Lucid/Database'

export default class extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await Database.table('users').insert({
      account_name: 'captaincrypt',
    })
  }
}
