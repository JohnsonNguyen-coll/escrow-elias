import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import { Shield, AlertTriangle, RefreshCw, CheckCircle, User, Users, DollarSign, Loader2 } from 'lucide-react'
import { formatUnits } from 'viem'
import { publicClient } from '../config/wagmi'

export default function AdminPanel() {
  const { address } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)
  const [disputedEscrows, setDisputedEscrows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isEscrowAddressSet = ESCROW_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  const { data: adminAddress } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'admin',
  })

  const { data: nextEscrowId, refetch: refetchNextId } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'nextEscrowId',
    query: { 
      enabled: isEscrowAddressSet,
      refetchInterval: 3000 
    },
  })

  useEffect(() => {
    if (adminAddress && address) {
      const adminCheck = adminAddress.toLowerCase() === address.toLowerCase()
      console.log('Admin check:', { adminAddress, address, isAdmin: adminCheck })
      setIsAdmin(adminCheck)
    }
  }, [adminAddress, address])

  useEffect(() => {
    if (isAdmin && nextEscrowId) {
      fetchDisputes()
    }
  }, [isAdmin, nextEscrowId])

  const fetchDisputes = async () => {
    setLoading(true)
    setError(null)
    try {
      await refetchNextId()
      
      const disputes = []
      const total = Number(nextEscrowId)

      console.log(`[ADMIN] Fetching disputes for ${total} escrows...`)

      for (let i = 0; i < total; i++) {
        try {
          const escrowData = await publicClient.readContract({
            address: ESCROW_CONTRACT_ADDRESS,
            abi: ESCROW_ABI,
            functionName: 'getEscrow',
            args: [BigInt(i)],
          })

          console.log(`[ADMIN] Escrow ${i}:`, {
            status: escrowData.status,
            statusNum: Number(escrowData.status),
            disputeRaised: escrowData.disputeRaised,
            buyer: escrowData.buyer,
            seller: escrowData.seller,
          })

          // Status 3 = Disputed
          if (escrowData && Number(escrowData.status) === 3) {
            disputes.push(i)
            console.log(`[ADMIN] ✓ Escrow ${i} is DISPUTED!`)
          }
        } catch (err) {
          console.log(`[ADMIN] Escrow ${i} not found or error:`, err.message)
        }
      }

      console.log(`[ADMIN] Found ${disputes.length} disputed escrows:`, disputes)
      setDisputedEscrows(disputes)
    } catch (err) {
      console.error('[ADMIN] Error fetching disputes:', err)
      setError('Failed to fetch disputes from contract')
    } finally {
      setLoading(false)
    }
  }

  if (!isEscrowAddressSet) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Configuration Required</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Please set <code className="px-2 py-0.5 bg-slate-700/50 rounded text-blue-300 font-mono text-xs">VITE_ESCROW_CONTRACT_ADDRESS</code> in <code className="px-2 py-0.5 bg-slate-700/50 rounded text-blue-300 font-mono text-xs">frontend/.env</code> and reload the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-12">
        <div className="text-center">
          <div className="inline-flex p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-6">
            <Shield className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Connect Admin Wallet</h2>
          <p className="text-slate-400">Please connect your admin wallet to access the panel.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-12">
        <div className="text-center">
          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-6">
            <Shield className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">Only the contract admin can access this panel</p>
          <div className="inline-block bg-slate-700/50 border border-slate-600/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Current:</span>
              <span className="text-slate-200 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Admin:</span>
              <span className="text-slate-200 font-mono">
                {adminAddress ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-slate-400 mt-0.5">Manage disputed escrows</p>
          </div>
        </div>
        <button
          onClick={fetchDisputes}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-200 disabled:opacity-50 group"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-blue-400">
            <strong className="font-semibold">Total Escrows:</strong> {nextEscrowId?.toString() || '0'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Disputed Escrows
          </h3>
          <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-bold">
            {disputedEscrows.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="relative inline-flex mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
              <RefreshCw className="w-10 h-10 animate-spin text-blue-400 relative z-10" />
            </div>
            <p className="text-slate-400">Loading disputes...</p>
          </div>
        ) : disputedEscrows.length === 0 ? (
          <div className="text-center py-12 bg-slate-700/30 border border-slate-600/30 rounded-xl">
            <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-slate-300 font-semibold mb-2">No disputed escrows</p>
            <p className="text-xs text-slate-500">Checked {nextEscrowId?.toString() || '0'} escrows</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputedEscrows.map((escrowId) => (
              <DisputeResolutionCard key={escrowId} escrowId={escrowId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DisputeResolutionCard({ escrowId }) {
  const { data: escrow, isLoading, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [BigInt(escrowId)],
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: () => {
      refetch()
    }
  })

  const handleResolve = (toSeller) => {
    console.log(`[ADMIN] Resolving dispute ${escrowId}, toSeller=${toSeller}`)
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'resolveDispute',
      args: [BigInt(escrowId), toSeller],
    })
  }

  if (isLoading) return null
  if (!escrow || Number(escrow.status) !== 3) return null

  const amount = escrow.amount ? formatUnits(escrow.amount, 6) : '0'

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Escrow #{escrowId}
          </h4>
          <span className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-xs font-bold uppercase">
            Disputed
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Amount</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">{amount} USDC</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Buyer</span>
            </div>
            <p className="text-sm font-mono text-slate-200">{escrow.buyer.slice(0, 6)}...{escrow.buyer.slice(-4)}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Seller</span>
            </div>
            <p className="text-sm font-mono text-slate-200">{escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Disputed By</span>
            </div>
            <p className="text-sm font-mono text-slate-200">{escrow.disputeRaiser.slice(0, 6)}...{escrow.disputeRaiser.slice(-4)}</p>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-semibold">Dispute resolved successfully!</span>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-700/50">
        <button
          onClick={() => handleResolve(true)}
          disabled={isPending || isTxLoading || isSuccess}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
        >
          {isPending || isTxLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Pay Seller</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleResolve(false)}
          disabled={isPending || isTxLoading || isSuccess}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          {isPending || isTxLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span>Refund Buyer</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}