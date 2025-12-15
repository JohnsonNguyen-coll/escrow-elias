import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import EscrowCard from './EscrowCard'
import { RefreshCw, AlertTriangle, Wallet, FileText } from 'lucide-react'

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
      const ids = [...new Set([...(buyerEscrows || []), ...(sellerEscrows || [])])].map((id) => Number(id))
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
            <Wallet className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Connect Your Wallet</h3>
          <p className="text-slate-400">Please connect your wallet to view and manage your escrows.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-12">
        <div className="text-center">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
            <RefreshCw className="w-12 h-12 animate-spin text-blue-400 relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Escrows</h3>
          <p className="text-slate-400 text-sm">Fetching your transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Failed to Load Escrows</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-200 group"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Retry</span>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">My Escrows</h2>
            <p className="text-sm text-slate-400 mt-0.5">{escrowIds.length} transaction{escrowIds.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-xl transition-all duration-200 group"
        >
          <RefreshCw className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Refresh</span>
        </button>
      </div>

      {escrowIds.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex p-4 bg-slate-700/30 rounded-2xl border border-slate-600/30 mb-6">
            <FileText className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Escrows Found</h3>
          <p className="text-sm text-slate-500">Create your first escrow transaction to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escrowIds.map((id) => (
            <EscrowCard key={id} escrowId={id} address={address} />
          ))}
        </div>
      )}
    </div>
  )
}