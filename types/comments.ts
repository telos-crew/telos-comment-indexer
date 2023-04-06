export type CommentUploadPayload = {
  parent_hash?: string
  content: string
  table: string
  contract: string
  scope: string
  primary_key?: string
  poster: string
}
