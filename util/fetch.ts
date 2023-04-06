import * as dstor from './dstor'

export const stringifyUrlParams = (url: string, params: { [key: string]: any }) => {
  let newURL = new URL(url)
  for (const key in params) {
    let serializedParam
    if (typeof params[key] === 'string') {
      serializedParam = params[key]
    } else if (params[key] === null) {
      continue
    } else {
      params[key].toString()
    }
    newURL.searchParams.set(key, serializedParam)
  }
  return newURL.toString()
}

type BallotCommentData = {
  body: object
  folder_path: string
  comment: string
  onUploadProgress: (progress: number) => void
}

export const postBallotComment2 = async (data: BallotCommentData): Promise<string> => {
  const formData = new FormData()
  const blob = new Blob([JSON.stringify(data.body)], {
    type: 'application/json',
  })
  const filename = new Date().getTime()
  formData.append('file', blob, `${filename}.json`)
  const accessToken = await dstor.fetchDstorAccessToken()
  const uploadToken = await dstor.fetchDstorUploadToken(data.folder_path, accessToken)
  await dstor.uploadFileToDstor(
    formData,
    accessToken,
    uploadToken,
    data.comment,
    data.onUploadProgress
  )
  const hash: string = await dstor.fetchDstorUploadStatus(
    accessToken,
    uploadToken,
    data.onUploadProgress
  )
  return hash
}
