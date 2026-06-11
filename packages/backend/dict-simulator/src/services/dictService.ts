import { PixKey, KeyType, AccountType, KeyStatus, IPixKey } from '../models/PixKey'
import { AccountClaim, ClaimStatus, IAccountClaim } from '../models/AccountClaim'
import { validateKeyType, formatPixKey } from '../validation/keyValidation'

interface CreateKeyInput {
  key: string
  keyType: KeyType
  accountType: AccountType
  ispb: string
  branch: string
  accountNumber: string
  accountHolderName: string
  accountHolderDoc: string
}

interface UpdateKeyInput {
  accountType?: AccountType
  branch?: string
  accountNumber?: string
  accountHolderName?: string
}

export async function registerKey(input: CreateKeyInput): Promise<IPixKey> {
  const validation = validateKeyType(input.key, input.keyType)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const formattedKey = formatPixKey(input.key, input.keyType)

  const existing = await PixKey.findOne({ key: formattedKey })
  if (existing) {
    throw new Error('Pix key already registered')
  }

  const pixKey = new PixKey({
    key: formattedKey,
    keyType: input.keyType,
    accountType: input.accountType,
    ispb: input.ispb,
    branch: input.branch,
    accountNumber: input.accountNumber,
    accountHolderName: input.accountHolderName,
    accountHolderDoc: input.accountHolderDoc,
    status: KeyStatus.ACTIVE,
  })

  return pixKey.save()
}

export async function lookupKey(key: string, keyType?: KeyType): Promise<IPixKey | null> {
  const pixKey = await PixKey.findOne({ key })
  if (!pixKey) return null
  if (pixKey.status !== KeyStatus.ACTIVE) return null
  return pixKey
}

export async function updateKey(key: string, input: UpdateKeyInput): Promise<IPixKey | null> {
  const pixKey = await PixKey.findOne({ key, status: KeyStatus.ACTIVE })
  if (!pixKey) return null

  if (input.accountType !== undefined) pixKey.accountType = input.accountType
  if (input.branch !== undefined) pixKey.branch = input.branch
  if (input.accountNumber !== undefined) pixKey.accountNumber = input.accountNumber
  if (input.accountHolderName !== undefined) pixKey.accountHolderName = input.accountHolderName

  return pixKey.save()
}

export async function deactivateKey(key: string): Promise<IPixKey | null> {
  const pixKey = await PixKey.findOne({ key, status: KeyStatus.ACTIVE })
  if (!pixKey) return null

  pixKey.status = KeyStatus.FROZEN
  return pixKey.save()
}

export async function listKeys(
  page: number = 1,
  limit: number = 20,
): Promise<{ keys: IPixKey[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit
  const [keys, total] = await Promise.all([
    PixKey.find({ status: KeyStatus.ACTIVE }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    PixKey.countDocuments({ status: KeyStatus.ACTIVE }),
  ])

  return {
    keys,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function createClaim(input: {
  key: string
  targetIspb: string
  targetAccount: string
  targetBranch: string
  targetAccountHolderName: string
}): Promise<IAccountClaim> {
  const pixKey = await PixKey.findOne({ key: input.key, status: KeyStatus.ACTIVE })
  if (!pixKey) {
    throw new Error('Pix key not found or not active')
  }

  const existingClaim = await AccountClaim.findOne({
    key: input.key,
    status: { $in: [ClaimStatus.OPEN, ClaimStatus.WAITING] },
  })
  if (existingClaim) {
    throw new Error('There is already an open claim for this key')
  }

  const claim = new AccountClaim({
    key: input.key,
    targetIspb: input.targetIspb,
    targetAccount: input.targetAccount,
    targetBranch: input.targetBranch,
    targetAccountHolderName: input.targetAccountHolderName,
    status: ClaimStatus.OPEN,
  })

  return claim.save()
}

export async function getClaim(claimId: string): Promise<IAccountClaim | null> {
  return AccountClaim.findById(claimId)
}

export async function confirmClaim(claimId: string): Promise<IAccountClaim | null> {
  const claim = await AccountClaim.findById(claimId)
  if (!claim) return null
  if (claim.status !== ClaimStatus.OPEN) {
    throw new Error('Claim is not in OPEN status')
  }

  claim.status = ClaimStatus.COMPLETED
  return claim.save()
}

export async function cancelClaim(claimId: string): Promise<IAccountClaim | null> {
  const claim = await AccountClaim.findById(claimId)
  if (!claim) return null
  if (claim.status === ClaimStatus.COMPLETED) {
    throw new Error('Cannot cancel a completed claim')
  }

  claim.status = ClaimStatus.CANCELLED
  return claim.save()
}
