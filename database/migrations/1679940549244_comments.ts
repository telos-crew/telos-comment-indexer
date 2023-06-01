import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // table.string('parent_hash')
      table.integer('level').defaultTo(0)
      table.string('contract').notNullable()
      table.string('scope').notNullable()
      table.string('table').notNullable()
      table.string('primary_key')
      table.string('key_type')
      table.string('account_name').notNullable()
      table.text('content', 'longtext')
      // table.string('content_hash').notNullable()
      table.integer('children').defaultTo(0)
      table.boolean('is_deleted').defaultTo(false)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: false })
      table.timestamp('updated_at', { useTz: false })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
