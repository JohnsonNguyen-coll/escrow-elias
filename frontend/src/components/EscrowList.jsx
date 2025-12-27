import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import EscrowCard from './EscrowCard'
import { RefreshCw, AlertTriangle, Wallet, FileText, Sparkles, TrendingUp } from 'lucide-react'

const ESCROW_STATUS = {
  0: 'Pending',
  1: 'Completed',
  2: 'Refunded',
  3: 'Disputed',
  4: 'Resolved',
}

export default function EscrowList() {
  const { address } = useAccount()
  const [escrowIds, setEscrowIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isEscrowAddressSet = ESCROW_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  const { data: buyerEscrows, refetch: refetchBuyer, isError: buyerErr, error: buyerError, isLoading: buyerLoading } =
    useReadContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getBuyerEscrows',
      args: [address],
      query: { enabled: !!address && isEscrowAddressSet },
    })

  const { data: sellerEscrows, refetch: refetchSeller, isError: sellerErr, error: sellerError, isLoading: sellerLoading } =
    useReadContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getSellerEscrows',
      args: [address],
      query: { enabled: !!address && isEscrowAddressSet },
    })

  useEffect(() => {
    if (!address || !isEscrowAddressSet) {
      setEscrowIds([])
      setLoading(false)
      return
    }
    if (buyerErr || sellerErr) {
      setError(buyerError?.message || sellerError?.message || 'Failed to load escrows')
      setLoading(false)
      return
    }
    if (!buyerLoading && !sellerLoading) {
      const ids = [...new Set([...(buyerEscrows || []), ...(sellerEscrows || [])])]
        .map(Number)
        .sort((a, b) => a - b) // Sắp xếp theo ID tăng dần (theo thứ tự tạo)
      setEscrowIds(ids)
      setLoading(false)
    }
  }, [address, isEscrowAddressSet, buyerEscrows, sellerEscrows, buyerErr, sellerErr, buyerError, sellerError, buyerLoading, sellerLoading])

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    refetchBuyer()
    refetchSeller()
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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-3xl shadow-2xl border border-blue-500/20 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
        <div className="relative text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-2xl animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl border border-blue-500/30 backdrop-blur-sm">
              <Wallet className="w-16 h-16 text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
            Connect Your Wallet
            <Sparkles className="w-5 h-5 text-blue-400" />
          </h3>
          <p className="text-slate-400 max-w-md mx-auto">Please connect your wallet to view and manage your escrow transactions</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
        <div className="relative text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
            <RefreshCw className="w-12 h-12 animate-spin text-blue-400 relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Escrows</h3>
          <p className="text-slate-400 text-sm">Fetching your transactions from the blockchain...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 rounded-3xl shadow-2xl border border-red-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-start gap-5 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl"></div>
              <div className="relative p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl border border-red-500/30 backdrop-blur-sm">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Failed to Load Escrows</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="relative group overflow-hidden px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-300 shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Retry Loading</span>
            </div>
          </button>
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
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                My Escrows
                <Sparkles className="w-5 h-5 text-purple-400" />
              </h2>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {escrowIds.length} transaction{escrowIds.length !== 1 ? 's' : ''} in total
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="relative group overflow-hidden px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-300 shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Refresh</span>
            </div>
          </button>
        </div>

        {escrowIds.length === 0 ? (
          <div className="relative overflow-hidden text-center py-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 rounded-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent"></div>
            <div className="relative">
              <div className="relative inline-flex mb-6">
                <div className="absolute inset-0 bg-slate-600/20 rounded-3xl blur-2xl"></div>
                <div className="relative p-6 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-3xl border border-slate-600/30 backdrop-blur-sm">
                  <FileText className="w-16 h-16 text-slate-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No Escrows Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Create your first escrow transaction to get started with secure payments</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {escrowIds.map((id, index) => (
              <EscrowCard key={id} escrowId={id} address={address} displayNumber={index + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
