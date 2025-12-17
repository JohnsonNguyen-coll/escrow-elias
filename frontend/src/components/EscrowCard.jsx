import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI } from '../config/contract'
import { formatUnits } from 'viem'
import { CheckCircle, Clock, AlertTriangle, XCircle, User, Users, Calendar, Loader2, DollarSign, Sparkles } from 'lucide-react'
import { useState } from 'react'

const ESCROW_STATUS = {
  0: { name: 'Pending', color: 'yellow', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-400', icon: Clock, gradientFrom: 'from-yellow-500/10', gradientTo: 'to-amber-500/10' },
  1: { name: 'Completed', color: 'green', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-400', icon: CheckCircle, gradientFrom: 'from-emerald-500/10', gradientTo: 'to-teal-500/10' },
  2: { name: 'Refunded', color: 'blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400', icon: XCircle, gradientFrom: 'from-blue-500/10', gradientTo: 'to-cyan-500/10' },
  3: { name: 'Disputed', color: 'red', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-400', icon: AlertTriangle, gradientFrom: 'from-red-500/10', gradientTo: 'to-orange-500/10' },
  4: { name: 'Resolved', color: 'gray', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30', textColor: 'text-slate-400', icon: CheckCircle, gradientFrom: 'from-slate-500/10', gradientTo: 'to-slate-600/10' },
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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent"></div>
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
          <p className="text-slate-400 font-medium">Loading escrow #{escrowId}...</p>
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
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradientFrom} ${status.gradientTo} opacity-50`}></div>
      <div className={`absolute top-0 right-0 w-64 h-64 ${status.bgColor} rounded-full blur-3xl`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Escrow #{escrowId}
                </h3>
              </div>
              <div className={`relative flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${status.gradientFrom} ${status.gradientTo} border ${status.borderColor} rounded-lg backdrop-blur-sm`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <StatusIcon className={`relative w-4 h-4 ${status.textColor}`} />
                <span className={`relative text-xs font-bold ${status.textColor} uppercase tracking-wide`}>
                  {status.name}
                </span>
              </div>
            </div>
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative flex items-baseline gap-2 px-5 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {formatUnits(escrow.amount, 6)}
                </span>
                <span className="text-sm font-bold text-slate-400">USDC</span>
                <Sparkles className="w-4 h-4 text-purple-400 ml-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-blue-500/30 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer</p>
              </div>
              <p className="font-mono text-sm text-slate-200 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/30 inline-block mb-2">
                {formatAddress(escrow.buyer)}
              </p>
              {isBuyer && (
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur"></div>
                  <span className="relative inline-block px-2.5 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 rounded-lg text-xs font-bold text-blue-400">
                    You
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-purple-500/30 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller</p>
              </div>
              <p className="font-mono text-sm text-slate-200 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-700/30 inline-block mb-2">
                {formatAddress(escrow.seller)}
              </p>
              {isSeller && (
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-purple-500/30 rounded-lg blur"></div>
                  <span className="relative inline-block px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg text-xs font-bold text-purple-400">
                    You
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-2 relative overflow-hidden group/card">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-emerald-500/30 transition-colors duration-300">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeout Date</p>
              </div>
              <p className="text-sm text-slate-200 font-medium">{formatDate(escrow.timeout)}</p>
            </div>
          </div>
        </div>

        {escrow.disputeRaised && (
          <div className="relative overflow-hidden mb-5 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5"></div>
            <div className="relative flex items-start gap-3">
              <div className="p-1.5 bg-red-500/20 rounded-lg border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400 mb-1">Dispute Raised</p>
                <p className="text-xs text-red-300 font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20 inline-block">
                  by {formatAddress(escrow.disputeRaiser)}
                </p>
              </div>
            </div>
          </div>
        )}

        {isTimedOut && escrow.status === 0 && (
          <div className="relative overflow-hidden mb-5 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-amber-500/5"></div>
            <div className="relative flex items-center gap-3">
              <div className="p-1.5 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm font-bold text-yellow-400">Escrow has timed out</p>
            </div>
          </div>
        )}

        {(canConfirm || canRefund || canDispute) && (
          <div className="flex gap-3 flex-wrap pt-5 border-t border-slate-700/50">
            {canConfirm && (
              <button
                onClick={() => handleAction('confirmCompletion')}
                disabled={isPending || isTxLoading || actionLoading === 'confirmCompletion'}
                className="relative flex-1 group/btn overflow-hidden min-w-[160px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-40 group-hover/btn:opacity-60 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {isPending || isTxLoading || actionLoading === 'confirmCompletion' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm</span>
                    </>
                  )}
                </div>
              </button>
            )}
            {canRefund && (
              <button
                onClick={() => handleAction('refund')}
                disabled={isPending || isTxLoading || actionLoading === 'refund'}
                className="relative flex-1 group/btn overflow-hidden min-w-[160px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-40 group-hover/btn:opacity-60 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
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
                </div>
              </button>
            )}
            {canDispute && (
              <button
                onClick={() => handleAction('raiseDispute')}
                disabled={isPending || isTxLoading || actionLoading === 'raiseDispute'}
                className="relative flex-1 group/btn overflow-hidden min-w-[160px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-40 group-hover/btn:opacity-60 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {isPending || isTxLoading || actionLoading === 'raiseDispute' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Dispute</span>
                    </>
                  )}
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
