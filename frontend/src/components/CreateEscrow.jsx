import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, USDC_ABI } from '../config/contract'
import { parseUnits, formatUnits } from 'viem'
import { CheckCircle, AlertCircle, Plus, DollarSign, Clock, Users, Loader2, Shield } from 'lucide-react'

export default function CreateEscrow() {
  const { address } = useAccount()
  const [seller, setSeller] = useState('')
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('7')

  // Get USDC address from contract
  const { data: usdcAddress, isLoading: isUsdcLoading } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'USDC',
  })

  // Check USDC balance
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!usdcAddress && !!address },
  })

  // Check allowance
  const { data: allowance, isLoading: isAllowanceLoading, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address, ESCROW_CONTRACT_ADDRESS],
    query: { enabled: !!usdcAddress && !!address },
  })

  // Approve USDC
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract()
  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Create escrow
  const { writeContract: createEscrow, data: createHash, isPending: isCreating } = useWriteContract()
  const { isLoading: isCreatingTx, isSuccess: isCreated } = useWaitForTransactionReceipt({
    hash: createHash,
  })

  // Auto refetch allowance after approve success
  useEffect(() => {
    if (isApproveSuccess) {
      setTimeout(() => {
        refetchAllowance()
      }, 1000)
    }
  }, [isApproveSuccess, refetchAllowance])

  // Auto refetch balance after create escrow success
  useEffect(() => {
    if (isCreated) {
      setTimeout(() => {
        refetchBalance()
        refetchAllowance()
        setSeller('')
        setAmount('')
        setDays('7')
      }, 1000)
    }
  }, [isCreated, refetchBalance, refetchAllowance])

  const handleApprove = () => {
    if (!usdcAddress || !amount) return
    const amountWei = parseUnits(amount, 6)
    approve({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ESCROW_CONTRACT_ADDRESS, amountWei],
    })
  }

  const handleCreate = () => {
    if (!seller || !amount || !days) return
    
    const amountWei = parseUnits(amount, 6)
    const daysNum = parseInt(days)
    
    // Validate timeout is within 1-365 days
    if (daysNum < 1 || daysNum > 365) {
      alert('Timeout must be between 1 and 365 days')
      return
    }
    
    // Smart contract expects number of days, not Unix timestamp
    createEscrow({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [seller, amountWei, BigInt(daysNum)],
    })
  }

  const amountWei = amount ? parseUnits(amount, 6) : 0n
  const hasEnoughBalance = balance === undefined ? true : amountWei <= balance
  const hasEnoughAllowance = allowance === undefined ? true : amountWei <= allowance
  const daysNum = parseInt(days)
  const isValidDays = daysNum >= 1 && daysNum <= 365
  const isFetching = isUsdcLoading || isBalanceLoading || isAllowanceLoading
  const isEscrowAddressSet = ESCROW_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
            <Plus className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Escrow</h2>
            <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Set up a secure transaction
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Warning Messages */}
        {!isEscrowAddressSet && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>Please set VITE_ESCROW_CONTRACT_ADDRESS in frontend/.env and reload.</span>
          </div>
        )}

        {!isUsdcLoading && usdcAddress === undefined && isEscrowAddressSet && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>Cannot read USDC address from contract. Make sure the contract is deployed on Arc Testnet and the address is correct.</span>
          </div>
        )}

        {/* Balance Display */}
        {balance !== undefined && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <p className="text-sm font-semibold text-slate-400 uppercase">Your USDC Balance</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {formatUnits(balance, 6)}
              </p>
              <span className="text-lg text-slate-400 font-semibold">USDC</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isApproveSuccess && !isCreated && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">USDC approved successfully! You can now create escrow.</span>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Seller Address */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Seller Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:border-blue-500 focus:bg-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-200 font-mono placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                step="0.000001"
                min="0"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:border-blue-500 focus:bg-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-200 text-lg font-semibold placeholder:text-slate-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">USDC</span>
            </div>
            {!isFetching && balance !== undefined && !hasEnoughBalance && amount && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Insufficient balance
              </p>
            )}
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeout Period
            </label>
            <div className="relative">
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="7"
                min="1"
                max="365"
                className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:border-blue-500 focus:bg-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-slate-200 text-lg font-semibold placeholder:text-slate-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">days</span>
            </div>
            {days && !isValidDays && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Timeout must be between 1 and 365 days
              </p>
            )}
            {(!days || isValidDays) && (
              <p className="text-xs text-slate-500 mt-2">Between 1 and 365 days</p>
            )}
          </div>
        </div>

        {/* Created Success Message */}
        {isCreated && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-400 font-medium">Escrow created successfully!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          {!hasEnoughAllowance && amount && hasEnoughBalance && (
            <button
              onClick={handleApprove}
              disabled={isApproving || isApprovingTx || !amount || !hasEnoughBalance}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isApproving || isApprovingTx ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                'Approve USDC'
              )}
            </button>
          )}
          <button
            onClick={handleCreate}
            disabled={
              isCreating ||
              isCreatingTx ||
              !seller ||
              !amount ||
              !hasEnoughBalance ||
              !hasEnoughAllowance ||
              !isValidDays ||
              isFetching
            }
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isCreating || isCreatingTx ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Create Escrow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}