import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import Redis from '@ioc:Adonis/Addons/Redis'

export default class CommentsController {
  public async upload({ request, response }: HttpContextContract) {
    const ip = request.ip()
    const convertedIp = ip.split('.').join('_')
    const redisKey = `upload-timeout-${ip}`

    const redisValue = await Redis.get(redisKey)
		console.log('redisValue: ', redisValue)
    if (redisValue && +redisValue > 3) {
      return response.status(400).send({ message: 'Too many posts, please wait 10 minutes' })
    }

    const unixTimestamp = +new Date()

    const file = request.file('file', {
      size: '10kb',
      extnames: ['json'],
    })

    if (!file || !file.isValid) {
      return response.status(400).send('Invalid file, 10kb limit and .json only')
    }
    if (file) {
      await file.move(Application.tmpPath(`uploads`), {
        name: `${unixTimestamp}-${convertedIp}.json`,
      })
    }

    await Redis.set(`upload-timeout-${ip}`, redisValue ? +redisValue + 1 : 1, 'ex', 60 * 10)
  }
}
