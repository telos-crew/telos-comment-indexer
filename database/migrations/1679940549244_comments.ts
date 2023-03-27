import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('post_id').notNullable()
      table.string('parent_id')
      table.integer('level')
      table.text('content', 'longtext')
      table.string('contract').notNullable()
      table.string('scope').notNullable()
      table.string('primary_key')
      table.string('poster').notNullable()
      table.string('content_hash').notNullable()
      table.string('account_name').notNullable()
      table.string('transaction_id').notNullable()
      table.string('block_num').notNullable()
      table.boolean('is_deleted').defaultTo(false)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
