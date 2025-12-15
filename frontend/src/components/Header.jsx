import { useAccount, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'
import WalletConnect from './WalletConnect'

export default function Header() {
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-md opacity-75"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Escrow USDC
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-xs font-medium text-slate-400">Arc Testnet</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-slate-700/50 shadow-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <span className="text-sm font-semibold text-slate-200">
                    {formatAddress(address)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 hover:bg-red-500/10 border border-slate-700/50 hover:border-red-500/50 rounded-xl transition-all duration-200 shadow-lg group"
                >
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
                  <span className="text-sm font-semibold text-slate-300 group-hover:text-red-400 transition-colors">
                    Disconnect
                  </span>
                </button>
              </>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}