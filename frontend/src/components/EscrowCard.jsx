import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import { formatUnits } from 'viem'
import { CheckCircle, Clock, AlertTriangle, XCircle, User, Users, Calendar, Loader2 } from 'lucide-react'
import { useState } from 'react'

const ESCROW_STATUS = {
  0: { name: 'Pending', color: 'yellow', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-400', icon: Clock },
  1: { name: 'Completed', color: 'green', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-400', icon: CheckCircle },
  2: { name: 'Refunded', color: 'blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400', icon: XCircle },
  3: { name: 'Disputed', color: 'red', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-400', icon: AlertTriangle },
  4: { name: 'Resolved', color: 'gray', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30', textColor: 'text-slate-400', icon: CheckCircle },
}

export default function EscrowCard({ escrowId, address }) {
  const [actionLoading, setActionLoading] = useState(null)

  const { data: escrow, refetch } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: [BigInt(escrowId)],
  })

  const { data: isTimedOut } = useReadContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'isTimedOut',
    args: [BigInt(escrowId)],
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleAction = async (action, ...args) => {
    setActionLoading(action)
    writeContract({
      address: ESCROW_CONTRACT_ADDRESS,
      abi: ESCROW_ABI,
      functionName: action,
      args: [BigInt(escrowId), ...args],
    })
  }

  if (isSuccess && actionLoading) {
    refetch()
    setActionLoading(null)
  }

  if (!escrow) {
    return (
      <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <p className="text-slate-400">Loading escrow #{escrowId}...</p>
        </div>
      </div>
    )
  }

  const status = ESCROW_STATUS[escrow.status] || ESCROW_STATUS[0]
  const StatusIcon = status.icon
  const isBuyer = escrow.buyer.toLowerCase() === address?.toLowerCase()
  const isSeller = escrow.seller.toLowerCase() === address?.toLowerCase()
  const canRefund = isBuyer && escrow.status === 0 && isTimedOut && !escrow.disputeRaised
  const canConfirm = isBuyer && escrow.status === 0 && !escrow.disputeRaised
  const canDispute = (isBuyer || isSeller) && escrow.status === 0 && !escrow.disputeRaised

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  return (
    <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-600/50 rounded-2xl p-6 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-bold text-white">
              Escrow
            </h3>
            <div className={`flex items-center gap-2 px-3 py-1.5 ${status.bgColor} border ${status.borderColor} rounded-lg`}>
              <StatusIcon className={`w-4 h-4 ${status.textColor}`} />
              <span className={`text-xs font-semibold ${status.textColor}`}>
                {status.name}
              </span>
            </div>
          </div>
          <div className="inline-flex items-baseline gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {formatUnits(escrow.amount, 6)}
            </span>
            <span className="text-sm font-semibold text-slate-400">USDC</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">Buyer</p>
          </div>
          <p className="font-mono text-sm text-slate-200">{formatAddress(escrow.buyer)}</p>
          {isBuyer && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-semibold text-blue-400">
              You
            </span>
          )}
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">Seller</p>
          </div>
          <p className="font-mono text-sm text-slate-200">{formatAddress(escrow.seller)}</p>
          {isSeller && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-semibold text-purple-400">
              You
            </span>
          )}
        </div>
        
        <div className="col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <p className="text-xs font-semibold text-slate-400 uppercase">Timeout</p>
          </div>
          <p className="text-sm text-slate-200">{formatDate(escrow.timeout)}</p>
        </div>
      </div>

      {escrow.disputeRaised && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">Dispute Raised</p>
              <p className="text-xs text-red-300">
                by {formatAddress(escrow.disputeRaiser)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isTimedOut && escrow.status === 0 && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <p className="text-sm font-semibold text-yellow-400">Escrow has timed out</p>
          </div>
        </div>
      )}

      {(canConfirm || canRefund || canDispute) && (
        <div className="flex gap-3 flex-wrap pt-4 border-t border-slate-700/50">
          {canConfirm && (
            <button
              onClick={() => handleAction('confirmCompletion')}
              disabled={isPending || isTxLoading || actionLoading === 'confirmCompletion'}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              {isPending || isTxLoading || actionLoading === 'confirmCompletion' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Completion</span>
                </>
              )}
            </button>
          )}
          {canRefund && (
            <button
              onClick={() => handleAction('refund')}
              disabled={isPending || isTxLoading || actionLoading === 'refund'}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {isPending || isTxLoading || actionLoading === 'refund' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Refund</span>
                </>
              )}
            </button>
          )}
          {canDispute && (
            <button
              onClick={() => handleAction('raiseDispute')}
              disabled={isPending || isTxLoading || actionLoading === 'raiseDispute'}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              {isPending || isTxLoading || actionLoading === 'raiseDispute' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Raise Dispute</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
