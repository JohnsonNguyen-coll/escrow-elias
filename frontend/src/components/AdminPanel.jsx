import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import { Shield, AlertTriangle, RefreshCw, CheckCircle, User, Users, DollarSign, Loader2, Sparkles, Clock } from 'lucide-react'
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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-yellow-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="relative flex items-start gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-xl animate-pulse"></div>
            <div className="relative p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-2xl border border-yellow-500/30 backdrop-blur-sm">
              <AlertTriangle className="w-7 h-7 text-yellow-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              Configuration Required
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Please configure your environment variables to continue:
            </p>
            <div className="space-y-2">
              <code className="block px-4 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-blue-300 font-mono text-xs">
                VITE_ESCROW_CONTRACT_ADDRESS
              </code>
              <p className="text-xs text-slate-400">
                Location: <span className="text-emerald-400">frontend/.env</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-3xl shadow-2xl border border-purple-500/20 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
        <div className="relative text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-purple-500/30 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl border border-purple-500/30 backdrop-blur-sm">
              <Shield className="w-16 h-16 text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
            Admin Authentication
            <Sparkles className="w-5 h-5 text-purple-400" />
          </h2>
          <p className="text-slate-400 max-w-md mx-auto">Connect your admin wallet to access the control panel and manage disputes</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 rounded-3xl shadow-2xl border border-red-500/20 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
        <div className="relative text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-red-500/30 rounded-3xl blur-2xl"></div>
            <div className="relative p-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl border border-red-500/30 backdrop-blur-sm">
              <Shield className="w-16 h-16 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Admin privileges required to access this control panel</p>
          <div className="inline-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-8">
              <span className="text-sm text-slate-500 font-semibold">Your Wallet</span>
              <span className="text-slate-200 font-mono text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
            <div className="flex items-center justify-between gap-8">
              <span className="text-sm text-slate-500 font-semibold">Admin Wallet</span>
              <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                {adminAddress ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent"></div>
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                Admin Control Panel
                <Sparkles className="w-5 h-5 text-purple-400" />
              </h2>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Monitor and resolve disputed escrows
              </p>
            </div>
          </div>
          <button
            onClick={fetchDisputes}
            disabled={loading}
            className="relative group overflow-hidden px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2.5">
              <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </span>
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-6 relative overflow-hidden p-5 bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
            <div className="relative flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-xl"></div>
          <div className="relative p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-blue-300/80 font-semibold uppercase tracking-wide">Total Escrows</p>
                  <p className="text-2xl font-bold text-blue-400 mt-0.5">{nextEscrowId?.toString() || '0'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-red-300/80 font-semibold uppercase tracking-wide">Active Disputes</p>
                  <p className="text-2xl font-bold text-red-400 mt-0.5">{disputedEscrows.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              Pending Dispute Resolutions
            </h3>
            <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
              <span className="text-red-400 font-bold text-lg">{disputedEscrows.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative inline-flex mb-6">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
                <RefreshCw className="w-12 h-12 animate-spin text-blue-400 relative z-10" />
              </div>
              <p className="text-slate-300 font-semibold">Loading dispute data...</p>
              <p className="text-sm text-slate-500 mt-2">Please wait while we fetch the latest information</p>
            </div>
          ) : disputedEscrows.length === 0 ? (
            <div className="relative overflow-hidden text-center py-16 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
              <div className="relative">
                <div className="relative inline-flex mb-4">
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-3xl blur-2xl"></div>
                  <div className="relative p-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl border border-emerald-500/30 backdrop-blur-sm">
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
                <p className="text-slate-200 font-bold text-lg mb-2">All Clear!</p>
                <p className="text-sm text-slate-400">No disputed escrows found</p>
                <p className="text-xs text-slate-500 mt-3">Checked {nextEscrowId?.toString() || '0'} total escrows</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {disputedEscrows.map((escrowId) => (
                <DisputeResolutionCard key={escrowId} escrowId={escrowId} />
              ))}
            </div>
          )}
        </div>
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
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-red-500/30 rounded-2xl backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-transparent"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Escrow #{escrowId}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Requires immediate attention</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/40 rounded-xl backdrop-blur-sm">
              <span className="text-red-400 text-xs font-bold uppercase tracking-wide">Disputed</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-emerald-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                </div>
                <p className="text-xl font-bold text-emerald-400">{amount} <span className="text-sm text-emerald-400/70">USDC</span></p>
              </div>
            </div>
            
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-blue-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer</span>
                </div>
                <p className="text-sm font-mono text-slate-200 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/30 inline-block">
                  {escrow.buyer.slice(0, 6)}...{escrow.buyer.slice(-4)}
                </p>
              </div>
            </div>
            
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-purple-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller</span>
                </div>
                <p className="text-sm font-mono text-slate-200 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/30 inline-block">
                  {escrow.seller.slice(0, 6)}...{escrow.seller.slice(-4)}
                </p>
              </div>
            </div>
            
            <div className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-red-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raised By</span>
                </div>
                <p className="text-sm font-mono text-slate-200 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/30 inline-block">
                  {escrow.disputeRaiser.slice(0, 6)}...{escrow.disputeRaiser.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isSuccess && (
          <div className="mb-5 relative overflow-hidden p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-emerald-300 font-bold">Dispute resolved successfully!</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-5 border-t border-slate-700/50">
          <button
            onClick={() => handleResolve(true)}
            disabled={isPending || isTxLoading || isSuccess}
            className="relative flex-1 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isPending || isTxLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Pay Seller</span>
                </>
              )}
            </div>
          </button>
          <button
            onClick={() => handleResolve(false)}
            disabled={isPending || isTxLoading || isSuccess}
            className="relative flex-1 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isPending || isTxLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  <span>Refund Buyer</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
