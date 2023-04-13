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
    const nonce = blake2b(randomBytes(32), undefined, 32)
    return getInt64StrFromUint8Array(nonce)
  }

  public async verifyNonce({
    account_name,
    proof,
    nonce,
  }: NonceVerificationParams): Promise<boolean> {
    if (!proof || !proof.signatures.length || !proof.serializedTransaction) {
      throw new InvalidProofError()
    }
    // make buffer from transaction
    const arr = []
    for (const key in proof.serializedTransaction) {
      arr.push(proof.serializedTransaction[key])
    }
    const uarr = new Uint8Array(arr)
    const buf = Buffer.from(uarr)

    const data = Buffer.concat([
      Buffer.from(this.chainId, 'hex'),
      buf,
      Buffer.from(new Uint8Array(32)),
    ])

    const recoveredKeys: string[] = []
    proof.signatures.forEach((sigstr: string) => {
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

      const actions = await this.api.deserializeActions(
        this.api.deserializeTransaction(uarr).actions
      )
      const action = actions.find((a) => a.name === 'requestrand')
      if (!action) return false
      const transactionNonce = action.data.assoc_id

      if (nonce !== transactionNonce) {
        return false
      }

      return true
    } else return false
  }
}
