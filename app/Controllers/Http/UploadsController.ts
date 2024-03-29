import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Redis from '@ioc:Adonis/Addons/Redis'
import fs, { promises as fsPromises } from 'fs'
import Env from '@ioc:Adonis/Core/Env'
import CommentUploadPayloadValidator from 'App/Validators/CommentUploadPayloadValidator'
import { CommentUploadPayload } from '../../../types'
import { fetchDstorUploadStatus, fetchDstorUploadToken, uploadFileToDstor } from '../../../util'
import FormData from 'form-data'
import Application from '@ioc:Adonis/Core/Application'

export default class UploadsController {
  public async upload({ request, response }: HttpContextContract) {
    let body: CommentUploadPayload
    try {
      body = await request.validate(CommentUploadPayloadValidator)
      console.log('body: ', body)
    } catch (err) {
      response.badRequest(err.messages)
    }
    const ip = request.ip()

    const bytes = Buffer.byteLength(body.content, 'utf-8')

    if (bytes > parseInt(Env.get('UPLOAD_BYTES_LIMIT'))) {
      return response.status(400).send({ message: 'Comment too long' })
    }

    const convertedIp = ip.split('.').join('_')
    const redisKey = `upload-timeout-${ip}`

    const redisValue = await Redis.get(redisKey)
    if (redisValue && +redisValue > 30) {
      return response.status(400).send({ message: 'Too many posts, please wait 10 minutes' })
    }
    const unixTimestamp = +new Date()
    const tempFilenpath = `./tmp/uploads/${unixTimestamp}-${convertedIp}`
    await fsPromises.writeFile(tempFilenpath, JSON.stringify(body))
    const accessToken = await Redis.get('dstorAccessToken')
    if (!accessToken) throw new Error('No dStor access token found')
    const uploadToken = await fetchDstorUploadToken(`wishlist/comments/${body.poster}`, accessToken)

    const file = await fs.createReadStream(tempFilenpath)
    const form = new FormData()
    form.append('file', file)
    await uploadFileToDstor(form, accessToken, uploadToken, `Uploaded from ${Env.get('APP_NAME')}`)
    const hash: string = await fetchDstorUploadStatus(accessToken, uploadToken)
    console.log('hash: ', hash)
    await Redis.set(`upload-timeout-${ip}`, redisValue ? +redisValue + 1 : 1, 'ex', 60 * 10)
    return response.status(200).send({ hash })
  }

  public async uploadMedia({ request, response }: HttpContextContract) {
    const mediaFile = request.file('file')
    const { uploader } = request.body()
    if (!mediaFile || !uploader)
      return response.status(400).json({ error: 'Missing required params' })
    const ip = request.ip()
    const convertedIp = ip.split('.').join('_')
    const unixTimestamp = +new Date()
    const tempFilename = `${unixTimestamp}-${convertedIp}-${mediaFile.clientName}`

    const redisKey = `upload-media-timeout-${ip}`

    const redisValue = await Redis.get(redisKey)
    if (redisValue && +redisValue > 30) {
      return response.status(400).send({ message: 'Too many uploads, please wait 10 minutes' })
    }

    await mediaFile.move(Application.tmpPath('uploads'), {
      name: `${unixTimestamp}-${convertedIp}-${mediaFile.clientName}`,
    })
    const accessToken = await Redis.get('dstorAccessToken')
    if (!accessToken) throw new Error('No dStor access token found')
    const uploadToken = await fetchDstorUploadToken(`wishlist/media/${uploader}`, accessToken)

    const file = await fs.createReadStream(`./tmp/uploads/${tempFilename}`)
    const form = new FormData()
    form.append('file', file)
    await Redis.set(`upload-timeout-${ip}`, redisValue ? +redisValue + 1 : 1, 'ex', 60 * 10)

    await uploadFileToDstor(form, accessToken, uploadToken, `Uploaded from ${Env.get('APP_NAME')}`)
    const hash: string = await fetchDstorUploadStatus(accessToken, uploadToken)
    console.log('hash: ', hash)
    return response.status(200).send({ hash, filename: tempFilename })
  }
}
