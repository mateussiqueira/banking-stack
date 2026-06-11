import {
  registerKey,
  lookupKey,
  deactivateKey,
  createClaim,
  confirmClaim,
  getClaim,
  cancelClaim,
  updateKey,
} from '../services/dictService'
import { KeyType, AccountType } from '../models/PixKey'
import { connectMongo, disconnectMongo, clearCollections } from './helpers/mongoHelper'

const validCpf = '52998224725'
const validEmail = 'user@example.com'
const validIspb = '12345678'
const validBranch = '0001'
const validAccount = '12345-6'
const validHolder = 'Maria Silva'

async function createTestKey(key: string, keyType: KeyType = KeyType.CPF) {
  return registerKey({
    key,
    keyType,
    accountType: AccountType.CHECKING,
    ispb: validIspb,
    branch: validBranch,
    accountNumber: validAccount,
    accountHolderName: validHolder,
    accountHolderDoc: validCpf,
  })
}

beforeAll(async () => {
  await connectMongo()
}, 120000)

afterAll(async () => {
  await disconnectMongo()
})

beforeEach(async () => {
  await clearCollections()
})

describe('DICT Key Management', () => {
  describe('registerKey', () => {
    it('should create a CPF Pix key', async () => {
      const pixKey = await createTestKey(validCpf)
      expect(pixKey.key).toBe(validCpf)
      expect(pixKey.keyType).toBe(KeyType.CPF)
      expect(pixKey.status).toBe('ACTIVE')
    })

    it('should create an email Pix key', async () => {
      const pixKey = await createTestKey(validEmail, KeyType.EMAIL)
      expect(pixKey.key).toBe(validEmail)
      expect(pixKey.keyType).toBe(KeyType.EMAIL)
    })

    it('should reject duplicate key', async () => {
      await createTestKey(validCpf)
      await expect(createTestKey(validCpf)).rejects.toThrow('already registered')
    })

    it('should reject invalid CPF', async () => {
      await expect(
        registerKey({
          key: '11111111111',
          keyType: KeyType.CPF,
          accountType: AccountType.CHECKING,
          ispb: validIspb,
          branch: validBranch,
          accountNumber: validAccount,
          accountHolderName: validHolder,
          accountHolderDoc: '11111111111',
        }),
      ).rejects.toThrow('Invalid CPF')
    })
  })

  describe('lookupKey', () => {
    it('should find an existing active key', async () => {
      const key = `lookup-${Date.now()}@test.com`
      await createTestKey(key, KeyType.EMAIL)
      const pixKey = await lookupKey(key)
      expect(pixKey).not.toBeNull()
      expect(pixKey!.key).toBe(key)
    })

    it('should return null for non-existent key', async () => {
      const pixKey = await lookupKey('nonexistent-key-12345')
      expect(pixKey).toBeNull()
    })
  })

  describe('updateKey', () => {
    it('should update key fields', async () => {
      const key = `update-${Date.now()}@test.com`
      await createTestKey(key, KeyType.EMAIL)
      const updated = await updateKey(key, { accountHolderName: 'João Updated' })
      expect(updated).not.toBeNull()
      expect(updated!.accountHolderName).toBe('João Updated')
    })
  })

  describe('deactivateKey', () => {
    it('should deactivate an active key', async () => {
      const key = `deactivate-${Date.now()}@test.com`
      await createTestKey(key, KeyType.EMAIL)
      const result = await deactivateKey(key)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('FROZEN')
    })
  })
})

describe('Claim Flow', () => {
  it('should create, confirm and reject cancel of completed claim', async () => {
    const key = `claim-${Date.now()}@test.com`
    await createTestKey(key, KeyType.EMAIL)

    const claim = await createClaim({
      key,
      targetIspb: '87654321',
      targetAccount: '54321-0',
      targetBranch: '0002',
      targetAccountHolderName: 'João Portador',
    })
    expect(claim.status).toBe('OPEN')
    expect(claim.key).toBe(key)

    const fetched = await getClaim(claim._id.toString())
    expect(fetched).not.toBeNull()
    expect(fetched!._id.toString()).toBe(claim._id.toString())

    const confirmed = await confirmClaim(claim._id.toString())
    expect(confirmed).not.toBeNull()
    expect(confirmed!.status).toBe('COMPLETED')

    await expect(cancelClaim(claim._id.toString())).rejects.toThrow('Cannot cancel')
  })

  it('should cancel an open claim', async () => {
    const key = `cancel-${Date.now()}@test.com`
    await createTestKey(key, KeyType.EMAIL)

    const claim = await createClaim({
      key,
      targetIspb: '87654321',
      targetAccount: '54321-0',
      targetBranch: '0002',
      targetAccountHolderName: 'João Portador',
    })

    const cancelled = await cancelClaim(claim._id.toString())
    expect(cancelled!.status).toBe('CANCELLED')
  })

  it('should return null for non-existent claim', async () => {
    const claim = await getClaim('000000000000000000000000')
    expect(claim).toBeNull()
  })
})
