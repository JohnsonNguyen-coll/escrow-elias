import { useState } from 'react'
import { useConnect, useAccount } from 'wagmi'
import { Wallet, X } from 'lucide-react'

export default function WalletConnect() {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()
  const [showOptions, setShowOptions] = useState(false)

  if (isConnected) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions((v) => !v)}
        className="relative overflow-hidden group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <Wallet className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Connect Wallet</span>
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowOptions(false)}
          ></div>
          <div className="absolute right-0 mt-3 w-72 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 z-20 overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
              <span className="text-sm font-bold text-white">Select Wallet</span>
              <button
                onClick={() => setShowOptions(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector })
                    setShowOptions(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-600/30 hover:border-slate-500/50 text-sm rounded-xl transition-all duration-200 group"
                >
                  <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {connector.name}
                  </span>
                  <Wallet className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Make sure you're on Arc Testnet (Chain ID 5042002)
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}