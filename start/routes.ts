/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('/comment/:content_hash', 'CommentsController.getCommentByHash')
Route.get('/item/comments', 'CommentsController.getItemComments')
Route.post('/item/comment', 'CommentsController.saveItemComment')

Route.post('/upload', 'UploadsController.upload')
Route.post('/upload/media', 'UploadsController.uploadMedia')

Route.get('/auth/nonce', 'AuthController.getNonce')
Route.post('/auth/nonce', 'AuthController.validateNonce')
Route.get('/auth/test', 'AuthController.test')
