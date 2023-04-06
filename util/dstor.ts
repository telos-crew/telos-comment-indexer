import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export const fetchDstorAccessToken = async () => {
  let accessToken
  const expiration = new Date().getTime() / 1000 + 3600 * 24
  try {
    const headers = {
      'api-key': Env.get('DSTOR_API_KEY'),
      'x-expiration': expiration,
    }
    const {
      data: { access_token },
    } = await axios({
      url: 'https://api.dstor.cloud/v1/dev/temp-token',
      headers,
    })
    accessToken = access_token
  } catch (err: any) {
    console.log('access_token error: ', err)
    throw new Error(err && err.message)
  }
  return accessToken
}

export const fetchDstorUploadToken = async (folder_path: string, access_token: string) => {
  let uploadToken
  try {
    const {
      data: { token },
    } = await axios({
      method: 'POST',
      url: 'https://api.dstor.cloud/v1/upload/get-token/',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        chunks_number: 1,
        folder_path,
      },
    })
    uploadToken = token
  } catch (err: any) {
    console.log('upload token error: ', err)
    throw new Error(err && err.message)
  }
  return uploadToken
}

export const uploadFileToDstor = async (
  formData: any,
  accessToken: string,
  uploadToken: string,
  comment: string,
  onUploadProgress?: any
) => {
  try {
    const config = {
      type: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // "Access-Control-Allow-Origin": "*",
        'Content-Type': 'multipart/form-data',
        // "x-dstor-parent-id": 0, // root folder,
        'x-dstor-comment': comment,
        'x-dstor-upload-token': uploadToken,
      },
      onUploadProgress,
    }
    await axios.post('https://api.dstor.cloud/v1/upload/', formData, config)
  } catch (err) {
    console.log('upload error: ', err)
  }
}

export const fetchDstorUploadStatus = async (
  accessToken: string,
  uploadToken: string,
  setProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let interval = 2000
    let timeout
    setTimeout(reject, 60000)
    const checkStatus = async () => {
      try {
        const { data: statusData } = await axios('https://api.dstor.cloud/v1/upload/get-status/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-dstor-upload-token': uploadToken,
          },
        })
        interval = interval + 250
        timeout = setTimeout(checkStatus, interval)
        switch (statusData.status) {
          case 'ADDING_TO_IPFS':
            setProgress && setProgress(80)
            break
          case 'SAVING_DATA':
            setProgress && setProgress(90)
            break
          case 'DONE':
            clearTimeout(timeout)
            setProgress && setProgress(100)
            setTimeout(() => {
              const newHash = statusData.data[0].Hash
              setProgress && setProgress(0)
              return resolve(newHash)
            }, 1000)
        }
      } catch (err: any) {
        setProgress && setProgress(0)
        throw new Error(err && err.message)
      }
    }
    return checkStatus()
  })
}

export const replenishDstorAccessToken = async () => {
  const { default: Redis } = await import('@ioc:Adonis/Addons/Redis')
  const accessToken = await fetchDstorAccessToken()
  console.log('setting new access token: ', accessToken)
  await Redis.set('dstorAccessToken', accessToken, 'ex', 3600 * 24)
  setTimeout(replenishDstorAccessToken, 3600 * 24 * 1000)
}
