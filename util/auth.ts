import { Signature, PublicKey, JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { blake2b } from 'blakejs'
import { Api, JsonRpc } from 'eosjs'
import fetch from 'isomorphic-fetch'
import { randomBytes } from 'crypto'
import Env from '@ioc:Adonis/Core/Env'

interface NonceVerificationParams {
  account_name: string
  proof: {
    serializedTransaction: Uint8Array
    signatures: string[]
  }
  nonce: string
}

const bytesToHex = (bytes: Uint8Array) => {
  return Array.prototype.map
    .call(bytes, (x) => ('00' + x.toString(16)).slice(-2))
    .join('')
    .toUpperCase()
}
const getInt64StrFromUint8Array = (ba: Uint8Array) => {
  const hex = bytesToHex(ba)
  const bi = BigInt('0x' + hex)
  const max = BigInt('0x7FFFFFFFFFFFFFFF')
  return (bi % max).toString()
}

export class InvalidProofError extends Error {
  public message = 'Invalid proof body'
}

export class AuthServer {
  public endpoint: JsonRpc = new JsonRpc(Env.get('HYPERION_ENDPOINT'), { fetch })
  public api: Api
  public chainId: string = Env.get('CHAIN_ID')

  constructor() {
    const signatureProvider = new JsSignatureProvider([])
    this.api = new Api({ rpc: this.endpoint, signatureProvider })
  }

  public generateNonce(): string {
    const nonceArray = blake2b(randomBytes(32), undefined, 32)
    const nonce = getInt64StrFromUint8Array(nonceArray)
    const timestamp = Math.floor(new Date().getTime()) / 1000 + 60 * 60 * 24 * 30
    const combinedSyntax = `${nonce}:${timestamp}`
    return combinedSyntax
  }

  public async verifyNonce({
    account_name,
    serializedTransaction,
    signatures,
    nonce,
  }: NonceVerificationParams): Promise<boolean> {
    if (!nonce) return false
    // console.log('verifyNonce signatures', signatures)
    if (!signatures.length || !serializedTransaction) {
      throw new InvalidProofError()
    }
    // make buffer from transaction
    // console.log('making buffer')
    const st = new Uint8Array(
      atob(serializedTransaction)
        .split('')
        .map((char) => char.charCodeAt(0))
    )

    const buf = Buffer.from(st)

    const data = Buffer.concat([
      Buffer.from(this.chainId, 'hex'),
      buf,
      Buffer.from(new Uint8Array(32)),
    ])

    const recoveredKeys: string[] = []
    signatures.forEach((sigstr: string) => {
      const sig = Signature.fromString(sigstr)
      recoveredKeys.push(PublicKey.fromString(sig.recover(data).toString()).toLegacyString())
    })

    const claimedUser = await this.endpoint.get_account(account_name)
    if (claimedUser?.permissions) {
      const claimedUserKeys: string[] = []
      claimedUser.permissions.forEach((perm) => {
        perm.required_auth.keys.forEach((obj) => claimedUserKeys.push(obj.key))
      })

      let match = false
      recoveredKeys.forEach((rk) => {
        claimedUserKeys.forEach((ck) => {
          if (rk === ck) match = true
        })
      })
      if (!match) {
        return false
      }
      // console.log('st: ', st)
      const deserializedTx = this.api.deserializeTransaction(st)
      // console.log('deserializedTx: ', deserializedTx)
      const actions = await this.api.deserializeActions(deserializedTx.actions)
      // console.log('actions: ', actions)
      const action = actions.find((a) => a.name === 'auth')
      // console.log('action: ', !!action)
      if (!action) return false
      // console.log('about to parse action.data.nonce', action.data.nonce)
      const { nonce: transactionNonce } = action.data
      // console.log('transactionNonce', transactionNonce)
      // console.log('nonce', nonce)
      if (nonce.split(':')[0] !== transactionNonce) {
        return false
      }
      // console.log('nonce true')
      return true
    } else return false
  }
}
